import { prisma } from '../lib/prisma';

export interface QuoteInput {
  fileSize: number; // bytes
  material: string;
  infill: number; // 0-100
  supportType: string; // None | Tree | Linear
  layerHeight?: number; // mm; thinner layers take longer to print
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
  subtotal: number;
  tax: number;
  total: number;
}

export interface QuoteResult {
  estimatedTime: number; // minutes
  estimatedCost: number; // THB (rounded up)
  breakdown: QuoteBreakdown;
}

const DEFAULT_MATERIAL_COSTS: Record<string, number> = {
  PLA: 50,
  PETG: 75,
  ASA: 110,
  TPU: 120,
};

const DEFAULTS = {
  baseCostPerHour: 100,
  minOrder: 50,
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

async function loadPricing(): Promise<{
  baseCostPerHour: number;
  materialCosts: Record<string, number>;
  minOrder: number;
}> {
  const cfg = await prisma.pricingConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!cfg) {
    return {
      baseCostPerHour: DEFAULTS.baseCostPerHour,
      materialCosts: DEFAULT_MATERIAL_COSTS,
      minOrder: DEFAULTS.minOrder,
    };
  }
  let materialCosts = DEFAULT_MATERIAL_COSTS;
  try {
    materialCosts = JSON.parse(cfg.materialCosts) as Record<string, number>;
  } catch {
    materialCosts = DEFAULT_MATERIAL_COSTS;
  }
  return {
    baseCostPerHour: cfg.baseCostPerHour,
    materialCosts,
    minOrder: cfg.minOrder,
  };
}

export async function calculateQuote(input: QuoteInput): Promise<QuoteResult> {
  const pricing = await loadPricing();

  const estimatedTime =
    input.estimatedPrintTime ?? estimatePrintTime(input.fileSize, input.infill, input.layerHeight);

  // 1. Material cost
  const materialCost = pricing.materialCosts[input.material] ?? 50;

  // 2. Print time cost
  const printCost = (estimatedTime / 60) * pricing.baseCostPerHour;

  // 3. Infill surcharge (0-50% extra)
  const infillMultiplier = 1 + (input.infill / 100) * 0.5;
  const infillSurcharge = printCost * infillMultiplier - printCost;

  // 4. Support surcharge
  let supportCost = 0;
  if (input.supportType === 'Tree') supportCost = printCost * 0.3;
  else if (input.supportType === 'Linear') supportCost = printCost * 0.15;

  // 5. Totals
  const subtotal = materialCost + printCost + infillSurcharge + supportCost;
  const withMinimum = Math.max(subtotal, pricing.minOrder);
  const tax = withMinimum * 0.07; // 7% VAT
  const total = withMinimum + tax;

  return {
    estimatedTime,
    estimatedCost: Math.ceil(total),
    breakdown: {
      material: round(materialCost),
      printTime: round(printCost),
      infillSurcharge: round(infillSurcharge),
      supportCost: round(supportCost),
      subtotal: round(withMinimum),
      tax: round(tax),
      total: round(total),
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
