// Plain counters on the hot path; the panel takes them once a second.
export class StreamMeter {
  private events = 0
  private ms = 0

  record(durationMs: number): void {
    this.events++
    this.ms += durationMs
  }

  // Returns what was counted since the last call and starts over.
  take(): { events: number; ms: number } {
    const taken = { events: this.events, ms: this.ms }
    this.events = 0
    this.ms = 0
    return taken
  }
}

export const streamMeter = new StreamMeter()
