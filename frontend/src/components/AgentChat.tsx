import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader, Wrench, AlertCircle } from "lucide-react";
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
        return <User className="w-4 h-4" />;
      case "assistant":
        return <Bot className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border border-border-subtle rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border-subtle bg-surface-raised/50">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent" />
          <h2 className="text-[13px] font-semibold text-white">{agentName}</h2>
          <span className="ml-auto text-[11px] text-slate-500">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              Start a conversation with {agentName}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Ask me anything or give me a task to complete
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-accent/20 text-accent-light"
                    : "bg-surface-overlay text-slate-400"
                }`}
              >
                {getMessageIcon(message.role)}
              </div>
              <div
                className={`flex-1 max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-accent/15 text-slate-200"
                    : message.role === "assistant"
                      ? "bg-surface-overlay text-slate-300"
                      : "bg-gold/10 text-gold"
                }`}
              >
                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Wrench className="w-3 h-3" />
                    <span>Tools: {message.toolsUsed.join(", ")}</span>
                  </div>
                )}
                <span className="text-[10px] text-slate-600 mt-1.5 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-accent">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs">{agentName} is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border-subtle"
      >
        <div className="flex items-center gap-2">
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
        <p className="text-[11px] text-slate-600 mt-1.5">
          Press Enter to send · Agent responds with GPT-4o
        </p>
      </form>
    </div>
  );
};
