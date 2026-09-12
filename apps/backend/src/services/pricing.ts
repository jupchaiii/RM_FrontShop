import type { MeshGeometry } from './meshParser';

export interface QuoteInput {
  fileSize: number; // bytes
  material: string;
  infill: number; // 0-100
  supportType: string; // None | Tree | Linear
  layerHeight?: number; // mm; thinner layers take longer to print
  /**
   * Real mesh geometry extracted from an uploaded STL/OBJ file (see
   * services/meshParser.ts). When present, `calculateQuote` estimates print
   * time from actual volume/surface area/height instead of the file-size
   * heuristic. Only ever set this from geometry parsed server-side from a
   * file the server itself stored (e.g. via multer) — never from a client-
   * supplied value, for the same reason `estimatedPrintTime` below is not
   * exposed on the public /api/quote route.
   */
  geometry?: MeshGeometry;
  /**
   * Internal override (minutes). Not exposed on the public /api/quote route —
   * only trusted server-side code (e.g. a future real slicer integration)
   * should ever set this, since the caller could otherwise fake the price.
   */
  estimatedPrintTime?: number;
}

export interface QuoteBreakdown {
  material: number;
  printTime: number;
  infillSurcharge: number;
  supportCost: number;
  supportTime: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface QuoteResult {
  estimatedTime: number; // minutes
  estimatedCost: number; // THB (rounded up)
  breakdown: QuoteBreakdown;
}

const INTERNAL_PRICING_DEFAULTS = {
  machineCost: 30_000,
  machineLifeHours: 5_000,
  electricityPerHour: 5,
  laborPerJob: 50,
  consumablesPerJob: 10,
  packagingPerJob: 15,
  riskMultiplier: 3,
  marginPercent: 30,
};

// Prices are copied from internal-remaker-desktop's PricingCalculator.
const MATERIAL_PRICE_PER_KG: Record<string, number> = {
  PLA: 450,
  PETG: 450,
  ASA: 750,
  TPU: 1000,
};

// Used only to turn server-parsed mesh volume into the weight input expected
// by the reference calculator. The reference project receives grams directly;
// this web flow derives grams from the uploaded geometry instead.
const MATERIAL_DENSITY_G_PER_CM3: Record<string, number> = {
  PLA: 1.24,
  PETG: 1.27,
  ASA: 1.07,
  TPU: 1.21,
};

// Reference point the file-size heuristic below is calibrated against:
// ~20% infill, 0.2mm layers. estimatePrintTime() scales away from this
// reference using the job's actual infill/layerHeight.
const REFERENCE_INFILL = 20;
const REFERENCE_LAYER_HEIGHT = 0.2;

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Rough heuristic: larger files take longer to print, adjusted for infill
 * and layer height since both materially change print time and neither is
 * reflected in file size alone.
 *
 * This is still just an approximation from file size, not real geometry —
 * see REVIEW-NOTES.md for the plan to replace it with a geometry-based or
 * real-slicer estimate. This pass only fixes the part where infill/layerHeight
 * were collected from the user but silently ignored by the time estimate.
 */
export function estimatePrintTime(
  fileSize: number,
  infill: number = REFERENCE_INFILL,
  layerHeight: number = REFERENCE_LAYER_HEIGHT
): number {
  const baseMinutes = fileSize / 40000;

  // Thinner layers -> more layers -> more time. Clamped so a bad/zero value
  // can't blow up the estimate.
  const safeLayerHeight = clamp(layerHeight, 0.05, 0.6);
  const layerFactor = clamp(REFERENCE_LAYER_HEIGHT / safeLayerHeight, 0.5, 3);

  // Higher infill means more plastic laid down per layer -> more time.
  const safeInfill = clamp(infill, 0, 100);
  const infillFactor = clamp(1 + (safeInfill - REFERENCE_INFILL) * 0.006, 0.6, 1.6);

  const minutes = Math.round(baseMinutes * layerFactor * infillFactor);
  return clamp(minutes, 15, 60 * 48); // 15 min .. 48 h
}

// ---------------------------------------------------------------------------
// Geometry-based estimate (see docs/pricing-engine/ for the full design).
//
// Instead of guessing from file size, this estimates the volume of plastic
// that will actually be extruded (shell + infill) from the mesh's real
// volume/surface area, then converts that to time using an approximate
// flow rate, plus a per-layer overhead for travel/retraction/direction
// changes at each layer transition.
//
// Calibration status: the print speed / flow-rate constants below are set
// for the actual printer this deployment uses — a Bambu Lab P1S with its
// stock 0.4mm nozzle — using Bambu's own default "Max Volumetric Speed"
// filament profile values (Bambu Studio ships different MVS per material,
// since it's the real bottleneck on hotend throughput), corroborated across
// multiple sources:
//   - PLA:  ~21-22 mm^3/s (Bambu Studio's stock "Bambu PLA" profile MVS)
//   - PETG: ~18-20 mm^3/s (stock "Bambu PETG" profile MVS; PETG's HF/high-
//     flow variant profile is higher but that's a different filament, not
//     assumed here)
//   - ASA:  32 mm^3/s (P1S official tech-spec sheet benchmark figure is for
//     ABS, single 0.4mm wall — ASA is the closer material to ABS in this
//     app's material list, and the two have near-identical viscosity/flow
//     behavior, so the ABS figure is used for ASA)
//   - TPU:  printed far slower than rigid filaments on this printer (low
//     speed/travel to avoid grinding in the direct-drive extruder) — no
//     single authoritative MVS number was found, so this stays a
//     conservative estimate pending real calibration (Phase 3)
// The P1S scale/fixed overhead below use the verified non-support Test L
// slice. Tree-support calibration uses both the Test L and Tower pairs. The
// wall-thickness, overhang proxy and flow assumptions remain approximate, so
// more matched samples are required before treating this as slicer-accurate.
// ---------------------------------------------------------------------------

/**
 * Approximate volumetric flow rate (mm^3/s) achievable on this deployment's
 * printer (Bambu Lab P1S, stock 0.4mm nozzle) per material. See the
 * calibration-status comment above for sourcing.
 */
const MATERIAL_FLOW_RATE_MM3_PER_S: Record<string, number> = {
  PLA: 21,
  PETG: 18,
  ASA: 32,
  TPU: 6,
};
const DEFAULT_FLOW_RATE_MM3_PER_S = 18;

// Approximate perimeter/shell thickness (mm) — a few 0.4mm nozzle passes.
const WALL_THICKNESS_MM = 1.2;

// Fixed time cost (seconds) attributed to each layer change: travel moves,
// retraction, direction changes, plus non-planar detail that a pure
// volume/area estimate can't see.
const PER_LAYER_OVERHEAD_SECONDS = 1.5;

// Provisional P1S calibration from two verified paired slices:
// - Test L: 4075s non-support total, 1201s Tree-support overhead, 250 layers
// - Tower: 8387s non-support total, 412s Tree-support overhead, 604 layers
//
// The pairs show why a single `seconds per layer` value is not safe: the
// observed support/model ratios are very different. The support estimator
// therefore interpolates those ratios by reference layer count and only adds
// support time when the STL has a detectable above-bed overhang.
const P1S_GEOMETRY_TIME_SCALE = 2.6059680451;
const P1S_FIXED_JOB_OVERHEAD_SECONDS = 378;
const P1S_TREE_SUPPORT_CALIBRATIONS = [
  { referenceLayerCount: 250, basePrintSeconds: 4075, supportSeconds: 1201 },
  { referenceLayerCount: 604, basePrintSeconds: 8387, supportSeconds: 412 },
] as const;
const P1S_TREE_SUPPORT_FALLBACK_RATIO =
  P1S_TREE_SUPPORT_CALIBRATIONS.reduce((sum, point) => sum + point.supportSeconds, 0) /
  P1S_TREE_SUPPORT_CALIBRATIONS.reduce((sum, point) => sum + point.basePrintSeconds, 0);
const P1S_TREE_SUPPORT_MIN_RATIO =
  P1S_TREE_SUPPORT_CALIBRATIONS[1].supportSeconds /
  P1S_TREE_SUPPORT_CALIBRATIONS[1].basePrintSeconds;
const P1S_TREE_SUPPORT_MAX_RATIO =
  P1S_TREE_SUPPORT_CALIBRATIONS[0].supportSeconds /
  P1S_TREE_SUPPORT_CALIBRATIONS[0].basePrintSeconds;


function estimatePlasticVolumeMm3(
  geometry: MeshGeometry,
  infill: number = REFERENCE_INFILL
): number {
  const totalVolume = Math.max(geometry.volumeMm3, 0);
  const surfaceArea = Math.max(geometry.surfaceAreaMm2, 0);
  const shellVolume = Math.min(surfaceArea * WALL_THICKNESS_MM, totalVolume);
  const innerVolume = Math.max(totalVolume - shellVolume, 0);
  const safeInfill = clamp(infill, 0, 100) / 100;
  return shellVolume + innerVolume * safeInfill;
}

function estimateMaterialWeightGrams(
  geometry: MeshGeometry,
  infill: number,
  material: string
): number {
  const density = MATERIAL_DENSITY_G_PER_CM3[material] ?? 1.2;
  return (estimatePlasticVolumeMm3(geometry, infill) * density) / 1000;
}

/**
 * Returns the uncalibrated geometry seconds and layer count. Keeping this
 * separate lets the P1S calibration scale be applied before the minimum-time
 * clamp; otherwise tiny models would all be multiplied from the artificial
 * 15-minute floor.
 */
function estimateRawGeometryTime(
  geometry: MeshGeometry,
  infill: number = REFERENCE_INFILL,
  layerHeight: number = REFERENCE_LAYER_HEIGHT,
  material: string = 'PLA'
): { seconds: number; layerCount: number } {
  const safeLayerHeight = clamp(layerHeight, 0.05, 0.6);
  const plasticVolume = estimatePlasticVolumeMm3(geometry, infill);

  const flowRate = MATERIAL_FLOW_RATE_MM3_PER_S[material] ?? DEFAULT_FLOW_RATE_MM3_PER_S;
  const extrusionSeconds = plasticVolume / flowRate;
  const height = Math.max(geometry.boundingBox.max.z - geometry.boundingBox.min.z, 0);
  const layerCount = height > 0 ? Math.ceil(height / safeLayerHeight) : 1;

  return {
    seconds: extrusionSeconds + layerCount * PER_LAYER_OVERHEAD_SECONDS,
    layerCount,
  };
}

/**
 * Estimates the base print time from real mesh geometry using the provisional
 * P1S calibration from the verified Test L non-support slice. Support time is
 * added by `estimateSupportTimeMinutes` in `calculateQuote` so it is visible
 * in the quote breakdown and can be calibrated independently.
 */
function estimateCalibratedGeometrySeconds(
  geometry: MeshGeometry,
  infill: number = REFERENCE_INFILL,
  layerHeight: number = REFERENCE_LAYER_HEIGHT,
  material: string = 'PLA'
): number {
  const raw = estimateRawGeometryTime(geometry, infill, layerHeight, material);
  return raw.seconds * P1S_GEOMETRY_TIME_SCALE + P1S_FIXED_JOB_OVERHEAD_SECONDS;
}

export function estimatePrintTimeFromGeometry(
  geometry: MeshGeometry,
  infill: number = REFERENCE_INFILL,
  layerHeight: number = REFERENCE_LAYER_HEIGHT,
  material: string = 'PLA'
): number {
  const calibratedSeconds = estimateCalibratedGeometrySeconds(
    geometry,
    infill,
    layerHeight,
    material
  );
  return clamp(Math.round(calibratedSeconds / 60), 15, 60 * 48);
}

function interpolateTreeSupportRatio(referenceLayerCount: number): number {
  const [low, high] = P1S_TREE_SUPPORT_CALIBRATIONS;
  const layers = clamp(referenceLayerCount, low.referenceLayerCount, high.referenceLayerCount);

  if (layers === low.referenceLayerCount) return P1S_TREE_SUPPORT_MAX_RATIO;
  if (layers === high.referenceLayerCount) return P1S_TREE_SUPPORT_MIN_RATIO;

  // Interpolate in log space because support/model ratio falls sharply
  // between the small overhang-heavy Test L and the taller, lighter-support
  // Tower pair. This is an empirical bridge between two samples, not a claim
  // of slicer-level accuracy for arbitrary models.
  const fraction =
    Math.log(layers / low.referenceLayerCount) /
    Math.log(high.referenceLayerCount / low.referenceLayerCount);
  const logLow = Math.log(P1S_TREE_SUPPORT_MAX_RATIO);
  const logHigh = Math.log(P1S_TREE_SUPPORT_MIN_RATIO);
  return clamp(
    Math.exp(logLow + (logHigh - logLow) * fraction),
    P1S_TREE_SUPPORT_MIN_RATIO,
    P1S_TREE_SUPPORT_MAX_RATIO
  );
}

function estimateSupportTimeMinutes(
  supportType: string,
  baseSeconds: number,
  geometry: MeshGeometry | undefined
): number {
  // The verified support pairs are Tree support on the P1S. Do not claim a
  // Linear calibration until a Linear ON/OFF pair is supplied.
  if (supportType !== 'Tree') return 0;

  if (geometry) {
    // A cube can be selected with Tree Support but does not require any. This
    // overhang gate avoids charging every model with a layer-only surcharge.
    if (geometry.overhangSurfaceAreaMm2 <= 0.01) return 0;

    const height = Math.max(geometry.boundingBox.max.z - geometry.boundingBox.min.z, 0);
    const referenceLayerCount = Math.max(1, Math.ceil(height / REFERENCE_LAYER_HEIGHT));
    const supportRatio = interpolateTreeSupportRatio(referenceLayerCount);
    return (baseSeconds * supportRatio) / 60;
  }

  // Public JSON quotes have no geometry. Use the weighted average ratio from
  // both verified pairs instead of falling back to one pair's multiplier.
  return (baseSeconds * P1S_TREE_SUPPORT_FALLBACK_RATIO) / 60;
}

async function loadPricing(): Promise<{
  machineCost: number;
  machineLifeHours: number;
  electricityPerHour: number;
  laborPerJob: number;
  consumablesPerJob: number;
  packagingPerJob: number;
  riskMultiplier: number;
  marginPercent: number;
  materialPricePerKg: Record<string, number>;
}> {
  // Keep this server-side and deterministic. These are the defaults from
  // internal-remaker-desktop's PricingCalculator; the client never supplies
  // cost, margin, risk, or material-price values.
  return {
    ...INTERNAL_PRICING_DEFAULTS,
    materialPricePerKg: MATERIAL_PRICE_PER_KG,
  };
}

export async function calculateQuote(input: QuoteInput): Promise<QuoteResult> {
  const pricing = await loadPricing();

  const rawBaseEstimatedSeconds =
    input.estimatedPrintTime !== undefined
      ? input.estimatedPrintTime * 60
      : input.geometry
        ? estimateCalibratedGeometrySeconds(
            input.geometry,
            input.infill,
            input.layerHeight,
            input.material
          )
        : estimatePrintTime(input.fileSize, input.infill, input.layerHeight) * 60;
  const baseEstimatedSeconds = Math.max(rawBaseEstimatedSeconds, 15 * 60);
  const baseEstimatedTime = clamp(
    Math.round(baseEstimatedSeconds / 60),
    15,
    60 * 48
  );
  const supportTime = estimateSupportTimeMinutes(
    input.supportType,
    baseEstimatedSeconds,
    input.geometry
  );
  const estimatedTime = clamp(Math.round(baseEstimatedTime + supportTime), 15, 60 * 48);

  // internal-remaker-desktop receives weight in grams. For this web flow the
  // server derives it from parsed mesh volume; unsupported file formats use a
  // deliberately small byte-size fallback rather than trusting client input.
  const weightGrams = input.geometry
    ? estimateMaterialWeightGrams(input.geometry, input.infill, input.material)
    : Math.max(input.fileSize / 1000, 0);
  const pricePerKg = pricing.materialPricePerKg[input.material] ?? 500;

  // Match internal-remaker-desktop exactly:
  // filament = grams * price/kg / 1000 * risk
  // electricity = minutes * (฿/hour / 60) * risk
  // machine = minutes * ((machine cost / life hours) / 60)
  // labor = labor + consumables + packaging
  const filamentCost =
    weightGrams * (pricePerKg / 1000) * pricing.riskMultiplier;
  const electricityCost =
    estimatedTime * (pricing.electricityPerHour / 60) * pricing.riskMultiplier;
  const machineCost =
    estimatedTime * ((pricing.machineCost / pricing.machineLifeHours) / 60);
  const laborCost =
    pricing.laborPerJob + pricing.consumablesPerJob + pricing.packagingPerJob;
  const totalCost = filamentCost + electricityCost + machineCost + laborCost;
  const marginFactor = 1 - pricing.marginPercent / 100;
  const unitPrice = Math.ceil(totalCost / (marginFactor || 0.01));

  return {
    estimatedTime,
    estimatedCost: unitPrice,
    breakdown: {
      material: round(filamentCost),
      // Kept for API compatibility; the upload UI intentionally hides details.
      printTime: round(electricityCost + machineCost),
      infillSurcharge: 0,
      supportCost: 0,
      supportTime: round(supportTime),
      subtotal: round(totalCost),
      tax: 0,
      total: round(unitPrice),
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
