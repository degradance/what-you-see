// Counts only fully elapsed seconds, so the current partial second never skews the average.
export class RateCounter {
  #ids: Float64Array
  #counts: Uint32Array
  #firstSecond = 0

  constructor(readonly windowSeconds: number) {
    if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
      throw new RangeError('windowSeconds must be a positive integer')
    }
    this.#ids = new Float64Array(windowSeconds)
    this.#counts = new Uint32Array(windowSeconds)
  }

  add(nowMs: number): void {
    const second = Math.floor(nowMs / 1000)
    if (this.#firstSecond === 0) this.#firstSecond = second
    const i = second % this.windowSeconds
    if (this.#ids[i] !== second) {
      this.#ids[i] = second
      this.#counts[i] = 0
    }
    this.#counts[i]!++
  }

  perSecond(nowMs: number): number {
    if (this.#firstSecond === 0) return 0
    const second = Math.floor(nowMs / 1000)
    // Until a full window has elapsed, average over the seconds seen so far.
    const elapsed = Math.min(this.windowSeconds, second - this.#firstSecond)
    if (elapsed < 1) return 0
    let total = 0
    for (let i = 0; i < this.windowSeconds; i++) {
      const id = this.#ids[i]!
      if (id >= second - elapsed && id < second) total += this.#counts[i]!
    }
    return total / elapsed
  }
}
