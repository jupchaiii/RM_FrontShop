import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';
import { calculateQuote } from '../services/pricing';
import { sendEmail, orderConfirmationEmail } from '../services/email';

export const projectsRouter = Router();

projectsRouter.use(authenticate);

// List current user's projects
projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  })
);

// Get single project (must belong to user)
projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project || project.userId !== req.user!.id) {
      throw new ApiError(404, 'Project not found');
    }
    res.json({ project });
  })
);

const createConfigSchema = z.object({
  material: z.string().min(1),
  infill: z.coerce.number().min(0).max(100).default(20),
  layerHeight: z.coerce.number().positive().default(0.2),
  supportType: z.enum(['None', 'Tree', 'Linear']).default('None'),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

// Create project via file upload
projectsRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'File is required (field name: file)');
    }
    const cfg = createConfigSchema.parse(req.body);
    const quote = await calculateQuote({
      fileSize: req.file.size,
      material: cfg.material,
      infill: cfg.infill,
      supportType: cfg.supportType,
      layerHeight: cfg.layerHeight,
    });

    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
        material: cfg.material,
        infill: cfg.infill,
        layerHeight: cfg.layerHeight,
        supportType: cfg.supportType,
        estimatedTime: quote.estimatedTime,
        estimatedCost: quote.estimatedCost,
        purpose: cfg.purpose ?? null,
        notes: cfg.notes ?? null,
      },
    });

    await sendEmail(
      orderConfirmationEmail(req.user!.email, project.id, project.fileName, quote.estimatedCost)
    );

    res.status(201).json({ project, quote });
  })
);

const updateSchema = z.object({
  material: z.string().optional(),
  infill: z.number().min(0).max(100).optional(),
  layerHeight: z.number().positive().optional(),
  supportType: z.enum(['None', 'Tree', 'Linear']).optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

projectsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      throw new ApiError(404, 'Project not found');
    }
    const data = updateSchema.parse(req.body);
    const project = await prisma.project.update({ where: { id: req.params.id }, data });
    res.json({ project });
  })
);

// Move a QUOTED project to PENDING (i.e. confirm the order)
projectsRouter.put(
  '/:id/checkout',
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      throw new ApiError(404, 'Project not found');
    }
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'PENDING', orderedAt: new Date() },
    });
    res.json({ project });
  })
);

projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user!.id) {
      throw new ApiError(404, 'Project not found');
    }
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ ok: true });
  })
);
