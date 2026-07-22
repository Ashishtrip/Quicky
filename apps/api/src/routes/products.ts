import { Router, Request, Response } from 'express';
import { getProducts } from '../services/productService';

const router = Router();

/**
 * GET /products
 *
 * Query params:
 *   lat (required) - Customer latitude
 *   lng (required) - Customer longitude
 *   radiusKm       - Search radius in km (default: 3)
 *   freshness      - USE_TODAY | FRESH_STOCK | ANY (default: ANY)
 *   categoryId     - Filter by category ID
 *   search         - Text search on product name
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm, freshness, categoryId, search } = req.query;

    // Validate required params
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required query params: lat, lng',
      });
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        error: 'lat and lng must be valid numbers',
      });
    }

    // Validate freshness param
    const validFreshness = ['USE_TODAY', 'FRESH_STOCK', 'ANY'];
    const freshnessValue = (freshness as string)?.toUpperCase() || 'ANY';
    if (!validFreshness.includes(freshnessValue)) {
      return res.status(400).json({
        error: `freshness must be one of: ${validFreshness.join(', ')}`,
      });
    }

    const products = await getProducts({
      lat: latNum,
      lng: lngNum,
      radiusKm: radiusKm ? parseFloat(radiusKm as string) : undefined,
      freshness: freshnessValue as 'USE_TODAY' | 'FRESH_STOCK' | 'ANY',
      categoryId: categoryId as string | undefined,
      search: search as string | undefined,
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router;
