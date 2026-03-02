import React, { useState, useEffect } from "react";
import {
  topics,
  commits,
  blameEntries,
  streakInfo,
  pullRequests,
} from "@/data/mockData";
import {
  Sparkles,
  X,
  ChevronUp,
  Flame,
  AlertTriangle,
  Target,
  Lightbulb,
  BookOpen,
} from "lucide-react";

interface Suggestion {
  id: string;
  type: "streak" | "misconception" | "milestone" | "study" | "insight";
  title: string;
  body: string;
  icon: React.ReactNode;
  color: string;
  priority: number;
}

function generateSuggestions(): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Streak suggestion
  if (streakInfo.current > 0) {
    suggestions.push({
      id: "streak",
      type: "streak",
      title: `🔥 ${streakInfo.current}-day streak!`,
      body: `You're on fire! ${streakInfo.longest - streakInfo.current <= 3 ? `Only ${streakInfo.longest - streakInfo.current} more days to beat your record of ${streakInfo.longest}!` : "Keep it going!"}`,
      icon: <Flame className="w-4 h-4" />,
      color: "text-gold",
      priority: 1,
    });
  }

  // Misconception warning
  const critical = blameEntries.filter(
    (e) => e.severity === "critical" || e.severity === "high",
  );
  if (critical.length > 0) {
    const worst = critical[0];
    suggestions.push({
      id: "misconception",
      type: "misconception",
      title: "Recurring misconception detected",
      body: `"${worst.line}" — ${worst.mistake.slice(0, 80)}... Click Blame View to see AI suggestions.`,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "text-red-400",
      priority: 0,
    });
  }

  // Open PR suggestion
  const openPRs = pullRequests.filter(
    (p) => p.status === "open" || p.status === "changes_requested",
  );
  if (openPRs.length > 0) {
    const pr = openPRs[0];
    suggestions.push({
      id: "pr",
      type: "milestone",
      title: `PR #${pr.id.replace("pr", "")} needs attention`,
      body:
        pr.status === "changes_requested"
          ? `Changes requested on "${pr.title}". Review the AI feedback and address the suggestions.`
          : `"${pr.title}" is open for review.`,
      icon: <Target className="w-4 h-4" />,
      color: "text-accent",
      priority: 2,
    });
  }

  // Weak topic suggestion
  const weakTopics = topics
    .filter((t) => t.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery);
  if (weakTopics.length > 0) {
    const weak = weakTopics[0];
    suggestions.push({
      id: "study",
      type: "study",
      title: `${weak.name} needs work`,
      body: `Only ${weak.mastery}% mastery. Consider scheduling a focused study session. The AI Tutor can help!`,
      icon: <BookOpen className="w-4 h-4" />,
      color: "text-purple-400",
      priority: 3,
    });
  }

  // Study insight
  const recentCommits = commits.slice(0, 5);
  const avgImprovement =
    recentCommits.reduce((a, c) => a + c.scoreImprovement, 0) /
    recentCommits.length;
  suggestions.push({
    id: "insight",
    type: "insight",
    title: "Learning velocity",
    body: `Your last 5 sessions averaged +${avgImprovement.toFixed(1)}% improvement. ${avgImprovement > 6 ? "Excellent pace!" : "Consider focusing on fewer topics for deeper learning."}`,
    icon: <Lightbulb className="w-4 h-4" />,
    color: "text-emerald-400",
    priority: 4,
  });

  return suggestions.sort((a, b) => a.priority - b.priority);
}

export const CopilotAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pulse, setPulse] = useState(true);

  const allSuggestions = generateSuggestions();
  const suggestions = allSuggestions.filter((s) => !dismissed.has(s.id));

  useEffect(() => {
    // Pulse animation for attention
    const timer = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded panel */}
      {isOpen && (
        <div className="mb-3 w-80 bg-surface-raised/95 backdrop-blur-xl border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-subtle bg-accent/5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-[13px] font-semibold text-white flex-1">
              Microsoft CoursePilot
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="max-h-80 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-400">All caught up! 🎉</p>
                <p className="text-xs text-slate-600 mt-1">
                  No new suggestions right now.
                </p>
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s.id}
                  className="px-4 py-3 border-b border-border-subtle last:border-0 hover:bg-surface-overlay/30 transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 shrink-0 ${s.color}`}>{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {s.body}
                      </p>
                    </div>
                    <button
                      onClick={() => dismiss(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-slate-400 transition-all shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border-subtle bg-surface-card/50">
            <p className="text-[10px] text-slate-600 text-center">
              Powered by GPT-4o · Updates based on your learning state
            </p>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setPulse(false);
        }}
        className={`relative w-12 h-12 rounded-full bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent/20 flex items-center justify-center transition-all duration-300 ${
          isOpen ? "rotate-0" : "hover:scale-105"
        } ${pulse ? "animate-pulse-slow" : ""}`}
      >
        {isOpen ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}

        {/* Notification badge */}
        {!isOpen && suggestions.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {suggestions.length}
          </span>
        )}
      </button>
    </div>
  );
};
