const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { sendPushToUsers } = require('../services/pushService');

const registerMessageHandlers = (io, socket) => {
  // Send a message
  socket.on('send_message', async (data, callback) => {
    try {
      const { conversationId, content, fileUrl, fileName, fileType } = data;

      if (!conversationId || (!content?.trim() && !fileUrl)) {
        return callback?.({ error: 'conversationId and content or file are required' });
      }

      // Verify sender is a member
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: socket.userId,
      });

      if (!conversation) {
        return callback?.({ error: 'Conversation not found' });
      }

      // Create message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        content: content?.trim() || '',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        readBy: [socket.userId],
      });

      // Populate sender info
      await message.populate('sender', 'name email avatar');

      // Update conversation's lastMessage
      conversation.lastMessage = message._id;
      await conversation.save();

      // Emit to all users in the conversation room
      io.to(`conv:${conversationId}`).emit('new_message', {
        message,
        conversationId,
      });

      // Also notify members who aren't in the room (via their personal rooms)
      conversation.members.forEach((memberId) => {
        const memberStr = memberId.toString();
        if (memberStr !== socket.userId) {
          io.to(`user:${memberStr}`).emit('conversation_updated', {
            conversationId,
            lastMessage: message,
          });
        }
      });

      // Send push notifications to other members
      const otherMemberIds = conversation.members
        .map((id) => id.toString())
        .filter((id) => id !== socket.userId);

      if (otherMemberIds.length > 0) {
        const senderName = message.sender?.name || 'Someone';
        const body = content?.trim()
          ? content.trim().substring(0, 100)
          : fileName
            ? `Sent a file: ${fileName}`
            : 'Sent a message';

        sendPushToUsers(otherMemberIds, {
          title: conversation.type === 'group'
            ? `${senderName} in ${conversation.name}`
            : senderName,
          body,
          data: { conversationId, url: '/' },
        }).catch(() => {}); // Fire and forget
      }

      callback?.({ message });
    } catch (err) {
      console.error('send_message error:', err);
      callback?.({ error: 'Failed to send message' });
    }
  });

  // Edit a message
  socket.on('message_edit', async (data, callback) => {
    try {
      const { messageId, content } = data;

      const message = await Message.findOne({
        _id: messageId,
        sender: socket.userId,
        deletedAt: null,
      });

      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      message.content = content.trim();
      message.editedAt = new Date();
      await message.save();
      await message.populate('sender', 'name email avatar');

      io.to(`conv:${message.conversation}`).emit('message_updated', { message });

      callback?.({ message });
    } catch (err) {
      console.error('message_edit error:', err);
      callback?.({ error: 'Failed to edit message' });
    }
  });

  // Delete a message (soft delete)
  socket.on('message_delete', async (data, callback) => {
    try {
      const { messageId } = data;

      const message = await Message.findOne({
        _id: messageId,
        sender: socket.userId,
        deletedAt: null,
      });

      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      message.deletedAt = new Date();
      await message.save();

      io.to(`conv:${message.conversation}`).emit('message_deleted', {
        messageId,
        conversationId: message.conversation,
      });

      callback?.({ success: true });
    } catch (err) {
      console.error('message_delete error:', err);
      callback?.({ error: 'Failed to delete message' });
    }
  });

  // Toggle a reaction on a message
  socket.on('message_reaction', async (data, callback) => {
    try {
      const { messageId, emoji } = data;

      if (!messageId || !emoji) {
        return callback?.({ error: 'messageId and emoji are required' });
      }

      const message = await Message.findOne({
        _id: messageId,
        deletedAt: null,
      });

      if (!message) {
        return callback?.({ error: 'Message not found' });
      }

      // Check if user already reacted with this emoji
      const existingIndex = message.reactions.findIndex(
        (r) => r.user.toString() === socket.userId && r.emoji === emoji
      );

      if (existingIndex > -1) {
        // Remove the reaction (toggle off)
        message.reactions.splice(existingIndex, 1);
      } else {
        // Add the reaction
        message.reactions.push({ user: socket.userId, emoji });
      }

      await message.save();
      await message.populate('sender', 'name email avatar');
      await message.populate('reactions.user', 'name');

      io.to(`conv:${message.conversation}`).emit('message_reaction_updated', {
        message,
        conversationId: message.conversation,
      });

      callback?.({ message });
    } catch (err) {
      console.error('message_reaction error:', err);
      callback?.({ error: 'Failed to toggle reaction' });
    }
  });
};

module.exports = { registerMessageHandlers };
