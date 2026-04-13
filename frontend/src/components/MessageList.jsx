import { useRef, useEffect } from "react";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";

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
          <div
            key={msg._id}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                isOwn
                  ? "bg-indigo-600 rounded-br-md"
                  : "bg-gray-700 rounded-bl-md"
              }`}
            >
              {!isOwn && (
                <p className="text-xs text-indigo-300 font-medium mb-1">
                  {msg.sender?.name}
                </p>
              )}
              <p className="text-sm break-words">{msg.content}</p>
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
                    const otherMembers = (
                      activeConversation?.members || []
                    ).filter((m) => m._id !== currentUser?._id);
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
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
