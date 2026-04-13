import { useEffect, useState } from "react";
import useFriendStore from "../store/friendStore";
import useChatStore from "../store/chatStore";
import toast from "react-hot-toast";

export default function FriendsPanel({ onClose }) {
  const [tab, setTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const friends = useFriendStore((s) => s.friends);
  const incomingRequests = useFriendStore((s) => s.incomingRequests);
  const outgoingRequests = useFriendStore((s) => s.outgoingRequests);
  const loadingFriends = useFriendStore((s) => s.loadingFriends);
  const fetchFriends = useFriendStore((s) => s.fetchFriends);
  const fetchRequests = useFriendStore((s) => s.fetchRequests);
  const sendRequest = useFriendStore((s) => s.sendRequest);
  const acceptRequest = useFriendStore((s) => s.acceptRequest);
  const rejectRequest = useFriendStore((s) => s.rejectRequest);
  const removeFriend = useFriendStore((s) => s.removeFriend);

  const searchUsers = useChatStore((s) => s.searchUsers);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(q);
      setSearchResults(users);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendRequest(userId);
      toast.success("Friend request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptRequest(requestId);
      toast.success("Friend request accepted!");
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId);
      toast.success("Friend removed");
    } catch {
      toast.error("Failed to remove friend");
    }
  };

  const handleStartChat = async (friendId) => {
    try {
      const conv = await createConversation("dm", [friendId]);
      setActiveConversation(conv);
      onClose();
    } catch {
      toast.error("Failed to start chat");
    }
  };

  const isFriend = (userId) => friends.some((f) => f._id === userId);
  const hasPendingRequest = (userId) =>
    outgoingRequests.some((r) => r.to?._id === userId) ||
    incomingRequests.some((r) => r.from?._id === userId);

  const tabs = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "requests", label: "Requests", count: incomingRequests.length },
    { id: "search", label: "Find Users" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Friends</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Friends Tab */}
          {tab === "friends" && (
            <>
              {loadingFriends ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : friends.length === 0 ? (
                <p className="text-gray-500 text-center text-sm py-8">
                  No friends yet. Search for users to add!
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                      {friend.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {friend.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {friend.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartChat(friend._id)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend._id)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Requests Tab */}
          {tab === "requests" && (
            <>
              {incomingRequests.length > 0 && (
                <div>
                  <h3 className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    Incoming
                  </h3>
                  {incomingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 mb-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                        {req.from?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {req.from?.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {req.from?.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req._id)}
                          className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {outgoingRequests.length > 0 && (
                <div>
                  <h3 className="text-xs text-gray-400 uppercase font-semibold mb-2 mt-4">
                    Outgoing
                  </h3>
                  {outgoingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 mb-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm">
                        {req.to?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {req.to?.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {req.to?.email}
                        </p>
                      </div>
                      <span className="text-xs text-yellow-400">Pending</span>
                    </div>
                  ))}
                </div>
              )}

              {incomingRequests.length === 0 &&
                outgoingRequests.length === 0 && (
                  <p className="text-gray-500 text-center text-sm py-8">
                    No pending requests
                  </p>
                )}
            </>
          )}

          {/* Search Tab */}
          {tab === "search" && (
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2.5 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
                autoFocus
              />

              {searching && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              )}

              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  {isFriend(user._id) ? (
                    <span className="text-xs text-green-400">Friends ✓</span>
                  ) : hasPendingRequest(user._id) ? (
                    <span className="text-xs text-yellow-400">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user._id)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              ))}

              {!searching &&
                searchQuery.length >= 2 &&
                searchResults.length === 0 && (
                  <p className="text-gray-500 text-center text-sm py-4">
                    No users found
                  </p>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
