import { Router } from 'express';
import { getStoreListings, upsertListing, deleteListing } from '../services/listingService';
import { getSalesMetrics, getWeeklyOrderVolume } from '../services/salesService';
import { getNearbyStores, updateStoreProfile } from '../services/storeService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// PATCH /stores/:storeId
router.patch('/:storeId', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    if (req.user.uid !== storeId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify another store' });
    }
    const { isOpen, deliveryRadius, latitude, longitude, name, address, phone, ownerName, ownerPhone, contactEmail, contactPhone, gstNumber, fcmToken } = req.body;

    const store = await updateStoreProfile(storeId as string, {
      isOpen,
      deliveryRadius,
      latitude,
      longitude,
      name,
      address,
      phone,
      ownerName,
      ownerPhone,
      contactEmail,
      contactPhone,
      gstNumber,
      fcmToken
    });

    res.json(store);
  } catch (error) {
    console.error('Error updating store profile:', error);
    res.status(500).json({ error: 'Failed to update store profile' });
  }
});

// GET /stores/nearby
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query['latitude'] as string);
    const lng = parseFloat(req.query['longitude'] as string);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    const stores = await getNearbyStores(lat, lng);
    res.json(stores);
  } catch (error) {
    console.error('Error fetching nearby stores:', error);
    res.status(500).json({ error: 'Failed to fetch nearby stores' });
  }
});

// GET /stores/:storeId/sales-metrics
router.get('/:storeId/sales-metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await getSalesMetrics(
      req.params.storeId,
      startDate as string,
      endDate as string
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching sales metrics:', error);
    res.status(500).json({ error: 'Failed to fetch sales metrics' });
  }
});

// GET /stores/:storeId/weekly-volume
router.get('/:storeId/weekly-volume', async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;
    
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd are required' });
    }
    
    const volume = await getWeeklyOrderVolume(
      req.params.storeId,
      weekStart as string,
      weekEnd as string
    );
    res.json(volume);
  } catch (error) {
    console.error('Error fetching weekly volume:', error);
    res.status(500).json({ error: 'Failed to fetch weekly volume' });
  }
});

// GET /stores/:storeId/listings
router.get('/:storeId/listings', async (req, res) => {
  try {
    const listings = await getStoreListings(req.params.storeId);
    res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// POST /stores/:storeId/listings
router.post('/:storeId/listings', authenticateToken, async (req, res) => {
  try {
    const { storeId } = req.params;
    if (req.user.uid !== storeId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify another store' });
    }
    const { catalogItemId, price, stockQuantity, expiryBucket, isCustom, name, unit, imageUrl } = req.body;

    if (!catalogItemId || stockQuantity === undefined || !expiryBucket) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const listing = await upsertListing(storeId as string, catalogItemId, {
      price,
      stockQuantity,
      expiryBucket,
      isCustom,
      name,
      unit,
      imageUrl
    });

    res.json(listing);
  } catch (error) {
    console.error('Error creating/updating listing:', error);
    res.status(500).json({ error: 'Failed to create/update listing' });
  }
});

// DELETE /stores/:storeId/listings/:listingId
router.delete('/:storeId/listings/:listingId', authenticateToken, async (req, res) => {
  try {
    const { storeId, listingId } = req.params;
    if (req.user.uid !== storeId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify another store' });
    }
    if (!storeId || !listingId) {
       return res.status(400).json({ error: 'Missing required fields' });
    }
    await deleteListing(storeId, listingId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;
