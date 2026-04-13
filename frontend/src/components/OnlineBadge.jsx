import useChatStore from "../store/chatStore";

export default function OnlineBadge({ userId, size = "sm" }) {
  const isOnline = useChatStore((s) => s.onlineUsers[userId]);

  const sizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`${sizes[size]} rounded-full border-2 border-gray-800 ${
        isOnline ? "bg-green-500" : "bg-gray-500"
      }`}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
