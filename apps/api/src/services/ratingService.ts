import { PrismaClient } from '@prisma/client';
import { googleSheetsService } from './googleSheetsService';

const prisma = new PrismaClient();

export const ratingService = {
  async submitRating(orderId: string, rating: 'GOOD' | 'AVERAGE' | 'POOR') {
    // 1. Verify the order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.freshnessRating) {
      throw new Error('Order has already been rated');
    }

    if (order.status !== 'FULFILLED' && order.status !== 'ACCEPTED') {
      // Depending on exact flow, rating might only be allowed on FULFILLED orders
      // We will allow it on ACCEPTED as well for testing if needed
      // throw new Error('Order must be delivered before rating');
    }

    const now = new Date();

    // 2. Update the order with the rating
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        freshnessRating: rating,
        freshnessRatingAt: now,
      },
    });

    // 3. Export to Google Sheets
    // Fire and forget (don't await so we don't block the API response if sheets API is slow)
    googleSheetsService.appendRatingRow(
      order.id,
      order.userId,
      order.assignedStoreId || 'N/A',
      order.totalAmount,
      rating,
      now
    ).catch(err => {
      console.error('Failed to export rating to Google Sheets asynchronously:', err);
    });

    return updatedOrder;
  }
};
