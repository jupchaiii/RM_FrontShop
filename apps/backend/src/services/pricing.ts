import { prisma } from '../lib/prisma';

export interface QuoteInput {
  fileSize: number; // bytes
  material: string;
  infill: number; // 0-100
  supportType: string; // None | Tree | Linear
  estimatedPrintTime?: number; // minutes; if omitted, estimated from file size
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

// Rough heuristic: larger files take longer to print.
// ~1 minute of print time per 40 KB, clamped to a sensible range.
export function estimatePrintTime(fileSize: number): number {
  const minutes = Math.round(fileSize / 40000);
  return Math.min(Math.max(minutes, 15), 60 * 48); // 15 min .. 48 h
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

  const estimatedTime = input.estimatedPrintTime ?? estimatePrintTime(input.fileSize);

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
