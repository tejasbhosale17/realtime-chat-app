const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/conversations — create DM or group
const createConversation = async (req, res, next) => {
  try {
    const { type, members, name } = req.body;
    const userId = req.userId;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Members are required' });
    }

    // Ensure creator is included
    const allMembers = [...new Set([userId, ...members])];

    if (type === 'dm') {
      if (allMembers.length !== 2) {
        return res.status(400).json({ message: 'DM requires exactly 2 members' });
      }

      // Check if DM already exists between these two users
      const existing = await Conversation.findOne({
        type: 'dm',
        members: { $all: allMembers, $size: 2 },
      }).populate('members', 'name email avatar');

      if (existing) {
        return res.json({ conversation: existing });
      }
    }

    if (type === 'group' && !name?.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name.trim() : '',
      members: allMembers,
      admins: type === 'group' ? [userId] : [],
    });

    const populated = await conversation.populate('members', 'name email avatar');

    res.status(201).json({ conversation: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations — list user's conversations
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ members: req.userId })
      .populate('members', 'name email avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations/:id
const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      members: req.userId,
    })
      .populate('members', 'name email avatar')
      .populate('admins', 'name email avatar');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (err) {
    next(err);
  }
};

// GET /api/conversations/search/users?q=term — search users to start chats
const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name email avatar')
      .limit(20);

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

module.exports = { createConversation, getConversations, getConversation, searchUsers };
