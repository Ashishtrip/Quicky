import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// GET /catalog/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameHindi: true,
        description: true,
        useTodayDiscountPct: true,
        estimatedShelfLifeDays: true,
        sortOrder: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /catalog
router.get('/', async (req, res) => {
  try {
    const storeId = req.query.storeId as string | undefined;

    const whereClause: any = {
      isActive: true,
    };

    if (storeId) {
      whereClause.OR = [
        { storeId: null },
        { storeId: storeId }
      ];
    } else {
      whereClause.storeId = null;
    }

    const catalogItems = await prisma.catalogItem.findMany({
      include: {
        category: true,
      },
      where: whereClause
    });
    res.json(catalogItems);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Failed to fetch catalog items' });
  }
});

export default router;
