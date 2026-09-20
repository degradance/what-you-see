import { geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { land } from './land'
import { readPalette, type Palette } from './palette'
import { clamp, easeFactor, shortestDelta } from './view'

export interface GlobeFrame {
  ctx: CanvasRenderingContext2D
  now: number
  palette: Palette
  // False under reduced motion: overlays should draw a static state instead of animating.
  motion: boolean
  // Screen position of a coordinate, or null when it is on the far side.
  project: (lon: number, lat: number) => readonly [number, number] | null
  // Starts a new path holding this geometry; the caller decides whether to stroke or fill it.
  trace: (object: GeoPermissibleObjects) => void
}

export interface GlobeOptions {
  canvas: HTMLCanvasElement
  overlay?: (frame: GlobeFrame) => void
}

export interface Globe {
  // Motion on: a frame loop that spins the globe. Off: frames are drawn only when something changes.
  setMotion: (on: boolean) => void
  // Keeps a point at the centre of the disc instead of spinning; `null` goes back to spinning.
  follow: (target: { lon: number; lat: number } | null) => void
  invalidate: () => void
  dispose: () => void
}

const SPIN_DEG_PER_S = 6
// Spin is slow and pulses are soft, so 30 fps looks identical to 60 and halves the main-thread cost.
const FRAME_MS = 1000 / 30
const START_TILT = -20
// Tilting all the way to a high latitude would squash the map, and the followed point stays on the disc anyway.
const FOLLOW_MAX_TILT = 35
const FOLLOW_HALF_LIFE_MS = 300
// After a drag the user is looking somewhere on purpose; do not pull the globe back at once.
const FOLLOW_RESUME_MS = 4000
const MAX_DPR = 2
const PADDING = 2
const RAD_TO_DEG = 180 / Math.PI

export function createGlobe({ canvas, overlay }: GlobeOptions): Globe {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { setMotion() {}, follow() {}, invalidate() {}, dispose() {} }

  const projection = geoOrthographic().rotate([0, START_TILT])
  const path = geoPath(projection, ctx)
  const graticule = geoGraticule10()

  let palette = readPalette()
  let width = 0
  let height = 0
  let dpr = 1
  let lambda = 0
  let phi = START_TILT
  let motion = false
  let dragging = false
  let dragEndedAt = -Infinity
  let target: { lon: number; lat: number } | null = null
  let onScreen = true
  let frameId = 0
  let last = 0

  const radius = () => Math.min(width, height) / 2 - PADDING

  const project: GlobeFrame['project'] = (lon, lat) =>
    geoDistance([lon, lat], [-lambda, -phi]) < Math.PI / 2 ? projection([lon, lat]) : null

  const draw = () => {
    if (width === 0) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    projection
      .translate([width / 2, height / 2])
      .scale(radius())
      .rotate([lambda, phi])

    ctx.lineWidth = 1
    ctx.beginPath()
    path({ type: 'Sphere' })
    ctx.fillStyle = palette.surface2
    ctx.fill()

    ctx.beginPath()
    path(graticule)
    ctx.strokeStyle = palette.line
    ctx.lineWidth = 0.5
    ctx.stroke()

    ctx.beginPath()
    path(land)
    ctx.fillStyle = palette.line
    ctx.fill()
    ctx.strokeStyle = palette.muted
    ctx.lineWidth = 0.6
    ctx.stroke()

    ctx.beginPath()
    path({ type: 'Sphere' })
    ctx.strokeStyle = palette.muted
    ctx.lineWidth = 1
    ctx.stroke()

    const trace = (object: GeoPermissibleObjects) => {
      ctx.beginPath()
      path(object)
    }
    overlay?.({ ctx, now: Date.now(), palette, motion, project, trace })
  }

  const frame = (time: number) => {
    frameId = 0
    // A few ms of tolerance: rAF timestamps jitter, and a strict 33.3 ms check would often skip to the third frame (20 fps).
    if (motion && last && time - last < FRAME_MS - 4) {
      schedule()
      return
    }
    // A long gap (background tab, debugger) must not make the globe jump.
    const dt = last ? Math.min(time - last, 100) : 0
    last = time
    if (motion && !dragging) {
      if (!target) lambda += (SPIN_DEG_PER_S * dt) / 1000
      else if (!followPaused(time)) {
        const k = easeFactor(dt, FOLLOW_HALF_LIFE_MS)
        lambda += shortestDelta(lambda, -target.lon) * k
        phi += (followTilt(target) - phi) * k
      }
    }
    draw()
    if (motion && shouldRun()) schedule()
    else last = 0
  }

  const followTilt = (t: { lat: number }) => -clamp(t.lat, -FOLLOW_MAX_TILT, FOLLOW_MAX_TILT)
  const followPaused = (time: number) => dragging || time - dragEndedAt < FOLLOW_RESUME_MS

  const shouldRun = () => onScreen && !document.hidden

  const schedule = () => {
    if (!frameId) frameId = requestAnimationFrame(frame)
  }

  const invalidate = () => {
    if (shouldRun()) schedule()
  }

  const resize = (w: number, h: number) => {
    width = w
    height = h
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    invalidate()
  }

  const resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) resize(entry.contentRect.width, entry.contentRect.height)
  })
  resizeObserver.observe(canvas)

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true
    if (onScreen) invalidate()
  })
  intersectionObserver.observe(canvas)

  const onVisibilityChange = () => {
    if (!document.hidden) invalidate()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  // The shell owns the theme and only flips this attribute; watching it keeps `core` free of shell imports.
  const themeObserver = new MutationObserver(() => {
    palette = readPalette()
    invalidate()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  let dragX = 0
  let dragY = 0
  const onPointerDown = (e: PointerEvent) => {
    dragging = true
    dragX = e.clientX
    dragY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    // One pixel of drag moves the surface by one pixel at the centre of the disc.
    const degPerPx = RAD_TO_DEG / radius()
    lambda += (e.clientX - dragX) * degPerPx
    phi = Math.max(-90, Math.min(90, phi - (e.clientY - dragY) * degPerPx))
    dragX = e.clientX
    dragY = e.clientY
    invalidate()
  }
  const onPointerEnd = () => {
    if (dragging) dragEndedAt = performance.now()
    dragging = false
  }
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerEnd)
  canvas.addEventListener('pointercancel', onPointerEnd)

  return {
    setMotion(on) {
      motion = on
      invalidate()
    },
    follow(next) {
      const first = target === null
      target = next
      // Without a frame loop nothing eases, so every update snaps; with one, only the first does.
      if (next && (first || !motion) && !followPaused(performance.now())) {
        lambda = -next.lon
        phi = followTilt(next)
      }
      invalidate()
    },
    invalidate,
    dispose() {
      cancelAnimationFrame(frameId)
      frameId = 0
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerEnd)
      canvas.removeEventListener('pointercancel', onPointerEnd)
    },
  }
}
