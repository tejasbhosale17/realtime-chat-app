import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import OnlineBadge from "./OnlineBadge";

export default function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversation = useChatStore((s) => s.activeConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const loading = useChatStore((s) => s.loadingConversations);
  const currentUser = useAuthStore((s) => s.user);

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
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
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
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => (
        <button
          key={conv._id}
          onClick={() => setActiveConversation(conv)}
          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition text-left ${
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
            <p className="font-medium text-sm truncate">
              {getDisplayName(conv)}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {getLastMessagePreview(conv)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
