// Plain counters on the hot path; the panel takes them once a second. Work done in a worker is reported
// separately, because the point of a worker is that its time is not the main thread's.
export class StreamMeter {
  private events = 0
  private ms = 0
  private offThreadMs = 0

  record(durationMs: number): void {
    this.events++
    this.ms += durationMs
  }

  addOffThread(events: number, durationMs: number): void {
    this.events += events
    this.offThreadMs += durationMs
  }

  // Returns what was counted since the last call and starts over.
  take(): { events: number; ms: number; offThreadMs: number } {
    const taken = { events: this.events, ms: this.ms, offThreadMs: this.offThreadMs }
    this.events = 0
    this.ms = 0
    this.offThreadMs = 0
    return taken
  }
}

export const streamMeter = new StreamMeter()
