import { useState } from "react";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import api from "../services/api";

export default function GroupManagement({ conversation, onClose }) {
  const [groupName, setGroupName] = useState(conversation.name || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const searchUsers = useChatStore((s) => s.searchUsers);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const isAdmin = conversation.admins?.some(
    (a) => (a._id || a) === currentUser?._id,
  );

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(q);
      // Filter out existing members
      const memberIds = conversation.members.map((m) => m._id);
      setSearchResults(users.filter((u) => !memberIds.includes(u._id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const { data } = await api.put(
        `/conversations/${conversation._id}/members`,
        { userId },
      );
      setActiveConversation(data.conversation);
      setSearchResults((prev) => prev.filter((u) => u._id !== userId));
      toast.success("Member added!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const { data } = await api.delete(
        `/conversations/${conversation._id}/members/${memberId}`,
      );
      setActiveConversation(data.conversation);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/conversations/${conversation._id}/leave`);
      await fetchConversations();
      setActiveConversation(null);
      onClose();
      toast.success("Left group");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave group");
    }
  };

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName.trim() === conversation.name) return;
    try {
      const { data } = await api.put(`/conversations/${conversation._id}`, {
        name: groupName.trim(),
      });
      setActiveConversation(data.conversation);
      toast.success("Group name updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Group Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name */}
          {isAdmin && (
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">
                Group Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={
                    !groupName.trim() || groupName.trim() === conversation.name
                  }
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm transition disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Members */}
          <div>
            <h3 className="text-xs text-gray-400 uppercase font-semibold mb-2">
              Members ({conversation.members?.length})
            </h3>
            <div className="space-y-2">
              {conversation.members?.map((member) => {
                const memberIsAdmin = conversation.admins?.some(
                  (a) => (a._id || a) === member._id,
                );
                const isCurrentUser = member._id === currentUser?._id;

                return (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-700/50"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.name}
                        {isCurrentUser && (
                          <span className="text-gray-400 ml-1">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {memberIsAdmin && (
                        <span className="text-[10px] bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                      {isAdmin && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-xs text-red-400 hover:text-red-300 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Members (admin only) */}
          {isAdmin && (
            <div>
              <h3 className="text-xs text-gray-400 uppercase font-semibold mb-2">
                Add Members
              </h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users to add..."
                className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2"
              />

              {searching && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              )}

              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-700/50 mb-1.5"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                  </div>
                  <button
                    onClick={() => handleAddMember(user._id)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Leave Group */}
          <button
            onClick={handleLeave}
            className="w-full py-2.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm font-medium transition"
          >
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}
