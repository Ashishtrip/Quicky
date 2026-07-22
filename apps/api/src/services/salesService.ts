import { prisma } from '../db/prisma';

export const getSalesMetrics = async (
  storeId: string,
  startDate?: string,
  endDate?: string
) => {
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  // Count fulfilled orders
  const fulfilledOrders = await prisma.order.count({
    where: {
      assignedStoreId: storeId,
      status: 'FULFILLED',
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
  });

  // Calculate earnings (sum of totalAmount)
  const earningsAggregation = await prisma.order.aggregate({
    _sum: {
      totalAmount: true,
    },
    where: {
      assignedStoreId: storeId,
      status: 'FULFILLED',
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
  });

  // Sum near-expiry items sold
  const nearExpirySoldAggregation = await prisma.orderItem.aggregate({
    _sum: {
      quantity: true,
    },
    where: {
      expiryBucket: 'USE_TODAY',
      order: {
        assignedStoreId: storeId,
        status: 'FULFILLED',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    },
  });

  return {
    fulfilledOrders,
    nearExpirySold: nearExpirySoldAggregation._sum.quantity || 0,
    todayEarnings: earningsAggregation._sum.totalAmount || 0,
  };
};

export const getWeeklyOrderVolume = async (
  storeId: string,
  weekStart: string,
  weekEnd: string
) => {
  const orders = await prisma.order.findMany({
    where: {
      assignedStoreId: storeId,
      status: 'FULFILLED',
      createdAt: {
        gte: new Date(weekStart),
        lte: new Date(weekEnd),
      },
    },
    select: {
      createdAt: true,
    },
  });

  // Initialize array of 7 days (Mon-Sun) to 0
  const volume = [0, 0, 0, 0, 0, 0, 0];

  orders.forEach(order => {
    // getDay() returns 0 (Sun) to 6 (Sat)
    // We want Mon (0) to Sun (6)
    const day = order.createdAt.getDay();
    const index = day === 0 ? 6 : day - 1;
    volume[index] = (volume[index] || 0) + 1;
  });

  return volume;
};
