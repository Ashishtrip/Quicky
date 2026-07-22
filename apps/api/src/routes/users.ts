import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Upsert and get user profile
router.post('/profile', async (req, res) => {
  try {
    const { userId, name, email, phone } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'Missing required fields: userId, name' });
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name,
        email,
        phone,
      },
      create: {
        id: userId,
        name,
        email: email || `${userId}@placeholder.quicky.app`, // Email is required in Prisma schema
        phone,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export { router as usersRouter };
