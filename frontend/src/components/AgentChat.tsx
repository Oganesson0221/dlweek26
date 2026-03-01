import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader, Tool, AlertCircle } from "lucide-react";
import { Message } from "@/types";

interface AgentChatProps {
  messages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
  agentName: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  agentName,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case "user":
        return <User className="w-5 h-5" />;
      case "assistant":
        return <Bot className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getMessageColor = (role: string) => {
    switch (role) {
      case "user":
        return "bg-primary-50 text-primary-800";
      case "assistant":
        return "bg-gray-50 text-gray-800";
      default:
        return "bg-yellow-50 text-yellow-800";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">{agentName}</h2>
          <span className="ml-auto text-xs text-gray-500">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Start a conversation with {agentName}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Ask me anything or give me a task to complete
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.role === "user"
                  ? "flex-row-reverse space-x-reverse"
                  : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user" ? "bg-primary-100" : "bg-gray-100"
                }`}
              >
                {getMessageIcon(message.role)}
              </div>
              <div
                className={`flex-1 max-w-3xl rounded-lg p-4 ${getMessageColor(
                  message.role,
                )}`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                    <Tool className="w-3 h-3" />
                    <span>Tools used: {message.toolsUsed.join(", ")}</span>
                  </div>
                )}
                <span className="text-xs text-gray-400 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">{agentName} is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input-field"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send • Agent can use tools automatically
        </p>
      </form>
    </div>
  );
};
