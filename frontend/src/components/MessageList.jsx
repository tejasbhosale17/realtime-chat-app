import { useRef, useEffect, useState } from "react";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function FilePreview({ msg }) {
  if (!msg.fileUrl) return null;

  const isImage = msg.fileType?.startsWith("image/");
  const isVideo = msg.fileType?.startsWith("video/");
  const isAudio = msg.fileType?.startsWith("audio/");

  if (isImage) {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={msg.fileUrl}
          alt={msg.fileName}
          className="max-w-[280px] max-h-[200px] rounded-lg mt-1 object-cover cursor-pointer hover:opacity-90 transition"
        />
      </a>
    );
  }

  if (isVideo) {
    return (
      <video
        src={msg.fileUrl}
        controls
        className="max-w-[280px] rounded-lg mt-1"
      />
    );
  }

  if (isAudio) {
    return <audio src={msg.fileUrl} controls className="mt-1 max-w-[250px]" />;
  }

  // Generic file download
  return (
    <a
      href={msg.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-gray-600/50 rounded-lg px-3 py-2 mt-1 hover:bg-gray-600 transition text-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-gray-300 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="truncate max-w-[180px] text-indigo-300">
        {msg.fileName}
      </span>
    </a>
  );
}

function Reactions({ reactions, messageId, currentUserId }) {
  const [showPicker, setShowPicker] = useState(false);
  const toggleReaction = useChatStore((s) => s.toggleReaction);

  if (!reactions && !showPicker) return null;

  // Group reactions by emoji
  const grouped = {};
  (reactions || []).forEach((r) => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.user);
  });

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap relative">
      {Object.entries(grouped).map(([emoji, users]) => {
        const userReacted = users.some((u) => (u._id || u) === currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(messageId, emoji)}
            className={`text-xs px-1.5 py-0.5 rounded-full border transition ${
              userReacted
                ? "border-indigo-500 bg-indigo-600/20"
                : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
            }`}
            title={users.map((u) => u.name || "You").join(", ")}
          >
            {emoji} {users.length}
          </button>
        );
      })}

      {/* Add reaction button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="text-xs text-gray-500 hover:text-gray-300 px-1 transition"
        title="Add reaction"
      >
        +
      </button>

      {/* Emoji picker popup */}
      {showPicker && (
        <div className="absolute bottom-full mb-1 bg-gray-700 rounded-lg shadow-lg p-1.5 flex gap-1 z-10">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                toggleReaction(messageId, emoji);
                setShowPicker(false);
              }}
              className="text-base hover:scale-125 transition-transform px-0.5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, isOwn, activeConversation, currentUser }) {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  const handleEdit = () => {
    if (!editText.trim()) return;
    editMessage(msg._id, editText.trim());
    setEditing(false);
  };

  const handleDelete = () => {
    deleteMessage(msg._id);
    setShowActions(false);
  };

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
      }}
    >
      <div className="relative max-w-[70%]">
        {/* Action buttons (hover) */}
        {isOwn && showActions && !editing && (
          <div
            className={`absolute -top-3 ${isOwn ? "right-0" : "left-0"} flex gap-1 bg-gray-700 rounded-lg shadow-lg px-1 py-0.5 z-10`}
          >
            <button
              onClick={() => {
                setEditing(true);
                setEditText(msg.content);
              }}
              className="text-[10px] text-gray-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-gray-600"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-gray-600"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn ? "bg-indigo-600 rounded-br-md" : "bg-gray-700 rounded-bl-md"
          }`}
        >
          {!isOwn && (
            <p className="text-xs text-indigo-300 font-medium mb-1">
              {msg.sender?.name}
            </p>
          )}

          {/* File attachment */}
          <FilePreview msg={msg} />

          {/* Message content */}
          {editing ? (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="flex-1 px-2 py-1 rounded bg-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                autoFocus
              />
              <button
                onClick={handleEdit}
                className="text-xs text-green-400 hover:text-green-300"
              >
                ✓
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          ) : (
            msg.content && <p className="text-sm break-words">{msg.content}</p>
          )}

          <div className="flex items-center justify-end gap-1 mt-1">
            {msg.editedAt && (
              <span className="text-[10px] text-gray-400">edited</span>
            )}
            <span className="text-[10px] text-gray-400">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isOwn &&
              (() => {
                const otherMembers = (activeConversation?.members || []).filter(
                  (m) => m._id !== currentUser?._id,
                );
                const allRead =
                  otherMembers.length > 0 &&
                  otherMembers.every((m) => msg.readBy?.includes(m._id));
                return (
                  <span
                    className={`text-[10px] ml-0.5 ${allRead ? "text-blue-400" : "text-gray-500"}`}
                  >
                    {allRead ? "\u2713\u2713" : "\u2713"}
                  </span>
                );
              })()}
          </div>
        </div>

        {/* Reactions */}
        <Reactions
          reactions={msg.reactions}
          messageId={msg._id}
          currentUserId={currentUser?._id}
        />
      </div>
    </div>
  );
}

export default function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loadingMessages);
  const pagination = useChatStore((s) => s.pagination);
  const loadMore = useChatStore((s) => s.loadMoreMessages);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const currentUser = useAuthStore((s) => s.user);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            className="text-xs text-indigo-400 hover:underline"
          >
            Load older messages
          </button>
        </div>
      )}

      {loading && messages.length === 0 && (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && messages.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-10">
          No messages yet. Say hello!
        </p>
      )}

      {messages.map((msg) => {
        const isOwn = msg.sender?._id === currentUser?._id;
        return (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isOwn={isOwn}
            activeConversation={activeConversation}
            currentUser={currentUser}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
