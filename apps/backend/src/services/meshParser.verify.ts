/**
 * Verification script for meshParser.ts — not a full test suite (no test
 * framework is set up in this backend yet, see docs/pricing-engine/phases.md
 * Phase 1 notes), but a runnable script with hand-computed expected values
 * for known geometry (cubes, pyramids) plus malformed-input handling.
 *
 * Run with: npx tsx src/services/meshParser.verify.ts
 */
import {
  parseSTL,
  parseOBJ,
  parseMeshGeometry,
  tryParseMeshGeometry,
  MeshParseError,
} from './meshParser';

let passed = 0;
let failed = 0;

function approxEqual(a: number, b: number, tolerance = 1e-3): boolean {
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b));
}

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ok  - ${name}`);
  } else {
    failed++;
    console.error(`  FAIL - ${name}${detail ? ` (${detail})` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

/** Builds a binary STL buffer for an axis-aligned box from 0,0,0 to sx,sy,sz. */
function buildBinaryCubeSTL(sx: number, sy: number, sz: number): Buffer {
  // 12 triangles (2 per face x 6 faces), standard box triangulation.
  const p = [
    [0, 0, 0],
    [sx, 0, 0],
    [sx, sy, 0],
    [0, sy, 0],
    [0, 0, sz],
    [sx, 0, sz],
    [sx, sy, sz],
    [0, sy, sz],
  ];
  const faces: [number, number, number][] = [
    // bottom (z=0)
    [0, 2, 1],
    [0, 3, 2],
    // top (z=sz)
    [4, 5, 6],
    [4, 6, 7],
    // front (y=0)
    [0, 1, 5],
    [0, 5, 4],
    // back (y=sy)
    [3, 6, 2],
    [3, 7, 6],
    // left (x=0)
    [0, 4, 7],
    [0, 7, 3],
    // right (x=sx)
    [1, 2, 6],
    [1, 6, 5],
  ];

  const triangleCount = faces.length;
  const buffer = Buffer.alloc(84 + triangleCount * 50);
  buffer.write('binary cube fixture', 0, 'utf8');
  buffer.writeUInt32LE(triangleCount, 80);

  let offset = 84;
  for (const [a, b, c] of faces) {
    // normal (unused by parser, write zeros)
    buffer.writeFloatLE(0, offset);
    buffer.writeFloatLE(0, offset + 4);
    buffer.writeFloatLE(0, offset + 8);
    offset += 12;
    for (const idx of [a, b, c]) {
      buffer.writeFloatLE(p[idx][0], offset);
      buffer.writeFloatLE(p[idx][1], offset + 4);
      buffer.writeFloatLE(p[idx][2], offset + 8);
      offset += 12;
    }
    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }
  return buffer;
}

function buildAsciiCubeSTL(sx: number, sy: number, sz: number): Buffer {
  const p = [
    [0, 0, 0],
    [sx, 0, 0],
    [sx, sy, 0],
    [0, sy, 0],
    [0, 0, sz],
    [sx, 0, sz],
    [sx, sy, sz],
    [0, sy, sz],
  ];
  const faces: [number, number, number][] = [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [3, 6, 2],
    [3, 7, 6],
    [0, 4, 7],
    [0, 7, 3],
    [1, 2, 6],
    [1, 6, 5],
  ];
  const lines: string[] = ['solid cube'];
  for (const [a, b, c] of faces) {
    lines.push('  facet normal 0 0 0');
    lines.push('    outer loop');
    for (const idx of [a, b, c]) {
      lines.push(`      vertex ${p[idx][0]} ${p[idx][1]} ${p[idx][2]}`);
    }
    lines.push('    endloop');
    lines.push('  endfacet');
  }
  lines.push('endsolid cube');
  return Buffer.from(lines.join('\n'), 'utf8');
}

function buildCubeOBJ(sx: number, sy: number, sz: number): Buffer {
  const p = [
    [0, 0, 0],
    [sx, 0, 0],
    [sx, sy, 0],
    [0, sy, 0],
    [0, 0, sz],
    [sx, 0, sz],
    [sx, sy, sz],
    [0, sy, sz],
  ];
  // OBJ faces here are 1-based; use quads to also exercise fan-triangulation.
  const faces: number[][] = [
    [1, 3, 2],
    [1, 4, 3],
    [5, 6, 7],
    [5, 7, 8],
    [1, 2, 6],
    [1, 6, 5],
    [4, 7, 3],
    [4, 8, 7],
    [1, 5, 8],
    [1, 8, 4],
    [2, 3, 7],
    [2, 7, 6],
  ];
  const lines: string[] = [];
  for (const v of p) lines.push(`v ${v[0]} ${v[1]} ${v[2]}`);
  for (const f of faces) lines.push(`f ${f.join(' ')}`);
  return Buffer.from(lines.join('\n'), 'utf8');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('meshParser verification\n');

console.log('binary STL cube (10x10x10mm):');
{
  const buf = buildBinaryCubeSTL(10, 10, 10);
  const geo = parseSTL(buf);
  check('volume ~= 1000mm^3', approxEqual(geo.volumeMm3, 1000), `got ${geo.volumeMm3}`);
  check('surfaceArea ~= 600mm^2', approxEqual(geo.surfaceAreaMm2, 600), `got ${geo.surfaceAreaMm2}`);
  check(
    'cube has no supportable overhang above the build plate',
    approxEqual(geo.overhangSurfaceAreaMm2, 0),
    `got ${geo.overhangSurfaceAreaMm2}`
  );
  check('triangleCount === 12', geo.triangleCount === 12, `got ${geo.triangleCount}`);
  check(
    'bounding box matches 10x10x10',
    geo.boundingBox.max.x === 10 && geo.boundingBox.max.y === 10 && geo.boundingBox.max.z === 10,
    JSON.stringify(geo.boundingBox)
  );
}

console.log('\nbinary STL rectangular box (2x3x4mm):');
{
  const buf = buildBinaryCubeSTL(2, 3, 4);
  const geo = parseSTL(buf);
  // volume = 2*3*4 = 24; surface area = 2*(2*3 + 3*4 + 2*4) = 2*(6+12+8) = 52
  check('volume ~= 24mm^3', approxEqual(geo.volumeMm3, 24), `got ${geo.volumeMm3}`);
  check('surfaceArea ~= 52mm^2', approxEqual(geo.surfaceAreaMm2, 52), `got ${geo.surfaceAreaMm2}`);
}

console.log('\nASCII STL cube (5x5x5mm):');
{
  const buf = buildAsciiCubeSTL(5, 5, 5);
  const geo = parseSTL(buf);
  check('volume ~= 125mm^3', approxEqual(geo.volumeMm3, 125), `got ${geo.volumeMm3}`);
  check('surfaceArea ~= 150mm^2', approxEqual(geo.surfaceAreaMm2, 150), `got ${geo.surfaceAreaMm2}`);
  check('triangleCount === 12', geo.triangleCount === 12, `got ${geo.triangleCount}`);
}

console.log('\nOBJ cube with quad faces, fan-triangulated (8x8x8mm):');
{
  const buf = buildCubeOBJ(8, 8, 8);
  const geo = parseOBJ(buf);
  check('volume ~= 512mm^3', approxEqual(geo.volumeMm3, 512), `got ${geo.volumeMm3}`);
  check('surfaceArea ~= 384mm^2', approxEqual(geo.surfaceAreaMm2, 384), `got ${geo.surfaceAreaMm2}`);
}

console.log('\nparseMeshGeometry format dispatch:');
{
  const stlBuf = buildBinaryCubeSTL(1, 1, 1);
  const objBuf = buildCubeOBJ(1, 1, 1);
  check('dispatches .stl to STL parser', parseMeshGeometry(stlBuf, 'model.STL')?.triangleCount === 12);
  check('dispatches .obj to OBJ parser', parseMeshGeometry(objBuf, 'model.obj')?.triangleCount === 12);
  check('returns null for unsupported extension', parseMeshGeometry(stlBuf, 'model.3mf') === null);
}

console.log('\nmalformed input handling:');
{
  let threw = false;
  try {
    parseSTL(Buffer.from('x'));
  } catch (e) {
    threw = e instanceof MeshParseError;
  }
  check('tiny buffer throws MeshParseError', threw);

  let truncatedThrew = false;
  try {
    const goodBuf = buildBinaryCubeSTL(10, 10, 10);
    const truncated = goodBuf.subarray(0, goodBuf.length - 20);
    parseSTL(truncated);
  } catch (e) {
    truncatedThrew = e instanceof MeshParseError;
  }
  check('truncated binary STL throws MeshParseError', truncatedThrew);

  const result = tryParseMeshGeometry(Buffer.from('garbage'), 'broken.stl');
  check('tryParseMeshGeometry swallows errors and returns null', result === null);

  let emptyThrew = false;
  try {
    parseOBJ(Buffer.from('# just a comment\n'));
  } catch (e) {
    emptyThrew = e instanceof MeshParseError;
  }
  check('OBJ with no faces throws MeshParseError', emptyThrew);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
