import React, { useState } from "react";
import {
  Sparkles,
  X,
  ChevronUp,
  Send,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Clock,
  Bell,
  Target,
} from "lucide-react";
import { copilotSuggestions } from "@/data/learnLensData";
import type { CopilotSuggestion } from "@/types";

interface CopilotCompanionProps {
  onNavigate?: (page: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4" />,
  study: <BookOpen className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
  reminder: <Bell className="w-4 h-4" />,
  tip: <Target className="w-4 h-4" />,
};

const colorMap: Record<string, string> = {
  warning: "text-[#d83b01]",
  study: "text-[#0078d4]",
  insight: "text-[#107c10]",
  reminder: "text-[#ffb900]",
  tip: "text-[#8661c5]",
};

const bgMap: Record<string, string> = {
  warning: "bg-[#d83b01]/8",
  study: "bg-[#0078d4]/8",
  insight: "bg-[#107c10]/8",
  reminder: "bg-[#ffb900]/8",
  tip: "bg-[#8661c5]/8",
};

export const CopilotCompanion: React.FC<CopilotCompanionProps> = ({ onNavigate }) => {
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

    // Simulate AI response
    setTimeout(() => {
      let response = "";
      const lower = userMsg.toLowerCase();
      if (lower.includes("2 hours") || lower.includes("two hours")) {
        response =
          "With 2 hours available, I recommend:\n\n1. Graph Traversals (CS 301) - 45 min: Focus on BFS implementation since your midterm is in 5 days.\n\n2. Eigenvalues (MATH 240) - 45 min: Practice characteristic equations. Review determinant properties first.\n\n3. Quick review of DC Circuits (PHYS 201) - 30 min: Kirchhoff's laws are high-priority for the midterm.\n\nThis covers your three weakest areas before midterm week.";
      } else if (lower.includes("midterm") || lower.includes("exam")) {
        response =
          "You have 3 midterms in Week 8 (March 5-6):\n\n- CS 301 Midterm (Mar 6): Focus on Graphs, Trees, and Hash Tables. Estimated prep: 12 hours.\n- MATH 240 Midterm (Mar 5): Eigenvalues need the most work (30% mastery). Estimated prep: 15 hours.\n- PHYS 201 Midterm (Mar 6): DC Circuits is weakest (35% mastery). Estimated prep: 14 hours.\n\nTotal: ~41 hours. I recommend spreading this over the next 5 days at 8 hours/day.";
      } else if (lower.includes("weak") || lower.includes("improve")) {
        response =
          "Your weakest areas ranked by urgency:\n\n1. Sampling Distributions (STAT 200) - 28% mastery\n2. Eigenvalues (MATH 240) - 30% mastery\n3. DC Circuits (PHYS 201) - 35% mastery\n4. Graph Traversals (CS 301) - 45% mastery\n\nPrioritize CS 301 and MATH 240 since their midterms are next week.";
      } else {
        response =
          "I can help you with study planning, quiz practice, and identifying areas that need attention. Try asking:\n\n- 'I have 2 hours, what should I study?'\n- 'What should I focus on for midterms?'\n- 'What are my weakest topics?'\n- 'Generate a quiz for [topic]'";
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 w-[360px] bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-[#0078d4]/5 to-transparent flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0078d4] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-[13px] font-semibold text-slate-800">
                Copilot Companion
              </span>
              <p className="text-[10px] text-slate-400">Your learning assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  showChat
                    ? "bg-[#0078d4] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showChat ? (
            /* Chat Mode */
            <div className="flex flex-col h-80">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-[#0078d4]/30 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400">
                      Ask me anything about your studies
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {[
                        "I have 2 hours, what should I study?",
                        "Help me prepare for midterms",
                        "What are my weakest topics?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setChatInput(q);
                          }}
                          className="block w-full text-left px-3 py-2 bg-slate-50 hover:bg-[#0078d4]/5 rounded-lg text-[11px] text-slate-500 hover:text-[#0078d4] transition-colors border border-slate-100"
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
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#0078d4] text-white"
                          : "bg-slate-100 text-slate-700"
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
              <div className="p-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask Copilot..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]/40 outline-none"
                  />
                  <button
                    onClick={handleSend}
                    className="p-2 bg-[#0078d4] text-white rounded-lg hover:bg-[#0078d4]/90 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Suggestions Mode */
            <div className="max-h-80 overflow-y-auto">
              {suggestions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[13px] text-slate-500">All caught up</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    No new suggestions right now.
                  </p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 shrink-0 p-1.5 rounded-md ${bgMap[s.type]} ${colorMap[s.type]}`}
                      >
                        {iconMap[s.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-700">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
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
                            className="mt-1.5 text-[11px] font-medium text-[#0078d4] hover:underline"
                          >
                            {s.actionLabel}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setDismissed((prev) => new Set([...prev, s.id]))}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-slate-400 text-center">
              Powered by Copilot -- Personalized learning guidance
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-12 h-12 rounded-full bg-[#0078d4] hover:bg-[#0078d4]/90 text-white shadow-lg shadow-[#0078d4]/20 flex items-center justify-center transition-all duration-300 ${
          isOpen ? "" : "hover:scale-105"
        }`}
      >
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {!isOpen && suggestions.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d83b01] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {suggestions.length}
          </span>
        )}
      </button>
    </div>
  );
};
