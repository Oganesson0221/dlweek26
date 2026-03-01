import React, { useState } from "react";
import {
  MessageSquare,
  X,
  Send,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Bell,
  Target,
} from "lucide-react";
import { copilotSuggestions } from "@/data/learnLensData";
import type { CopilotSuggestion } from "@/types";

interface CopilotCompanionProps {
  onNavigate?: (page: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  study: <BookOpen className="w-3.5 h-3.5" />,
  insight: <Lightbulb className="w-3.5 h-3.5" />,
  reminder: <Bell className="w-3.5 h-3.5" />,
  tip: <Target className="w-3.5 h-3.5" />,
};

export const CopilotCompanion: React.FC<CopilotCompanionProps> = ({
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [showChat, setShowChat] = useState(false);

  const suggestions = copilotSuggestions.filter((s) => !dismissed.has(s.id));

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      let response = "";
      const lower = userMsg.toLowerCase();
      if (lower.includes("2 hours") || lower.includes("two hours")) {
        response =
          "With 2 hours, I'd suggest:\n\n1. Graph Traversals (CS 301) — 45 min, focus on BFS. Midterm in 5 days.\n2. Eigenvalues (MATH 240) — 45 min, practice characteristic equations.\n3. DC Circuits (PHYS 201) — 30 min, Kirchhoff's laws review.\n\nCovers your three weakest areas before midterms.";
      } else if (lower.includes("midterm") || lower.includes("exam")) {
        response =
          "3 midterms in Week 8 (Mar 5–6):\n\n• CS 301 (Mar 6): Graphs, Trees, Hash Tables — ~12h prep\n• MATH 240 (Mar 5): Eigenvalues at 30% mastery — ~15h prep\n• PHYS 201 (Mar 6): DC Circuits at 35% — ~14h prep\n\nTotal ~41h. Spread over 5 days at 8h/day.";
      } else if (lower.includes("weak") || lower.includes("improve")) {
        response =
          "Weakest areas by urgency:\n\n1. Sampling Distributions (STAT 200) — 28%\n2. Eigenvalues (MATH 240) — 30%\n3. DC Circuits (PHYS 201) — 35%\n4. Graph Traversals (CS 301) — 45%\n\nPrioritize CS 301 and MATH 240 — midterms next week.";
      } else {
        response =
          "I can help with study planning and identifying focus areas. Try:\n\n• \"I have 2 hours, what should I study?\"\n• \"Help me prepare for midterms\"\n• \"What are my weakest topics?\"";
      }
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    }, 600);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-2 w-[340px] bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-neutral-800">
                Copilot
              </span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => setShowChat(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    !showChat
                      ? "bg-neutral-100 text-neutral-700"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Suggestions
                </button>
                <button
                  onClick={() => setShowChat(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    showChat
                      ? "bg-neutral-100 text-neutral-700"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Chat
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {showChat ? (
            <div className="flex flex-col h-72">
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {chatMessages.length === 0 && (
                  <div className="py-6 px-2">
                    <p className="text-xs text-neutral-400 mb-3">
                      Ask about your courses, study planning, or weak areas.
                    </p>
                    <div className="space-y-1.5">
                      {[
                        "I have 2 hours, what should I study?",
                        "Help me prepare for midterms",
                        "What are my weakest topics?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setChatInput(q)}
                          className="block w-full text-left px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-md text-[11px] text-neutral-600 border border-neutral-100"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-md text-[12px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-accent text-white"
                          : "bg-neutral-50 text-neutral-700 border border-neutral-100"
                      }`}
                    >
                      {msg.content.split("\n").map((line, j) => (
                        <React.Fragment key={j}>
                          {line}
                          {j < msg.content.split("\n").length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2.5 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask Copilot..."
                    className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:border-neutral-300"
                  />
                  <button
                    onClick={handleSend}
                    className="p-1.5 bg-accent text-white rounded-md hover:bg-accent-light"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {suggestions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-neutral-500">All caught up.</p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="px-4 py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0 text-neutral-400">
                        {iconMap[s.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-neutral-700">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                          {s.body}
                        </p>
                        {s.actionLabel && (
                          <button
                            onClick={() => {
                              if (s.actionPage && onNavigate) {
                                onNavigate(s.actionPage);
                                setIsOpen(false);
                              }
                            }}
                            className="mt-1.5 text-[11px] font-medium text-accent hover:underline"
                          >
                            {s.actionLabel}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setDismissed((prev) => new Set([...prev, s.id]))
                        }
                        className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-neutral-500 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center shadow-md"
      >
        {isOpen ? (
          <X className="w-4 h-4" />
        ) : (
          <MessageSquare className="w-4 h-4" />
        )}
        {!isOpen && suggestions.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {suggestions.length}
          </span>
        )}
      </button>
    </div>
  );
};
