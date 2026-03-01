import React, { useState } from "react";
import { blameEntries, commits } from "@/data/mockData";
import { BlameEntry } from "@/types";
import {
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Target,
} from "lucide-react";

const severityConfig = {
  critical: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    label: "Critical",
    dot: "bg-red-400",
  },
  high: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    label: "High",
    dot: "bg-orange-400",
  },
  medium: {
    bg: "bg-gold/10",
    text: "text-gold",
    border: "border-gold/20",
    label: "Medium",
    dot: "bg-gold",
  },
  low: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
    label: "Low",
    dot: "bg-slate-400",
  },
};

export const BlameView: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>("m2");
  const [sortBy, setSortBy] = useState<"severity" | "frequency" | "recent">(
    "severity",
  );

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...blameEntries].sort((a, b) => {
    if (sortBy === "severity")
      return severityOrder[a.severity] - severityOrder[b.severity];
    if (sortBy === "frequency") return b.frequency - a.frequency;
    return (
      new Date(b.lastOccurred).getTime() - new Date(a.lastOccurred).getTime()
    );
  });

  const criticalCount = blameEntries.filter(
    (e) => e.severity === "critical",
  ).length;
  const highCount = blameEntries.filter((e) => e.severity === "high").length;
  const totalMistakes = blameEntries.reduce((a, e) => a + e.frequency, 0);

  // Aggregate by responsible cause
  const byResponsible: Record<string, number> = {};
  blameEntries.forEach((e) => {
    byResponsible[e.responsible] =
      (byResponsible[e.responsible] || 0) + e.frequency;
  });
  const topCauses = Object.entries(byResponsible)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-gold" />
            Blame View
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Identifying misconceptions and recurring mistakes across your
            learning
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input-field w-auto py-1.5 text-xs"
        >
          <option value="severity">Sort by severity</option>
          <option value="frequency">Sort by frequency</option>
          <option value="recent">Sort by most recent</option>
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-surface-card border border-border-subtle rounded-lg px-4 py-3">
          <p className="text-lg font-bold text-white">{blameEntries.length}</p>
          <p className="text-[11px] text-slate-500">Tracked Issues</p>
        </div>
        <div className="bg-surface-card border border-red-500/15 rounded-lg px-4 py-3">
          <p className="text-lg font-bold text-red-400">
            {criticalCount + highCount}
          </p>
          <p className="text-[11px] text-slate-500">Critical/High</p>
        </div>
        <div className="bg-surface-card border border-gold/15 rounded-lg px-4 py-3">
          <p className="text-lg font-bold text-gold">{totalMistakes}</p>
          <p className="text-[11px] text-slate-500">Total Occurrences</p>
        </div>
        <div className="bg-surface-card border border-border-subtle rounded-lg px-4 py-3">
          <p className="text-lg font-bold text-emerald-400">
            {blameEntries.filter((e) => e.frequency === 1).length}
          </p>
          <p className="text-[11px] text-slate-500">One-time Issues</p>
        </div>
      </div>

      {/* Root causes */}
      <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          Root Causes (git blame)
        </h2>
        <div className="space-y-2.5">
          {topCauses.map(([cause, count]) => (
            <div key={cause} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[12px] text-slate-300">{cause}</p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${(count / totalMistakes) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500 w-16 text-right">
                {count}× ({Math.round((count / totalMistakes) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Blame entries */}
      <div className="space-y-2">
        {sorted.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const sev = severityConfig[entry.severity];
          const commit = commits.find((c) => c.hash === entry.commitHash);

          return (
            <div
              key={entry.id}
              className="bg-surface-card border border-border-subtle rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-surface-overlay/30 transition-colors text-left"
              >
                {/* Severity dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-white truncate">
                      {entry.line}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${sev.bg} ${sev.text} ${sev.border}`}
                    >
                      {sev.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {entry.mistake}
                  </p>
                </div>

                {/* Frequency */}
                <div className="flex items-center gap-1 shrink-0">
                  <BarChart3 className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px] font-mono text-slate-400">
                    {entry.frequency}×
                  </span>
                </div>

                {/* Commit ref */}
                <code className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">
                  {entry.commitHash}
                </code>

                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-border-subtle px-5 py-4 space-y-3">
                  {/* Mistake detail */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      Misconception
                    </h4>
                    <p className="text-[13px] text-slate-300">
                      {entry.mistake}
                    </p>
                  </div>

                  {/* Responsible */}
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-semibold text-gold">
                        Root Cause
                      </h4>
                      <p className="text-[12px] text-slate-400">
                        {entry.responsible}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion */}
                  <div className="bg-accent/5 border border-accent/15 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-semibold text-accent">
                        AI Suggestion
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      {entry.suggestion}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-600">
                    <span>Topic: {entry.topic}</span>
                    <span>
                      Last occurred:{" "}
                      {new Date(entry.lastOccurred).toLocaleDateString()}
                    </span>
                    {commit && <span>Session: {commit.message}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
