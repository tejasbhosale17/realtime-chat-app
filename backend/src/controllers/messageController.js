const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// GET /api/messages/:conversationId?page=1&limit=50
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    // Verify user is a member
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedAt: null,
    })
      .populate('sender', 'name email avatar')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedAt: null,
    });

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages };
