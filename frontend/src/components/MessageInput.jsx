import { useState, useRef, useCallback } from "react";
import useChatStore from "../store/chatStore";
import toast from "react-hot-toast";

export default function MessageInput() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const uploadFile = useChatStore((s) => s.uploadFile);
  const emitTypingStart = useChatStore((s) => s.emitTypingStart);
  const emitTypingStop = useChatStore((s) => s.emitTypingStop);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  const handleTyping = useCallback(() => {
    emitTypingStart();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitTypingStop();
    }, 2000);
  }, [emitTypingStart, emitTypingStop]);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    let fileData = null;
    if (file) {
      setUploading(true);
      try {
        fileData = await uploadFile(file);
      } catch {
        toast.error("File upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    sendMessage(text.trim(), fileData);
    setText("");
    clearFile();
    emitTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  return (
    <div className="border-t border-gray-700">
      {/* File preview */}
      {file && (
        <div className="px-4 pt-3 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 text-sm">
            {file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-10 h-10 rounded object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            )}
            <span className="text-gray-300 truncate max-w-[200px]">
              {file.name}
            </span>
            <button
              onClick={clearFile}
              className="text-gray-400 hover:text-white ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 flex gap-3 items-center">
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-700"
          title="Attach file"
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
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) handleTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !file) || uploading}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Send"}
        </button>
      </form>
    </div>
  );
}
