const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const registerReadReceiptHandlers = (io, socket) => {
  // Mark all messages in a conversation as read by this user
  socket.on('message_read', async (data) => {
    try {
      const { conversationId } = data;
      if (!conversationId) return;

      // Verify membership
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: socket.userId,
      });
      if (!conversation) return;

      // Update all unread messages in this conversation
      const result = await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.userId },
          readBy: { $ne: socket.userId },
          deletedAt: null,
        },
        { $addToSet: { readBy: socket.userId } }
      );

      if (result.modifiedCount > 0) {
        // Notify other members in the conversation
        socket.to(`conv:${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: socket.userId,
        });
      }
    } catch (err) {
      console.error('message_read error:', err);
    }
  });
};

module.exports = { registerReadReceiptHandlers };
