const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['dm', 'group'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast lookup of user's conversations
conversationSchema.index({ members: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
