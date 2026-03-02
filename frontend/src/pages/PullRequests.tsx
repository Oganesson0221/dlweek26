import React, { useState } from "react";
import { pullRequests, commits, branches, topics } from "@/data/mockData";
import { PullRequest as PRType } from "@/types";
import {
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Shield,
  TrendingUp,
  Target,
} from "lucide-react";

const statusConfig = {
  open: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: <GitPullRequest className="w-4 h-4" />,
    label: "Open",
  },
  merged: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    icon: <GitMerge className="w-4 h-4" />,
    label: "Merged",
  },
  changes_requested: {
    bg: "bg-gold/10",
    text: "text-gold",
    border: "border-gold/20",
    icon: <AlertCircle className="w-4 h-4" />,
    label: "Changes Requested",
  },
};

function PRCard({
  pr,
  expanded,
  onToggle,
}: {
  pr: PRType;
  expanded: boolean;
  onToggle: () => void;
}) {
  const s = statusConfig[pr.status];
  const branch = branches.find((b) => b.id === pr.branch);
  const prCommits = pr.commits
    .map((cid) => commits.find((c) => c.id === cid))
    .filter(Boolean);

  return (
    <div className="bg-surface-card border border-border-subtle rounded-lg overflow-hidden">
      {/* PR Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-3 hover:bg-surface-overlay/30 transition-colors text-left"
      >
        <div className={`mt-0.5 ${s.text}`}>{s.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-white">
              {pr.title}
            </span>
            {pr.labels.map((label) => (
              <span
                key={label}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-overlay text-slate-400"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {branch?.name || "unknown"} → main · {prCommits.length} commits ·
            Score: {pr.score}%
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded flex items-center gap-1.5 shrink-0 border ${s.bg} ${s.text} ${s.border}`}
        >
          {s.label}
        </span>

        {/* Checks */}
        {pr.checksPass ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        )}

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border-subtle">
          {/* Description */}
          <div className="px-5 py-4 border-b border-border-subtle">
            <p className="text-[13px] text-slate-300 leading-relaxed">
              {pr.description}
            </p>
            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {new Date(pr.createdDate).toLocaleDateString()}
              </span>
              {pr.mergedDate && (
                <span className="flex items-center gap-1">
                  <GitMerge className="w-3 h-3" />
                  Merged {new Date(pr.mergedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Commits */}
          <div className="px-5 py-3 border-b border-border-subtle">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Commits ({prCommits.length})
            </h4>
            {prCommits.map((c) =>
              c ? (
                <div
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 text-[12px]"
                >
                  <code className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[10px]">
                    {c.hash}
                  </code>
                  <span className="text-slate-300 flex-1 truncate">
                    {c.message}
                  </span>
                  <span
                    className={`font-semibold ${c.scoreImprovement >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {c.scoreImprovement >= 0 ? "+" : ""}
                    {c.scoreImprovement}%
                  </span>
                </div>
              ) : null,
            )}
          </div>

          {/* AI Review */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h4 className="text-[13px] font-semibold text-white">
                AI Review
              </h4>
              <span className="ml-auto text-[11px] font-mono text-slate-500">
                Confidence: {pr.aiReview.confidence}%
              </span>
            </div>

            {/* Summary */}
            <p className="text-[12px] text-slate-300 leading-relaxed mb-4 bg-surface-overlay/50 rounded-lg p-3">
              {pr.aiReview.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Strengths */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                <h5 className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Strengths
                </h5>
                <ul className="space-y-1">
                  {pr.aiReview.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-slate-400 flex items-start gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
                <h5 className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3 h-3" />
                  Areas for Improvement
                </h5>
                <ul className="space-y-1">
                  {pr.aiReview.weaknesses.map((w, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-slate-400 flex items-start gap-1.5"
                    >
                      <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mt-3 bg-accent/5 border border-accent/15 rounded-lg p-3">
              <h5 className="text-[11px] font-semibold text-accent flex items-center gap-1.5 mb-2">
                <Target className="w-3 h-3" />
                Targeted Revisions
              </h5>
              <ul className="space-y-1.5">
                {pr.aiReview.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-slate-400 flex items-start gap-1.5"
                  >
                    <span className="text-accent font-mono shrink-0">
                      {i + 1}.
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Merge decision */}
            <div className="mt-3 flex items-center gap-3">
              {pr.aiReview.readyToMerge ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded-md px-3 py-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    Ready to merge — all checks passed
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gold bg-gold/10 border border-gold/15 rounded-md px-3 py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    Changes requested — complete suggestions above before
                    merging
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const PullRequests: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>("pr3");
  const [filter, setFilter] = useState<
    "all" | "open" | "merged" | "changes_requested"
  >("all");

  const filtered =
    filter === "all"
      ? pullRequests
      : pullRequests.filter((pr) => pr.status === filter);
  const openCount = pullRequests.filter(
    (p) => p.status === "open" || p.status === "changes_requested",
  ).length;
  const mergedCount = pullRequests.filter((p) => p.status === "merged").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-accent" />
            Pull Requests
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Milestone assessments with AI-powered code review
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-surface-card border border-border-subtle rounded-lg p-1 w-fit">
        {[
          { key: "all", label: `All (${pullRequests.length})` },
          { key: "open", label: `Open (${openCount})` },
          { key: "merged", label: `Merged (${mergedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-accent text-white"
                : "text-slate-400 hover:text-white hover:bg-surface-overlay"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PR list */}
      <div className="space-y-2">
        {filtered.map((pr) => (
          <PRCard
            key={pr.id}
            pr={pr}
            expanded={expandedId === pr.id}
            onToggle={() => setExpandedId(expandedId === pr.id ? null : pr.id)}
          />
        ))}
      </div>
    </div>
  );
};
