const express = require('express');
const router = express.Router();
const { Item, User, Notification } = require('../models');
const authRouter = require('./auth');
const auth = authRouter.auth;

// GET /items - Search with filters + geospatial
router.get('/', async (req, res) => {
  try {
    const {
      lat, lng, radius = 5, // km
      category, keyword, minPrice, maxPrice,
      condition, sort = 'nearby', page = 1, limit = 20
    } = req.query;

    let query = { isActive: true, isAvailable: true, isFlagged: false };

    if (category) query.category = category;
    if (condition) query.condition = condition;

    if (minPrice || maxPrice) {
      query.dailyRate = {};
      if (minPrice) query.dailyRate.$gte = Number(minPrice);
      if (maxPrice) query.dailyRate.$lte = Number(maxPrice);
    }

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } }
      ];
    }

    let items;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    if (lat && lng) {
      items = await Item.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: Number(radius) * 1000
          }
        }
      })
        .populate('owner', 'name profilePhoto trustScore avgRating isIdVerified')
        .skip(skip).limit(limitNum);
    } else {
      let sortObj = {};
      if (sort === 'rating') sortObj = { avgRating: -1 };
      else if (sort === 'price_asc') sortObj = { dailyRate: 1 };
      else if (sort === 'price_desc') sortObj = { dailyRate: -1 };
      else if (sort === 'newest') sortObj = { createdAt: -1 };
      else if (sort === 'trending') sortObj = { totalRentals: -1 };
      else sortObj = { createdAt: -1 };

      items = await Item.find(query).sort(sortObj)
        .populate('owner', 'name profilePhoto trustScore avgRating isIdVerified')
        .skip(skip).limit(limitNum);
    }

    const total = await Item.countDocuments(query);
    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /items/trending
router.get('/trending', async (req, res) => {
  try {
    const items = await Item.find({ isActive: true, isAvailable: true })
      .sort({ totalRentals: -1, avgRating: -1 })
      .limit(10)
      .populate('owner', 'name profilePhoto trustScore isIdVerified');
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /items/categories
router.get('/categories', async (req, res) => {
  try {
    const cats = ['Tools','Kitchen','Electronics','Furniture','Sports','Garden','Clothing','Books','Toys','Cleaning','Party','Other'];
    const counts = await Promise.all(cats.map(async c => {
      const count = await Item.countDocuments({ category: c, isActive: true });
      return { category: c, count };
    }));
    res.json(counts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name profilePhoto trustScore avgRating isIdVerified isEmailVerified address createdAt');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    // Increment view count
    await Item.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /items - Add new listing
router.post('/', auth, async (req, res) => {
  try {
    const {
      title, description, category, images, hourlyRate, dailyRate,
      securityDeposit, condition, location, address, tags, unavailableDates
    } = req.body;

    if (!title || !category) return res.status(400).json({ error: 'Title and category are required' });

    const owner = await User.findById(req.user.id);
    const itemLocation = location || owner.location;

    const item = await Item.create({
      owner: req.user.id,
      title, description: description || '', category,
      images: images || [],
      hourlyRate: hourlyRate || 0,
      dailyRate: dailyRate || 0,
      securityDeposit: securityDeposit || 0,
      condition: condition || 'Good',
      location: itemLocation,
      address: address || owner.address,
      tags: tags || [],
      unavailableDates: unavailableDates || []
    });

    await item.populate('owner', 'name profilePhoto trustScore');
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /items/:id - Edit listing
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.owner.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized' });

    const allowed = ['title','description','category','images','hourlyRate','dailyRate',
      'securityDeposit','condition','isAvailable','location','address','tags','unavailableDates'];
    allowed.forEach(k => { if (req.body[k] !== undefined) item[k] = req.body[k]; });

    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /items/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.owner.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized' });
    item.isActive = false;
    await item.save();
    res.json({ message: 'Item deactivated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /items/user/:userId - Get user's items
router.get('/user/:userId', async (req, res) => {
  try {
    const items = await Item.find({ owner: req.params.userId, isActive: true })
      .populate('owner', 'name profilePhoto trustScore');
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /items/:id/wishlist - Toggle wishlist
router.post('/:id/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const itemId = req.params.id;
    const idx = user.wishlist.findIndex(id => id.toString() === itemId);
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      await user.save();
      return res.json({ wishlisted: false });
    }
    user.wishlist.push(itemId);
    await user.save();
    res.json({ wishlisted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
