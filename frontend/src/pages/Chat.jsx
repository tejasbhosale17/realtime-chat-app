import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";
import { connectSocket, disconnectSocket } from "../services/socket";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import NewChatModal from "../components/NewChatModal";

export default function Chat() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const handleNewMessage = useChatStore((s) => s.handleNewMessage);
  const handleConversationUpdated = useChatStore(
    (s) => s.handleConversationUpdated,
  );
  const handleMessageUpdated = useChatStore((s) => s.handleMessageUpdated);
  const handleMessageDeleted = useChatStore((s) => s.handleMessageDeleted);
  const handleUserTyping = useChatStore((s) => s.handleUserTyping);
  const handleUserStoppedTyping = useChatStore(
    (s) => s.handleUserStoppedTyping,
  );
  const handleUserOnline = useChatStore((s) => s.handleUserOnline);
  const handleUserOffline = useChatStore((s) => s.handleUserOffline);
  const handleMessagesRead = useChatStore((s) => s.handleMessagesRead);
  const fetchOnlineStatuses = useChatStore((s) => s.fetchOnlineStatuses);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    fetchConversations().then(() => {
      const convs = useChatStore.getState().conversations;
      const memberIds = [
        ...new Set(convs.flatMap((c) => c.members.map((m) => m._id))),
      ];
      if (memberIds.length) fetchOnlineStatuses(memberIds);
    });

    const token = localStorage.getItem("accessToken");
    if (token) {
      const socket = connectSocket(token);

      socket.on("new_message", handleNewMessage);
      socket.on("conversation_updated", handleConversationUpdated);
      socket.on("message_updated", handleMessageUpdated);
      socket.on("message_deleted", handleMessageDeleted);
      socket.on("user_typing", handleUserTyping);
      socket.on("user_stopped_typing", handleUserStoppedTyping);
      socket.on("user_online", handleUserOnline);
      socket.on("user_offline", handleUserOffline);
      socket.on("messages_read", handleMessagesRead);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("conversation_updated", handleConversationUpdated);
        socket.off("message_updated", handleMessageUpdated);
        socket.off("message_deleted", handleMessageDeleted);
        socket.off("user_typing", handleUserTyping);
        socket.off("user_stopped_typing", handleUserStoppedTyping);
        socket.off("user_online", handleUserOnline);
        socket.off("user_offline", handleUserOffline);
        socket.off("messages_read", handleMessagesRead);
        disconnectSocket();
      };
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-80 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-lg font-bold">ChatApp</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewChat(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition"
            >
              + New
            </button>
            <button
              onClick={logout}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-3">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <ConversationList />

        <div className="p-4 border-t border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <ChatWindow />

      {/* New chat modal */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
}
