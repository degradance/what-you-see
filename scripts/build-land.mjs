// Regenerates src/core/globe/land.json from the world-atlas package (Natural Earth, public domain).
// The source is quantized to ~0.004 degrees, far finer than a card-sized globe can show (one pixel is ~0.3 degrees);
// coarsening the grid to 3000 steps halves the gzip size of the chunk that ships it.
import { readFileSync, writeFileSync } from 'node:fs'
import { quantize } from 'topojson-client'

const STEPS = 3000
const source = new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)
const target = new URL('../src/core/globe/land.json', import.meta.url)

const topology = JSON.parse(readFileSync(source, 'utf8'))
const {
  scale: [sx, sy],
  translate: [tx, ty],
} = topology.transform

// `quantize` refuses an already quantized topology, so arcs are decoded to absolute coordinates first.
const decoded = {
  ...topology,
  arcs: topology.arcs.map((arc) => {
    let x = 0
    let y = 0
    return arc.map(([dx, dy]) => [(x += dx) * sx + tx, (y += dy) * sy + ty])
  }),
}
delete decoded.transform

const output = JSON.stringify(quantize(decoded, STEPS))
writeFileSync(target, output + '\n')
console.log(`wrote ${target.pathname} (${output.length} bytes)`)
