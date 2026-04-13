import { useState } from "react";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import OnlineBadge from "./OnlineBadge";
import GroupManagement from "./GroupManagement";

export default function ChatWindow({ onOpenSidebar }) {
  const activeConversation = useChatStore((s) => s.activeConversation);
  const currentUser = useAuthStore((s) => s.user);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  if (!activeConversation) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <button
            onClick={onOpenSidebar}
            className="md:hidden mb-4 text-gray-400 hover:text-white transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
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
    <main className="flex-1 flex flex-col min-w-0">
      {/* Chat header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-700 flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-gray-400 hover:text-white transition flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
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
        {activeConversation.type === "group" && (
          <button
            onClick={() => setShowGroupSettings(true)}
            className="ml-auto text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-gray-700"
            title="Group Settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>

      <MessageList />
      <TypingIndicator />
      <MessageInput />

      {showGroupSettings && (
        <GroupManagement
          conversation={activeConversation}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
    </main>
  );
}
