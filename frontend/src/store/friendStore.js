import { create } from 'zustand';
import api from '../services/api';

const useFriendStore = create((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  loadingFriends: false,

  fetchFriends: async () => {
    set({ loadingFriends: true });
    try {
      const { data } = await api.get('/friends');
      set({ friends: data.friends });
    } catch (err) {
      console.error('fetchFriends error:', err);
    } finally {
      set({ loadingFriends: false });
    }
  },

  fetchRequests: async () => {
    try {
      const { data } = await api.get('/friends/requests');
      set({ incomingRequests: data.incoming, outgoingRequests: data.outgoing });
    } catch (err) {
      console.error('fetchRequests error:', err);
    }
  },

  sendRequest: async (toUserId) => {
    const { data } = await api.post('/friends/request', { toUserId });
    set((state) => ({
      outgoingRequests: [data.request, ...state.outgoingRequests],
    }));
    return data.request;
  },

  acceptRequest: async (requestId) => {
    const { data } = await api.put(`/friends/request/${requestId}/accept`);
    set((state) => ({
      incomingRequests: state.incomingRequests.filter((r) => r._id !== requestId),
      friends: [...state.friends, data.request.from],
    }));
  },

  rejectRequest: async (requestId) => {
    await api.put(`/friends/request/${requestId}/reject`);
    set((state) => ({
      incomingRequests: state.incomingRequests.filter((r) => r._id !== requestId),
    }));
  },

  removeFriend: async (friendId) => {
    await api.delete(`/friends/${friendId}`);
    set((state) => ({
      friends: state.friends.filter((f) => f._id !== friendId),
    }));
  },

  // Socket handlers
  handleFriendRequestReceived: (data) => {
    set((state) => ({
      incomingRequests: [data.request, ...state.incomingRequests],
    }));
  },

  handleFriendRequestAccepted: (data) => {
    set((state) => ({
      outgoingRequests: state.outgoingRequests.filter((r) => r._id !== data.request._id),
      friends: [...state.friends, data.request.to],
    }));
  },
}));

export default useFriendStore;
