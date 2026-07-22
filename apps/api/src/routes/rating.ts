import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ratingService } from '../services/ratingService';

const router = Router({ mergeParams: true });

const ratingSchema = z.object({
  rating: z.enum(['GOOD', 'AVERAGE', 'POOR']),
});

router.post('/', async (req: Request<{ orderId: string }>, res: Response) => {
  try {
    const { orderId } = req.params;
    const parsedBody = ratingSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Invalid rating. Must be GOOD, AVERAGE, or POOR.' });
    }

    const { rating } = parsedBody.data;

    const updatedOrder = await ratingService.submitRating(orderId, rating);
    return res.status(200).json(updatedOrder);
  } catch (error: any) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Order has already been rated') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error submitting rating:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
