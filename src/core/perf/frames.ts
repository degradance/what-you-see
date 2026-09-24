// Counts animation frames per window. Idle, it reads the display refresh rate (60, 120);
// the worst frame is the honest signal, because one stalled frame hides inside an average.
export class FrameMeter {
  private frames = 0
  private worst = 0
  private last: number | undefined
  private windowStart: number | undefined

  tick(now: number): void {
    if (this.last !== undefined) this.worst = Math.max(this.worst, now - this.last)
    this.windowStart ??= now
    this.last = now
    this.frames++
  }

  // Returns the stats of the elapsed window and starts the next one; undefined before any frame.
  flush(now: number): { fps: number; worstMs: number } | undefined {
    if (this.windowStart === undefined || now <= this.windowStart) return undefined
    const stats = { fps: Math.round((this.frames * 1000) / (now - this.windowStart)), worstMs: Math.round(this.worst) }
    this.frames = 0
    this.worst = 0
    this.windowStart = now
    return stats
  }

  // A hidden tab stops animation frames; the gap on return is not a stall.
  reset(): void {
    this.frames = 0
    this.worst = 0
    this.last = undefined
    this.windowStart = undefined
  }
}
