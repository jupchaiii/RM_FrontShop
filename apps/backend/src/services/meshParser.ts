/**
 * Pure-TypeScript mesh geometry parser for STL and OBJ files.
 *
 * Why this exists: `services/pricing.ts` previously estimated print time from
 * raw file *byte size*, which correlates poorly with actual print time (a
 * small object exported with a dense mesh is a large file; a large object
 * exported coarsely is a small file). This module extracts real geometry
 * (volume, surface area, bounding box) from the uploaded file so pricing can
 * be based on the actual size/shape of the model instead.
 *
 * Design constraints (see docs/pricing-engine/README.md):
 * - No native dependencies. This must run on a Raspberry Pi 4 (ARM), and the
 *   project has previously hit npm-registry-blocked situations, so anything
 *   requiring a prebuilt native binary (slicer engines, etc.) is off the
 *   table. Everything here is plain buffer/string parsing.
 * - Callers must only ever parse bytes read from a file actually stored by
 *   the server (e.g. via multer). Geometry must never be trusted if it were
 *   to arrive directly from a client request body — that would reopen the
 *   same "client can fake the price" hole that `estimatedPrintTime` was
 *   deliberately removed from the public /api/quote endpoint for.
 */

export interface BoundingBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export interface MeshGeometry {
  volumeMm3: number;
  surfaceAreaMm2: number;
  /** Approximate downward-facing surface area above the build plate. */
  overhangSurfaceAreaMm2: number;
  boundingBox: BoundingBox;
  triangleCount: number;
}

export class MeshParseError extends Error {}

// Guard rails: an attacker (or just a malformed/huge file) shouldn't be able
// to make parsing consume unbounded memory/CPU. These caps are generous for
// legitimate consumer-grade 3D prints but bound the worst case.
const MAX_TRIANGLES = 6_000_000;
const MAX_OBJ_VERTICES = 6_000_000;

// Bambu's support threshold is an angle setting. Without running a slicer we
// use the triangle normal as a conservative overhang proxy: downward-facing
// faces are candidates, while the lowest horizontal faces are the build-plate
// contact and are excluded from support demand.
const OVERHANG_NORMAL_Z_THRESHOLD = -0.5;
const HORIZONTAL_NORMAL_Z_THRESHOLD = -0.866;
const PLANAR_Z_EPSILON_MM = 1e-4;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Accumulates volume/surface-area/bounding-box across triangles without
 * needing to hold the whole triangle list in memory at once.
 */
class GeometryAccumulator {
  private signedVolumeSum = 0;
  private surfaceAreaSum = 0;
  private downwardSurfaceAreaSum = 0;
  private lowestHorizontalZ = Infinity;
  private lowestHorizontalArea = 0;
  private triangleCount = 0;
  private minX = Infinity;
  private minY = Infinity;
  private minZ = Infinity;
  private maxX = -Infinity;
  private maxY = -Infinity;
  private maxZ = -Infinity;

  addTriangle(v1: Vec3, v2: Vec3, v3: Vec3): void {
    this.triangleCount++;
    if (this.triangleCount > MAX_TRIANGLES) {
      throw new MeshParseError(
        `Mesh exceeds the maximum supported triangle count (${MAX_TRIANGLES})`
      );
    }

    // Signed volume of the tetrahedron formed by the triangle and the
    // origin: (v1 . (v2 x v3)) / 6. Summed over a closed, consistently
    // wound mesh this gives the mesh's true volume (sign cancels out for
    // triangles facing away from the origin).
    const crossX = v2.y * v3.z - v2.z * v3.y;
    const crossY = v2.z * v3.x - v2.x * v3.z;
    const crossZ = v2.x * v3.y - v2.y * v3.x;
    this.signedVolumeSum += v1.x * crossX + v1.y * crossY + v1.z * crossZ;

    // Triangle area via cross product magnitude: |(v2-v1) x (v3-v1)| / 2.
    const ux = v2.x - v1.x;
    const uy = v2.y - v1.y;
    const uz = v2.z - v1.z;
    const wx = v3.x - v1.x;
    const wy = v3.y - v1.y;
    const wz = v3.z - v1.z;
    const areaCrossX = uy * wz - uz * wy;
    const areaCrossY = uz * wx - ux * wz;
    const areaCrossZ = ux * wy - uy * wx;
    const areaCrossMag = Math.sqrt(
      areaCrossX * areaCrossX + areaCrossY * areaCrossY + areaCrossZ * areaCrossZ
    );
    const triangleArea = areaCrossMag / 2;
    this.surfaceAreaSum += triangleArea;

    if (areaCrossMag > 0) {
      const normalZ = areaCrossZ / areaCrossMag;
      if (normalZ < OVERHANG_NORMAL_Z_THRESHOLD) {
        this.downwardSurfaceAreaSum += triangleArea;

        const triangleMinZ = Math.min(v1.z, v2.z, v3.z);
        const triangleMaxZ = Math.max(v1.z, v2.z, v3.z);
        if (
          normalZ < HORIZONTAL_NORMAL_Z_THRESHOLD &&
          triangleMaxZ - triangleMinZ <= PLANAR_Z_EPSILON_MM
        ) {
          if (triangleMinZ < this.lowestHorizontalZ - PLANAR_Z_EPSILON_MM) {
            this.lowestHorizontalZ = triangleMinZ;
            this.lowestHorizontalArea = triangleArea;
          } else if (Math.abs(triangleMinZ - this.lowestHorizontalZ) <= PLANAR_Z_EPSILON_MM) {
            this.lowestHorizontalArea += triangleArea;
          }
        }
      }
    }

    for (const v of [v1, v2, v3]) {
      if (v.x < this.minX) this.minX = v.x;
      if (v.y < this.minY) this.minY = v.y;
      if (v.z < this.minZ) this.minZ = v.z;
      if (v.x > this.maxX) this.maxX = v.x;
      if (v.y > this.maxY) this.maxY = v.y;
      if (v.z > this.maxZ) this.maxZ = v.z;
    }
  }

  finalize(): MeshGeometry {
    if (this.triangleCount === 0) {
      throw new MeshParseError('Mesh contains no triangles');
    }
    return {
      // |signedVolumeSum / 6| — magnitude only; winding order of the source
      // file isn't guaranteed to match our sign convention.
      volumeMm3: Math.abs(this.signedVolumeSum / 6),
      surfaceAreaMm2: this.surfaceAreaSum,
      overhangSurfaceAreaMm2: Math.max(
        this.downwardSurfaceAreaSum - this.lowestHorizontalArea,
        0
      ),
      boundingBox: {
        min: { x: this.minX, y: this.minY, z: this.minZ },
        max: { x: this.maxX, y: this.maxY, z: this.maxZ },
      },
      triangleCount: this.triangleCount,
    };
  }
}

/**
 * Parses an STL file (binary or ASCII, auto-detected) into mesh geometry.
 */
export function parseSTL(buffer: Buffer): MeshGeometry {
  if (buffer.length < 6) {
    throw new MeshParseError('File is too small to be a valid STL');
  }
  if (isLikelyAsciiSTL(buffer)) {
    return parseAsciiSTL(buffer);
  }
  return parseBinarySTL(buffer);
}

function isLikelyAsciiSTL(buffer: Buffer): boolean {
  // Binary STL starts with an arbitrary 80-byte header, so an ASCII-looking
  // prefix ("solid ") is a strong but not 100% certain signal. We also
  // cross-check that the declared binary triangle count would match the
  // buffer length; if it doesn't, we treat it as ASCII instead.
  const prefix = buffer.subarray(0, Math.min(5, buffer.length)).toString('utf8').toLowerCase();
  const looksAscii = prefix === 'solid';
  if (!looksAscii) return false;

  if (buffer.length < 84) return true;
  const declaredTriangles = buffer.readUInt32LE(80);
  const expectedBinaryLength = 84 + declaredTriangles * 50;
  return expectedBinaryLength !== buffer.length;
}

function parseBinarySTL(buffer: Buffer): MeshGeometry {
  const HEADER_SIZE = 80;
  const TRIANGLE_RECORD_SIZE = 50; // 12 (normal) + 36 (3 vertices) + 2 (attr byte count)

  if (buffer.length < HEADER_SIZE + 4) {
    throw new MeshParseError('Binary STL is missing its header/triangle count');
  }

  const triangleCount = buffer.readUInt32LE(HEADER_SIZE);
  if (triangleCount > MAX_TRIANGLES) {
    throw new MeshParseError(
      `Mesh exceeds the maximum supported triangle count (${MAX_TRIANGLES})`
    );
  }

  const expectedLength = HEADER_SIZE + 4 + triangleCount * TRIANGLE_RECORD_SIZE;
  if (buffer.length < expectedLength) {
    throw new MeshParseError(
      'Binary STL file is truncated (declared triangle count exceeds file size)'
    );
  }

  const acc = new GeometryAccumulator();
  let offset = HEADER_SIZE + 4;
  for (let i = 0; i < triangleCount; i++) {
    // Skip the 12-byte normal vector — we recompute geometry from vertices.
    offset += 12;
    const v1 = readVec3LE(buffer, offset);
    offset += 12;
    const v2 = readVec3LE(buffer, offset);
    offset += 12;
    const v3 = readVec3LE(buffer, offset);
    offset += 12;
    offset += 2; // attribute byte count, unused

    if (isFiniteVec3(v1) && isFiniteVec3(v2) && isFiniteVec3(v3)) {
      acc.addTriangle(v1, v2, v3);
    }
  }

  return acc.finalize();
}

function readVec3LE(buffer: Buffer, offset: number): Vec3 {
  return {
    x: buffer.readFloatLE(offset),
    y: buffer.readFloatLE(offset + 4),
    z: buffer.readFloatLE(offset + 8),
  };
}

function isFiniteVec3(v: Vec3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

function parseAsciiSTL(buffer: Buffer): MeshGeometry {
  const text = buffer.toString('utf8');
  const acc = new GeometryAccumulator();

  // Matches each "vertex x y z" line; we intentionally ignore facet/normal
  // lines and just group vertices in threes (one STL facet = exactly 3
  // vertices, always).
  const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  let match: RegExpExecArray | null;
  let pending: Vec3[] = [];

  while ((match = vertexRegex.exec(text)) !== null) {
    const v: Vec3 = {
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      z: parseFloat(match[3]),
    };
    if (!isFiniteVec3(v)) {
      throw new MeshParseError('ASCII STL contains a non-numeric vertex');
    }
    pending.push(v);
    if (pending.length === 3) {
      acc.addTriangle(pending[0], pending[1], pending[2]);
      pending = [];
    }
  }

  if (pending.length !== 0) {
    throw new MeshParseError('ASCII STL has an incomplete facet (vertex count not a multiple of 3)');
  }

  return acc.finalize();
}

/**
 * Parses a Wavefront OBJ file into mesh geometry. Only `v` (vertex) and `f`
 * (face) directives are used; faces with more than 3 vertices (n-gons) are
 * fan-triangulated from the first vertex. Materials, normals, texture
 * coordinates, and other directives are ignored — we only need geometry.
 */
export function parseOBJ(buffer: Buffer): MeshGeometry {
  const text = buffer.toString('utf8');
  const vertices: Vec3[] = [];
  const acc = new GeometryAccumulator();

  const lines = text.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    if (line.startsWith('v ') || line === 'v') {
      const parts = line.split(/\s+/);
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new MeshParseError('OBJ file contains a non-numeric vertex');
      }
      vertices.push({ x, y, z });
      if (vertices.length > MAX_OBJ_VERTICES) {
        throw new MeshParseError(
          `Mesh exceeds the maximum supported vertex count (${MAX_OBJ_VERTICES})`
        );
      }
      continue;
    }

    if (line.startsWith('f ') || line === 'f') {
      const parts = line.split(/\s+/).slice(1);
      // Each face token can be "v", "v/vt", "v/vt/vn", or "v//vn" — we only
      // need the vertex index (first component).
      const indices = parts.map((token) => {
        const idxStr = token.split('/')[0];
        const idx = parseInt(idxStr, 10);
        // OBJ indices are 1-based, and may be negative (relative to the end
        // of the vertex list so far).
        return idx > 0 ? idx - 1 : vertices.length + idx;
      });

      if (indices.some((i) => i < 0 || i >= vertices.length || !Number.isFinite(i))) {
        throw new MeshParseError('OBJ face references an out-of-range vertex index');
      }
      if (indices.length < 3) {
        throw new MeshParseError('OBJ face has fewer than 3 vertices');
      }

      // Fan-triangulate: (0,1,2), (0,2,3), (0,3,4), ...
      const v0 = vertices[indices[0]];
      for (let i = 1; i < indices.length - 1; i++) {
        const v1 = vertices[indices[i]];
        const v2 = vertices[indices[i + 1]];
        acc.addTriangle(v0, v1, v2);
      }
    }
  }

  return acc.finalize();
}

/**
 * Parses mesh geometry from a buffer based on file extension. Returns `null`
 * (rather than throwing) for unsupported extensions, so callers can fall
 * back to the byte-size heuristic without special-casing every format.
 */
export function parseMeshGeometry(buffer: Buffer, fileName: string): MeshGeometry | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'stl') return parseSTL(buffer);
  if (ext === 'obj') return parseOBJ(buffer);
  return null;
}

/**
 * Same as `parseMeshGeometry`, but swallows parse errors and returns `null`
 * instead of throwing. Intended for the request-handling path, where a
 * malformed file should degrade gracefully to the heuristic estimate rather
 * than failing the whole upload.
 */
export function tryParseMeshGeometry(buffer: Buffer, fileName: string): MeshGeometry | null {
  try {
    return parseMeshGeometry(buffer, fileName);
  } catch {
    return null;
  }
}
