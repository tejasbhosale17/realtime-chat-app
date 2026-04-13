import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import OnlineBadge from "./OnlineBadge";

export default function ChatWindow() {
  const activeConversation = useChatStore((s) => s.activeConversation);
  const currentUser = useAuthStore((s) => s.user);

  if (!activeConversation) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xl">Welcome, {currentUser?.name}!</p>
          <p className="text-sm mt-2">
            Select a conversation or start a new chat
          </p>
        </div>
      </main>
    );
  }

  const getTitle = () => {
    if (activeConversation.type === "group") return activeConversation.name;
    const other = activeConversation.members?.find(
      (m) => m._id !== currentUser?._id,
    );
    return other?.name || "Chat";
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
            {getTitle()[0]?.toUpperCase()}
          </div>
          {activeConversation.type === "dm" &&
            (() => {
              const other = activeConversation.members?.find(
                (m) => m._id !== currentUser?._id,
              );
              return other ? (
                <span className="absolute -bottom-0.5 -right-0.5">
                  <OnlineBadge userId={other._id} size="md" />
                </span>
              ) : null;
            })()}
        </div>
        <div>
          <p className="font-semibold text-sm">{getTitle()}</p>
          <p className="text-xs text-gray-400">
            {activeConversation.members?.length} member
            {activeConversation.members?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <MessageList />
      <TypingIndicator />
      <MessageInput />
    </main>
  );
}
