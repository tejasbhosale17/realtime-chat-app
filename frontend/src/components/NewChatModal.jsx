import { useState } from "react";
import toast from "react-hot-toast";
import useChatStore from "../store/chatStore";

export default function NewChatModal({ onClose }) {
  const [mode, setMode] = useState("dm"); // "dm" | "group"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const searchUsers = useChatStore((s) => s.searchUsers);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(value);
      setResults(users);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleStartDM = async (userId) => {
    setCreating(true);
    try {
      const conversation = await createConversation("dm", [userId]);
      setActiveConversation(conversation);
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create conversation",
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error("Select at least 2 members for a group");
      return;
    }
    setCreating(true);
    try {
      const conversation = await createConversation(
        "group",
        selectedUsers.map((u) => u._id),
        groupName.trim(),
      );
      setActiveConversation(conversation);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold">New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {
              setMode("dm");
              setSelectedUsers([]);
              setGroupName("");
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              mode === "dm"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setMode("group")}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              mode === "group"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            New Group
          </button>
        </div>

        {/* Group name input */}
        {mode === "group" && (
          <div className="px-4 pt-4">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full px-4 py-2.5 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        )}

        {/* Selected users chips */}
        {mode === "group" && selectedUsers.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <span
                key={u._id}
                className="flex items-center gap-1 bg-indigo-600/30 text-indigo-300 text-xs px-2.5 py-1 rounded-full"
              >
                {u.name}
                <button
                  onClick={() => toggleUserSelection(u)}
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="p-4">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users by name or email..."
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="max-h-48 overflow-y-auto px-2 pb-2">
          {searching && (
            <p className="text-center text-gray-400 text-sm py-3">
              Searching...
            </p>
          )}

          {!searching && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-3">
              No users found
            </p>
          )}

          {results.map((user) => {
            const isSelected = selectedUsers.some((u) => u._id === user._id);
            return (
              <button
                key={user._id}
                onClick={() =>
                  mode === "dm"
                    ? handleStartDM(user._id)
                    : toggleUserSelection(user)
                }
                disabled={creating}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition text-left disabled:opacity-50 ${
                  isSelected ? "bg-indigo-600/20 ring-1 ring-indigo-500" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                {mode === "group" && isSelected && (
                  <span className="text-indigo-400 text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Create Group Button */}
        {mode === "group" && (
          <div className="p-4 pt-2 border-t border-gray-700">
            <button
              onClick={handleCreateGroup}
              disabled={
                creating || selectedUsers.length < 2 || !groupName.trim()
              }
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating
                ? "Creating..."
                : `Create Group (${selectedUsers.length} members)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
