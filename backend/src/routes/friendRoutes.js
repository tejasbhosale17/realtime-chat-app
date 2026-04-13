const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
} = require('../controllers/friendController');

router.use(authenticate);

router.get('/', getFriends);
router.get('/requests', getPendingRequests);
router.post('/request', sendFriendRequest);
router.put('/request/:id/accept', acceptFriendRequest);
router.put('/request/:id/reject', rejectFriendRequest);
router.delete('/:friendId', removeFriend);

module.exports = router;
