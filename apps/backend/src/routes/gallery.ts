import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

export const galleryRouter = Router();

// List all gallery items, optionally filtered by material / purpose
galleryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { material, purpose } = req.query as { material?: string; purpose?: string };
    const items = await prisma.galleryItem.findMany({
      where: {
        ...(material ? { material } : {}),
        ...(purpose ? { purpose } : {}),
      },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ items });
  })
);

galleryRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await prisma.galleryItem.findUnique({ where: { id: req.params.id } });
    if (!item) throw new ApiError(404, 'Gallery item not found');
    res.json({ item });
  })
);
