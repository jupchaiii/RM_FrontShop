import { Router } from 'express';
import { z } from 'zod';
import { calculateQuote } from '../services/pricing';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';

export const quoteRouter = Router();

// Note: `estimatedPrintTime` is deliberately NOT accepted here. This is a
// public, unauthenticated endpoint — if it trusted a client-supplied time it
// would let anyone quote whatever price they want. The server always derives
// the time estimate itself from fileSize/infill/layerHeight.
const quoteSchema = z.object({
  fileSize: z.number().int().positive(),
  material: z.string().min(1),
  infill: z.number().min(0).max(100).default(20),
  supportType: z.enum(['None', 'Tree', 'Linear']).default('None'),
  layerHeight: z.number().positive().default(0.2),
});

quoteRouter.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const input = quoteSchema.parse(req.body);
    const result = await calculateQuote(input);
    res.json(result);
  })
);

export interface MaterialSpec {
  id: string;
  name: string;
  description: string;
  costPerUnit: number;
  strength: number; // 1-5
  heatResistance: number; // 1-5 (ทนแดด/ทนร้อน)
  finish: string; // ผิวสัมผัส
  summary: string; // ข้อดี/ข้อเสีย
}

export const MATERIALS: MaterialSpec[] = [
  {
    id: 'PLA',
    name: 'PLA',
    description: 'ทั่วไป ใช้ง่าย เหมาะกับงานตั้งโชว์',
    costPerUnit: 50,
    strength: 2,
    heatResistance: 1,
    finish: 'เรียบ สวย Layer บาง',
    summary: 'สวย ถูก แต่ไม่ทนร้อน',
  },
  {
    id: 'PETG',
    name: 'PETG',
    description: 'ทนความร้อน/แรงกระแทกดีกว่า PLA',
    costPerUnit: 75,
    strength: 3,
    heatResistance: 3,
    finish: 'เงา',
    summary: 'อึดกว่า PLA ไม่ละลาย',
  },
  {
    id: 'ASA',
    name: 'ASA',
    description: 'ทนแดด ทนแสง UV เหมาะงานกลางแจ้ง',
    costPerUnit: 110,
    strength: 4,
    heatResistance: 5,
    finish: 'ด้าน',
    summary: 'งานโปร ทนจริง',
  },
  {
    id: 'TPU',
    name: 'TPU',
    description: 'ยืดหยุ่น นิ่ม เหมาะงานยาง',
    costPerUnit: 120,
    strength: 3,
    heatResistance: 2,
    finish: 'ยืดหยุ่น',
    summary: 'บีบได้ งอได้',
  },
];

quoteRouter.get('/materials', (_req, res) => {
  res.json({ materials: MATERIALS });
});

quoteRouter.get(
  '/pricing/config',
  asyncHandler(async (_req, res) => {
    const cfg = await prisma.pricingConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!cfg) {
      return res.json({
        baseCostPerHour: 100,
        materialCosts: { PLA: 50, PETG: 75, ABS: 100, TPU: 120 },
        minOrder: 50,
      });
    }
    let materialCosts: Record<string, number> = {};
    try {
      materialCosts = JSON.parse(cfg.materialCosts);
    } catch {
      materialCosts = {};
    }
    res.json({
      baseCostPerHour: cfg.baseCostPerHour,
      materialCosts,
      minOrder: cfg.minOrder,
      rushFee: cfg.rushFee,
      maxFileSize: cfg.maxFileSize,
    });
  })
);
