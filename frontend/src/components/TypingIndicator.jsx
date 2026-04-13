import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";

export default function TypingIndicator() {
  const activeConversation = useChatStore((s) => s.activeConversation);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const currentUser = useAuthStore((s) => s.user);

  if (!activeConversation) return null;

  const typers = (typingUsers[activeConversation._id] || []).filter(
    (id) => id !== currentUser?._id,
  );

  if (typers.length === 0) return null;

  // Find names from conversation members
  const names = typers
    .map((id) => {
      const member = activeConversation.members?.find((m) => m._id === id);
      return member?.name?.split(" ")[0] || "Someone";
    })
    .slice(0, 3);

  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : `${names[0]} and ${names.length - 1} others are typing...`;

  return (
    <div className="px-4 py-1.5 text-xs text-indigo-400 flex items-center gap-2">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
      {text}
    </div>
  );
}
