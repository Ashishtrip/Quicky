import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Get all addresses for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// Create a new address
router.post("/", async (req, res) => {
  try {
    const { userId, label, street, city, state, pincode, isDefault } = req.body;

    if (!userId || !label || !street || !city || !state || !pincode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // If this is set to default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Ensure the user exists in the DB since Firebase manages auth
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: 'Quicky User',
        email: `${userId}@quicky.local`,
      },
    });

    const address = await prisma.address.create({
      data: {
        userId,
        label,
        street,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(address);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ error: "Failed to create address" });
  }
});

// Update an address
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { label, street, city, state, pincode, isDefault, userId } = req.body;

    // If this is set to default, unset other defaults
    if (isDefault && userId) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    res.json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// Delete an address
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

export const addressRoutes = router;
