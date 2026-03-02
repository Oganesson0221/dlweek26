import React, { useState } from "react";
import { commits, branches, topics } from "@/data/mockData";
import { StudyCommit } from "@/types";
import {
  GitCommitHorizontal,
  Clock,
  TrendingUp,
  TrendingDown,
  BookOpen,
  FileText,
  Zap,
  Award,
  Filter,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  study: <BookOpen className="w-3.5 h-3.5" />,
  quiz: <Award className="w-3.5 h-3.5" />,
  review: <FileText className="w-3.5 h-3.5" />,
  practice: <Zap className="w-3.5 h-3.5" />,
  exam: <Award className="w-3.5 h-3.5" />,
};

function difficultyBars(d: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <div
      key={i}
      className={`w-1.5 rounded-full ${i < d ? "bg-accent" : "bg-slate-700"}`}
      style={{ height: `${8 + i * 2}px` }}
    />
  ));
}

export const CommitHistory: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);

  const sortedCommits = [...commits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const filtered =
    filter === "all"
      ? sortedCommits
      : sortedCommits.filter((c) => c.topic === filter);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group by date
  const grouped: Record<string, StudyCommit[]> = {};
  filtered.forEach((c) => {
    const key = formatDate(c.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitCommitHorizontal className="w-5 h-5 text-accent" />
            Commit History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {commits.length} study sessions tracked across {topics.length}{" "}
            topics
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto py-1.5 text-xs"
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Commit Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total Commits",
            value: commits.length,
            color: "text-accent",
          },
          {
            label: "Hours Studied",
            value: `${Math.round(commits.reduce((a, c) => a + c.timeSpentMinutes, 0) / 60)}h`,
            color: "text-gold",
          },
          {
            label: "Avg Improvement",
            value: `+${(commits.reduce((a, c) => a + c.scoreImprovement, 0) / commits.length).toFixed(1)}%`,
            color: "text-emerald-400",
          },
          {
            label: "Active Branches",
            value: branches.filter((b) => b.status === "active").length,
            color: "text-purple-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface-card border border-border-subtle rounded-lg px-4 py-3"
          >
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {Object.entries(grouped).map(([dateLabel, dateCommits]) => (
          <div key={dateLabel}>
            {/* Date separator */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {dateLabel}
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Commits */}
            {dateCommits.map((commit, idx) => {
              const topicObj = topics.find((t) => t.id === commit.topic);
              const isHovered = hoveredCommit === commit.id;

              return (
                <div
                  key={commit.id}
                  className="relative pl-6 group"
                  onMouseEnter={() => setHoveredCommit(commit.id)}
                  onMouseLeave={() => setHoveredCommit(null)}
                >
                  {/* Vertical line */}
                  <div className="absolute left-[3px] top-0 bottom-0 w-0.5 bg-border-subtle" />

                  {/* Dot */}
                  <div
                    className="absolute left-0 top-4 w-[8px] h-[8px] rounded-full border-2 z-10"
                    style={{
                      backgroundColor: topicObj?.color || "#64748b",
                      borderColor: isHovered
                        ? "#fff"
                        : topicObj?.color || "#64748b",
                    }}
                  />

                  {/* Card */}
                  <div
                    className={`mb-2 bg-surface-card border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                      isHovered
                        ? "border-accent/40 bg-surface-overlay/60"
                        : "border-border-subtle"
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <code className="text-[11px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          {commit.hash}
                        </code>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${topicObj?.color}20`,
                            color: topicObj?.color,
                          }}
                        >
                          {commit.topicName}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          {typeIcons[commit.type]}
                          {commit.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {difficultyBars(commit.difficulty)}
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-[13px] font-medium text-white mb-1.5">
                      {commit.message}
                    </p>

                    {/* Metrics row */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {commit.timeSpentMinutes}m
                      </span>
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          commit.scoreImprovement >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {commit.scoreImprovement >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {commit.scoreImprovement >= 0 ? "+" : ""}
                        {commit.scoreImprovement}%
                      </span>
                      <span className="text-slate-600">
                        {commit.scoreBefore}% → {commit.scoreAfter}%
                      </span>
                      {commit.mistakes.length > 0 && (
                        <span className="text-gold flex items-center gap-1">
                          ⚠ {commit.mistakes.length} issue
                          {commit.mistakes.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Expanded details on hover */}
                    {isHovered && commit.notes && (
                      <div className="mt-3 pt-3 border-t border-border-subtle">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          📝 {commit.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
