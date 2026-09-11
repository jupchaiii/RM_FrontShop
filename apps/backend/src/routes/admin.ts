import { Router } from 'express';
import fs from 'fs/promises';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

/* ----------------------------- Projects ----------------------------- */

adminRouter.get(
  '/projects',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) ?? '20', 10)));
    const status = req.query.status as string | undefined;

    const where = status ? { status } : {};
    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { email: true, name: true } } },
      }),
    ]);

    res.json({ projects, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  })
);

const statusSchema = z.object({
  status: z.enum(['QUOTED', 'PENDING', 'PRINTING', 'COMPLETED', 'DELIVERED', 'CANCELLED']),
});

adminRouter.patch(
  '/projects/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Project not found');

    const timestamps: Record<string, Date> = {};
    if (status === 'PRINTING' && !existing.startedAt) timestamps.startedAt = new Date();
    if (status === 'COMPLETED' && !existing.completedAt) timestamps.completedAt = new Date();
    if (status === 'DELIVERED' && !existing.pickupAt) timestamps.pickupAt = new Date();

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status, ...timestamps },
    });
    res.json({ project });
  })
);

const costSchema = z.object({ actualCost: z.number().nonnegative() });

adminRouter.patch(
  '/projects/:id/cost',
  asyncHandler(async (req, res) => {
    const { actualCost } = costSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { actualCost },
    });
    res.json({ project });
  })
);

// Permanently deletes the project record AND its uploaded file on disk.
// This is a hard delete (unlike the customer-facing DELETE /api/projects/:id,
// which only soft-cancels so order history is preserved) — it's meant for an
// admin purging a bad/spam/test record. Storage on a Pi is limited, so we
// can't afford to leave the file behind every time this runs.
adminRouter.delete(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Project not found');

    await prisma.project.delete({ where: { id: req.params.id } });

    if (existing.filePath && !existing.filePath.startsWith('seed://')) {
      try {
        await fs.unlink(existing.filePath);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') {
          // eslint-disable-next-line no-console
          console.error(`[admin] failed to remove uploaded file for project ${existing.id}:`, err);
        }
      }
    }

    res.json({ ok: true });
  })
);

/* ----------------------------- Gallery ------------------------------ */

const gallerySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().min(1),
  material: z.string().min(1),
  purpose: z.string().min(1),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
  projectId: z.string().optional(),
});

adminRouter.post(
  '/gallery',
  asyncHandler(async (req, res) => {
    const data = gallerySchema.parse(req.body);
    const item = await prisma.galleryItem.create({ data });
    res.status(201).json({ item });
  })
);

adminRouter.patch(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    const data = gallerySchema.partial().parse(req.body);
    const item = await prisma.galleryItem.update({ where: { id: req.params.id }, data });
    res.json({ item });
  })
);

adminRouter.delete(
  '/gallery/:id',
  asyncHandler(async (req, res) => {
    await prisma.galleryItem.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

/* ----------------------------- Settings ----------------------------- */

const pricingSchema = z.object({
  baseCostPerHour: z.number().positive().optional(),
  materialCosts: z.record(z.string(), z.number()).optional(),
  minOrder: z.number().nonnegative().optional(),
  rushFee: z.number().nonnegative().optional(),
  maxFileSize: z.number().int().positive().optional(),
});

adminRouter.get(
  '/settings/pricing',
  asyncHandler(async (_req, res) => {
    const cfg = await prisma.pricingConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    res.json({ pricing: cfg });
  })
);

adminRouter.patch(
  '/settings/pricing',
  asyncHandler(async (req, res) => {
    const input = pricingSchema.parse(req.body);
    const existing = await prisma.pricingConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    const data = {
      ...(input.baseCostPerHour !== undefined ? { baseCostPerHour: input.baseCostPerHour } : {}),
      ...(input.materialCosts !== undefined
        ? { materialCosts: JSON.stringify(input.materialCosts) }
        : {}),
      ...(input.minOrder !== undefined ? { minOrder: input.minOrder } : {}),
      ...(input.rushFee !== undefined ? { rushFee: input.rushFee } : {}),
      ...(input.maxFileSize !== undefined ? { maxFileSize: input.maxFileSize } : {}),
    };
    const pricing = existing
      ? await prisma.pricingConfig.update({ where: { id: existing.id }, data })
      : await prisma.pricingConfig.create({ data });
    res.json({ pricing });
  })
);

/* ---------------------------- Analytics ----------------------------- */

adminRouter.get(
  '/analytics/dashboard',
  asyncHandler(async (_req, res) => {
    const [total, byStatus, revenueAgg, gallery] = await Promise.all([
      prisma.project.count(),
      prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.project.aggregate({
        _sum: { actualCost: true, estimatedCost: true },
      }),
      prisma.galleryItem.count(),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of byStatus) {
      statusCounts[row.status] = row._count._all;
    }

    res.json({
      totalProjects: total,
      statusCounts,
      revenue: {
        actual: revenueAgg._sum.actualCost ?? 0,
        estimated: revenueAgg._sum.estimatedCost ?? 0,
      },
      galleryItems: gallery,
    });
  })
);
