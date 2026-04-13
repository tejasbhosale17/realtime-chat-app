import { useState } from "react";
import toast from "react-hot-toast";
import useChatStore from "../store/chatStore";

export default function NewChatModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
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

        <div className="max-h-64 overflow-y-auto px-2 pb-4">
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

          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => handleStartDM(user._id)}
              disabled={creating}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                {user.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
