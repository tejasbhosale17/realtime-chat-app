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
  unreadCounts: {},      // { [conversationId]: number }
  searchFilter: '',      // conversation search filter

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

    set((state) => ({
      activeConversation: conversation,
      messages: [],
      pagination: null,
      unreadCounts: { ...state.unreadCounts, [conversation._id]: 0 },
    }));

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

  // Set conversation search filter
  setSearchFilter: (filter) => set({ searchFilter: filter }),

  // Get filtered conversations
  getFilteredConversations: () => {
    const { conversations, searchFilter } = get();
    if (!searchFilter.trim()) return conversations;
    const q = searchFilter.toLowerCase();
    return conversations.filter((c) => {
      if (c.name && c.name.toLowerCase().includes(q)) return true;
      return c.members?.some((m) => m.name?.toLowerCase().includes(q));
    });
  },

  // Send message via socket (with optional file) + optimistic update
  sendMessage: (content, fileData) => {
    const socket = getSocket();
    const { activeConversation } = get();
    if (!socket || !activeConversation) return;

    const tempId = `temp-${Date.now()}`;
    const currentUser = JSON.parse(localStorage.getItem('accessToken') ? '{}' : '{}');

    // Optimistic: add pending message immediately
    set((state) => ({
      messages: [...state.messages, {
        _id: tempId,
        conversation: activeConversation._id,
        sender: { _id: 'self', name: '' },
        content,
        ...(fileData && { fileUrl: fileData.fileUrl, fileName: fileData.fileName, fileType: fileData.fileType }),
        reactions: [],
        readBy: [],
        createdAt: new Date().toISOString(),
        _pending: true,
      }],
    }));

    socket.emit('send_message', {
      conversationId: activeConversation._id,
      content,
      ...(fileData && {
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
      }),
    });
  },

  // Upload a file via REST, returns file metadata
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
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

  // Toggle reaction on a message
  toggleReaction: (messageId, emoji) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message_reaction', { messageId, emoji });
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
      set((state) => {
        // Replace optimistic (pending) message if it matches
        const pending = state.messages.find((m) => m._pending && m.content === data.message.content);
        if (pending) {
          return { messages: state.messages.map((m) => m._id === pending._id ? data.message : m) };
        }
        return { messages: [...state.messages, data.message] };
      });
    } else {
      // Increment unread count for non-active conversation
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [data.conversationId]: (state.unreadCounts[data.conversationId] || 0) + 1,
        },
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

  handleMessageReactionUpdated: (data) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === data.message._id ? data.message : m
      ),
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

  // --- Group Events ---

  handleGroupMemberAdded: (data) => {
    set((state) => {
      const convs = state.conversations.map((c) =>
        c._id === data.conversation._id ? data.conversation : c
      );
      // If user was added to a new group, prepend it
      if (!state.conversations.some((c) => c._id === data.conversation._id)) {
        convs.unshift(data.conversation);
      }
      const active =
        state.activeConversation?._id === data.conversation._id
          ? data.conversation
          : state.activeConversation;
      return { conversations: convs, activeConversation: active };
    });
  },

  handleGroupMemberRemoved: (data) => {
    set((state) => {
      const convs = state.conversations.map((c) =>
        c._id === data.conversation._id ? data.conversation : c
      );
      const active =
        state.activeConversation?._id === data.conversation._id
          ? data.conversation
          : state.activeConversation;
      return { conversations: convs, activeConversation: active };
    });
  },

  handleRemovedFromGroup: (data) => {
    set((state) => {
      const convs = state.conversations.filter(
        (c) => c._id !== data.conversationId
      );
      const active =
        state.activeConversation?._id === data.conversationId
          ? null
          : state.activeConversation;
      return { conversations: convs, activeConversation: active, ...(active === null ? { messages: [] } : {}) };
    });
  },

  handleGroupMemberLeft: (data) => {
    set((state) => {
      const convs = state.conversations.map((c) =>
        c._id === data.conversation._id ? data.conversation : c
      );
      const active =
        state.activeConversation?._id === data.conversation._id
          ? data.conversation
          : state.activeConversation;
      return { conversations: convs, activeConversation: active };
    });
  },

  handleGroupUpdated: (data) => {
    set((state) => {
      const convs = state.conversations.map((c) =>
        c._id === data.conversation._id ? data.conversation : c
      );
      const active =
        state.activeConversation?._id === data.conversation._id
          ? data.conversation
          : state.activeConversation;
      return { conversations: convs, activeConversation: active };
    });
  },
}));

export default useChatStore;
