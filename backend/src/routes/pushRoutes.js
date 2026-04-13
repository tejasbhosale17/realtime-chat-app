const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { saveSubscription, removeSubscription } = require('../services/pushService');

// Get VAPID public key
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }
    await saveSubscription(req.userId, subscription);
    res.json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    next(err);
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, async (req, res, next) => {
  try {
    await removeSubscription(req.userId);
    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
