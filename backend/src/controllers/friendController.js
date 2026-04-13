const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const { getIO } = require('../socket/index');

// POST /api/friends/request — send a friend request
const sendFriendRequest = async (req, res, next) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.userId;

    if (!toUserId) {
      return res.status(400).json({ message: 'Target user ID is required' });
    }

    if (toUserId === fromUserId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    const currentUser = await User.findById(fromUserId);
    if (currentUser.friends.includes(toUserId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check for existing pending request in either direction
    const existing = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId, status: 'pending' },
        { from: toUserId, to: fromUserId, status: 'pending' },
      ],
    });

    if (existing) {
      return res.status(400).json({ message: 'Friend request already pending' });
    }

    const request = await FriendRequest.create({
      from: fromUserId,
      to: toUserId,
    });

    const populated = await request.populate([
      { path: 'from', select: 'name email avatar' },
      { path: 'to', select: 'name email avatar' },
    ]);

    // Notify the target user in real-time
    const io = getIO();
    io.to(`user:${toUserId}`).emit('friend_request_received', { request: populated });

    res.status(201).json({ request: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }
    next(err);
  }
};

// PUT /api/friends/request/:id/accept — accept a friend request
const acceptFriendRequest = async (req, res, next) => {
  try {
    const request = await FriendRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.to.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    request.status = 'accepted';
    await request.save();

    // Add each user to the other's friends list
    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });

    const populated = await request.populate([
      { path: 'from', select: 'name email avatar' },
      { path: 'to', select: 'name email avatar' },
    ]);

    // Notify the sender in real-time
    const io = getIO();
    io.to(`user:${request.from._id}`).emit('friend_request_accepted', { request: populated });

    res.json({ request: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/friends/request/:id/reject — reject a friend request
const rejectFriendRequest = async (req, res, next) => {
  try {
    const request = await FriendRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (request.to.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already handled' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    next(err);
  }
};

// GET /api/friends/requests — get pending requests for current user
const getPendingRequests = async (req, res, next) => {
  try {
    const incoming = await FriendRequest.find({ to: req.userId, status: 'pending' })
      .populate('from', 'name email avatar')
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({ from: req.userId, status: 'pending' })
      .populate('to', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ incoming, outgoing });
  } catch (err) {
    next(err);
  }
};

// GET /api/friends — get current user's friends list
const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'name email avatar');

    res.json({ friends: user.friends });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/friends/:friendId — remove a friend
const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    // Also clean up the accepted friend request
    await FriendRequest.deleteOne({
      $or: [
        { from: userId, to: friendId, status: 'accepted' },
        { from: friendId, to: userId, status: 'accepted' },
      ],
    });

    res.json({ message: 'Friend removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
};
