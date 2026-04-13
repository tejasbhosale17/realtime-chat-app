import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import OnlineBadge from "./OnlineBadge";

export default function ConversationList({ onSelect }) {
  const conversations = useChatStore((s) => s.conversations);
  const getFilteredConversations = useChatStore(
    (s) => s.getFilteredConversations,
  );
  const activeConversation = useChatStore((s) => s.activeConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const loading = useChatStore((s) => s.loadingConversations);
  const currentUser = useAuthStore((s) => s.user);

  const filtered = getFilteredConversations();

  const getDisplayName = (conv) => {
    if (conv.type === "group") return conv.name;
    const other = conv.members?.find((m) => m._id !== currentUser?._id);
    return other?.name || "Unknown";
  };

  const getAvatar = (conv) => {
    if (conv.type === "group") return conv.name?.[0]?.toUpperCase() || "G";
    const other = conv.members?.find((m) => m._id !== currentUser?._id);
    return other?.name?.[0]?.toUpperCase() || "?";
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return "No messages yet";
    const sender = conv.lastMessage.sender?.name || "";
    const content = conv.lastMessage.content || "Attachment";
    return `${sender}: ${content}`.substring(0, 50);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-700 rounded w-24" />
              <div className="h-2.5 bg-gray-700/60 rounded w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500 text-center text-sm">
          No conversations yet. Start a new chat!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {filtered.map((conv) => {
        const unread = unreadCounts[conv._id] || 0;
        return (
          <button
            key={conv._id}
            onClick={() => {
              setActiveConversation(conv);
              onSelect?.();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/80 transition-colors text-left ${
              activeConversation?._id === conv._id ? "bg-gray-700" : ""
            }`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                {getAvatar(conv)}
              </div>
              {conv.type === "dm" &&
                (() => {
                  const other = conv.members?.find(
                    (m) => m._id !== currentUser?._id,
                  );
                  return other ? (
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <OnlineBadge userId={other._id} />
                    </span>
                  ) : null;
                })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate">
                  {getDisplayName(conv)}
                </p>
                {unread > 0 && (
                  <span className="ml-2 flex-shrink-0 bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
              <p
                className={`text-xs truncate ${unread > 0 ? "text-gray-300 font-medium" : "text-gray-400"}`}
              >
                {getLastMessagePreview(conv)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
