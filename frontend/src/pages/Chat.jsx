import { useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import useChatStore from "../store/chatStore";
import useFriendStore from "../store/friendStore";
import { connectSocket, disconnectSocket } from "../services/socket";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import NewChatModal from "../components/NewChatModal";
import FriendsPanel from "../components/FriendsPanel";
import usePushNotifications from "../hooks/usePushNotifications";

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
  const handleGroupMemberAdded = useChatStore((s) => s.handleGroupMemberAdded);
  const handleGroupMemberRemoved = useChatStore(
    (s) => s.handleGroupMemberRemoved,
  );
  const handleRemovedFromGroup = useChatStore((s) => s.handleRemovedFromGroup);
  const handleGroupMemberLeft = useChatStore((s) => s.handleGroupMemberLeft);
  const handleGroupUpdated = useChatStore((s) => s.handleGroupUpdated);
  const handleMessageReactionUpdated = useChatStore(
    (s) => s.handleMessageReactionUpdated,
  );
  const handleFriendRequestReceived = useFriendStore(
    (s) => s.handleFriendRequestReceived,
  );
  const handleFriendRequestAccepted = useFriendStore(
    (s) => s.handleFriendRequestAccepted,
  );
  const [showNewChat, setShowNewChat] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const { isSupported, isSubscribed, subscribe, unsubscribe } =
    usePushNotifications();

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
      socket.on("group_member_added", handleGroupMemberAdded);
      socket.on("group_member_removed", handleGroupMemberRemoved);
      socket.on("removed_from_group", handleRemovedFromGroup);
      socket.on("group_member_left", handleGroupMemberLeft);
      socket.on("group_updated", handleGroupUpdated);
      socket.on("message_reaction_updated", handleMessageReactionUpdated);
      socket.on("friend_request_received", handleFriendRequestReceived);
      socket.on("friend_request_accepted", handleFriendRequestAccepted);

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
        socket.off("group_member_added", handleGroupMemberAdded);
        socket.off("group_member_removed", handleGroupMemberRemoved);
        socket.off("removed_from_group", handleRemovedFromGroup);
        socket.off("group_member_left", handleGroupMemberLeft);
        socket.off("group_updated", handleGroupUpdated);
        socket.off("message_reaction_updated", handleMessageReactionUpdated);
        socket.off("friend_request_received", handleFriendRequestReceived);
        socket.off("friend_request_accepted", handleFriendRequestAccepted);
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
              onClick={() => setShowFriends(true)}
              className="text-sm text-gray-300 hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-700 transition"
              title="Friends"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>
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
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          {isSupported && (
            <button
              onClick={isSubscribed ? unsubscribe : subscribe}
              className="text-gray-400 hover:text-white transition"
              title={
                isSubscribed ? "Disable notifications" : "Enable notifications"
              }
            >
              {isSubscribed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2a7 7 0 00-7 7v4.28l-1.71 1.71A1 1 0 004 17h16a1 1 0 00.71-1.71L19 13.28V9a7 7 0 00-7-7zm0 20a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <ChatWindow />

      {/* New chat modal */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}

      {/* Friends panel */}
      {showFriends && <FriendsPanel onClose={() => setShowFriends(false)} />}
    </div>
  );
}
