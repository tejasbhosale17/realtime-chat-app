const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getOnlineUsers } = require('../services/presenceService');

// POST /api/presence/online — get online status for a list of user IDs
router.post('/online', authenticate, async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: 'userIds array required' });
    }
    const onlineMap = await getOnlineUsers(userIds);
    res.json({ online: onlineMap });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
