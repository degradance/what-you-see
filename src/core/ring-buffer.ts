export class RingBuffer<T> {
  readonly capacity: number
  #items: (T | undefined)[]
  #next = 0
  #size = 0

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('capacity must be a positive integer')
    }
    this.capacity = capacity
    this.#items = new Array<T | undefined>(capacity)
  }

  get size(): number {
    return this.#size
  }

  push(item: T): void {
    this.#items[this.#next] = item
    this.#next = (this.#next + 1) % this.capacity
    if (this.#size < this.capacity) this.#size++
  }

  latest(count: number = this.#size): T[] {
    const n = Math.min(count, this.#size)
    const out: T[] = []
    for (let i = 1; i <= n; i++) {
      out.push(this.#items[(this.#next - i + this.capacity) % this.capacity] as T)
    }
    return out
  }

  clear(): void {
    this.#items.fill(undefined)
    this.#next = 0
    this.#size = 0
  }
}
