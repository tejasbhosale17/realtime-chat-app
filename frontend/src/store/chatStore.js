import { create } from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  loadingConversations: false,
  loadingMessages: false,
  pagination: null,
  onlineUsers: {},       // { [userId]: boolean }
  typingUsers: {},       // { [conversationId]: Set-like [userId, ...] }

  // Fetch all conversations for the sidebar
  fetchConversations: async () => {
    set({ loadingConversations: true });
    try {
      const { data } = await api.get('/conversations');
      set({ conversations: data.conversations });
    } catch (err) {
      console.error('fetchConversations error:', err);
    } finally {
      set({ loadingConversations: false });
    }
  },

  // Select a conversation and load its messages
  setActiveConversation: async (conversation) => {
    const prev = get().activeConversation;
    const socket = getSocket();

    // Leave previous room
    if (prev && socket) {
      socket.emit('leave_conversation', prev._id);
    }

    set({ activeConversation: conversation, messages: [], pagination: null });

    // Join new room
    if (socket) {
      socket.emit('join_conversation', conversation._id);
    }

    // Fetch messages
    await get().fetchMessages(conversation._id);

    // Mark messages as read
    if (socket) {
      socket.emit('message_read', { conversationId: conversation._id });
    }
  },

  // Fetch messages with pagination
  fetchMessages: async (conversationId, page = 1) => {
    set({ loadingMessages: true });
    try {
      const { data } = await api.get(`/messages/${conversationId}?page=${page}`);
      if (page === 1) {
        set({ messages: data.messages, pagination: data.pagination });
      } else {
        set((state) => ({
          messages: [...data.messages, ...state.messages],
          pagination: data.pagination,
        }));
      }
    } catch (err) {
      console.error('fetchMessages error:', err);
    } finally {
      set({ loadingMessages: false });
    }
  },

  // Load older messages
  loadMoreMessages: async () => {
    const { pagination, activeConversation } = get();
    if (!pagination || !activeConversation) return;
    if (pagination.page >= pagination.pages) return;
    await get().fetchMessages(activeConversation._id, pagination.page + 1);
  },

  // Send message via socket
  sendMessage: (content) => {
    const socket = getSocket();
    const { activeConversation } = get();
    if (!socket || !activeConversation) return;

    socket.emit('send_message', {
      conversationId: activeConversation._id,
      content,
    });
  },

  // Edit message via socket
  editMessage: (messageId, content) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message_edit', { messageId, content });
  },

  // Delete message via socket
  deleteMessage: (messageId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message_delete', { messageId });
  },

  // Create a new conversation (DM or group)
  createConversation: async (type, members, name) => {
    const { data } = await api.post('/conversations', { type, members, name });
    set((state) => {
      const exists = state.conversations.some((c) => c._id === data.conversation._id);
      if (!exists) {
        return { conversations: [data.conversation, ...state.conversations] };
      }
      return {};
    });
    return data.conversation;
  },

  // Search users
  searchUsers: async (query) => {
    const { data } = await api.get(`/conversations/search/users?q=${encodeURIComponent(query)}`);
    return data.users;
  },

  // --- Socket event handlers (called from Chat.jsx useEffect) ---

  handleNewMessage: (data) => {
    const { activeConversation } = get();
    if (activeConversation && data.conversationId === activeConversation._id) {
      set((state) => ({
        messages: [...state.messages, data.message],
      }));
    }
  },

  handleConversationUpdated: (data) => {
    set((state) => ({
      conversations: state.conversations
        .map((c) =>
          c._id === data.conversationId ? { ...c, lastMessage: data.lastMessage, updatedAt: new Date().toISOString() } : c
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));
  },

  handleMessageUpdated: (data) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === data.message._id ? data.message : m
      ),
    }));
  },

  handleMessageDeleted: (data) => {
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== data.messageId),
    }));
  },

  // --- Typing ---

  emitTypingStart: () => {
    const socket = getSocket();
    const { activeConversation } = get();
    if (!socket || !activeConversation) return;
    socket.emit('typing_start', { conversationId: activeConversation._id });
  },

  emitTypingStop: () => {
    const socket = getSocket();
    const { activeConversation } = get();
    if (!socket || !activeConversation) return;
    socket.emit('typing_stop', { conversationId: activeConversation._id });
  },

  handleUserTyping: (data) => {
    set((state) => {
      const current = state.typingUsers[data.conversationId] || [];
      if (current.includes(data.userId)) return {};
      return {
        typingUsers: {
          ...state.typingUsers,
          [data.conversationId]: [...current, data.userId],
        },
      };
    });
  },

  handleUserStoppedTyping: (data) => {
    set((state) => {
      const current = state.typingUsers[data.conversationId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [data.conversationId]: current.filter((id) => id !== data.userId),
        },
      };
    });
  },

  // --- Presence ---

  handleUserOnline: (data) => {
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [data.userId]: true },
    }));
  },

  handleUserOffline: (data) => {
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [data.userId]: false },
    }));
  },

  fetchOnlineStatuses: async (userIds) => {
    try {
      const { data } = await api.post('/presence/online', { userIds });
      set((state) => ({
        onlineUsers: { ...state.onlineUsers, ...data.online },
      }));
    } catch (err) {
      console.error('fetchOnlineStatuses error:', err);
    }
  },

  // --- Read Receipts ---

  handleMessagesRead: (data) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (
          m.conversation === data.conversationId &&
          !m.readBy?.includes(data.readBy)
        ) {
          return { ...m, readBy: [...(m.readBy || []), data.readBy] };
        }
        return m;
      }),
    }));
  },
}));

export default useChatStore;
