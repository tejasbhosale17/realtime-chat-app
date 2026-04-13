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

module.exports = { createConversation, getConversations, getConversation, searchUsers, addGroupMember, removeGroupMember, leaveGroup, updateGroup };

// PUT /api/conversations/:id/members — add member to group
async function addGroupMember(req, res, next) {
  try {
    const { userId: newMemberId } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!conversation.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    if (conversation.members.includes(newMemberId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    const user = await User.findById(newMemberId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    conversation.members.push(newMemberId);
    await conversation.save();

    const populated = await conversation.populate('members', 'name email avatar');

    // Notify group members
    const { getIO } = require('../socket/index');
    const io = getIO();
    io.to(`conv:${conversation._id}`).emit('group_member_added', {
      conversationId: conversation._id,
      conversation: populated,
      addedUserId: newMemberId,
    });

    res.json({ conversation: populated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/conversations/:id/members/:memberId — remove member from group
async function removeGroupMember(req, res, next) {
  try {
    const { memberId } = req.params;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!conversation.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    if (memberId === req.userId) {
      return res.status(400).json({ message: 'Use leave endpoint to leave the group' });
    }

    conversation.members = conversation.members.filter((m) => m.toString() !== memberId);
    conversation.admins = conversation.admins.filter((a) => a.toString() !== memberId);
    await conversation.save();

    const populated = await conversation.populate('members', 'name email avatar');

    const { getIO } = require('../socket/index');
    const io = getIO();
    io.to(`conv:${conversation._id}`).emit('group_member_removed', {
      conversationId: conversation._id,
      conversation: populated,
      removedUserId: memberId,
    });
    // Also notify the removed user
    io.to(`user:${memberId}`).emit('removed_from_group', {
      conversationId: conversation._id,
    });

    res.json({ conversation: populated });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations/:id/leave — leave a group
async function leaveGroup(req, res, next) {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!conversation.members.includes(req.userId)) {
      return res.status(400).json({ message: 'Not a member of this group' });
    }

    conversation.members = conversation.members.filter((m) => m.toString() !== req.userId);
    conversation.admins = conversation.admins.filter((a) => a.toString() !== req.userId);

    // If no admins left, promote first remaining member
    if (conversation.admins.length === 0 && conversation.members.length > 0) {
      conversation.admins.push(conversation.members[0]);
    }

    // Delete group if empty
    if (conversation.members.length === 0) {
      await conversation.deleteOne();
      return res.json({ message: 'Group deleted (no members left)' });
    }

    await conversation.save();
    const populated = await conversation.populate('members', 'name email avatar');

    const { getIO } = require('../socket/index');
    const io = getIO();
    io.to(`conv:${conversation._id}`).emit('group_member_left', {
      conversationId: conversation._id,
      conversation: populated,
      leftUserId: req.userId,
    });

    res.json({ message: 'Left group' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/conversations/:id — update group name/avatar
async function updateGroup(req, res, next) {
  try {
    const { name, avatar } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!conversation.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can update group' });
    }

    if (name?.trim()) conversation.name = name.trim();
    if (avatar !== undefined) conversation.avatar = avatar;
    await conversation.save();

    const populated = await conversation.populate('members', 'name email avatar');

    const { getIO } = require('../socket/index');
    const io = getIO();
    io.to(`conv:${conversation._id}`).emit('group_updated', {
      conversationId: conversation._id,
      conversation: populated,
    });

    res.json({ conversation: populated });
  } catch (err) {
    next(err);
  }
}
