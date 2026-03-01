import React, { useState } from "react";
import { branches, commits, topics } from "@/data/mockData";
import { LearningBranch } from "@/types";
import {
  GitBranch,
  GitMerge,
  GitPullRequest,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

function BranchCard({
  branch,
  expanded,
  onToggle,
}: {
  branch: LearningBranch;
  expanded: boolean;
  onToggle: () => void;
}) {
  const topicObj = topics.find((t) => t.id === branch.topic);
  const branchCommits = branch.commits
    .map((cid) => commits.find((c) => c.id === cid))
    .filter(Boolean);

  const totalTime = branchCommits.reduce(
    (a, c) => a + (c?.timeSpentMinutes || 0),
    0,
  );
  const totalImprovement = branchCommits.reduce(
    (a, c) => a + (c?.scoreImprovement || 0),
    0,
  );

  const statusConfig = {
    active: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      label: "Active",
      icon: <GitBranch className="w-3 h-3" />,
    },
    merged: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20",
      label: "Merged",
      icon: <GitMerge className="w-3 h-3" />,
    },
    stale: {
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      border: "border-slate-500/20",
      label: "Stale",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const s = statusConfig[branch.status];

  return (
    <div className="bg-surface-card border border-border-subtle rounded-lg overflow-hidden">
      {/* Branch header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-surface-overlay/30 transition-colors"
      >
        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: branch.color }}
        />

        {/* Branch name */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-[13px] font-mono font-semibold text-white truncate">
              {branch.name}
            </code>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${s.bg} ${s.text} ${s.border} border`}
            >
              {s.icon}
              {s.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {branch.commits.length} commits · {totalTime}m studied ·{" "}
            {totalImprovement >= 0 ? "+" : ""}
            {totalImprovement}% improvement
          </p>
        </div>

        {/* Ahead count */}
        {branch.aheadOfMain > 0 && (
          <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
            {branch.aheadOfMain} ahead
          </span>
        )}

        {/* Mastery */}
        {topicObj && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${topicObj.mastery}%`,
                  backgroundColor: branch.color,
                }}
              />
            </div>
            <span className="text-[11px] font-semibold text-white w-8 text-right">
              {topicObj.mastery}%
            </span>
          </div>
        )}

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border-subtle">
          {/* Commit list */}
          <div className="px-5 py-3 space-y-2">
            {branchCommits.map((commit) =>
              commit ? (
                <div
                  key={commit.id}
                  className="flex items-center gap-3 text-[12px] py-1.5"
                >
                  <code className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[10px]">
                    {commit.hash}
                  </code>
                  <span className="text-slate-300 flex-1 truncate">
                    {commit.message}
                  </span>
                  <span
                    className={`font-semibold ${
                      commit.scoreImprovement >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {commit.scoreImprovement >= 0 ? "+" : ""}
                    {commit.scoreImprovement}%
                  </span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {commit.timeSpentMinutes}m
                  </span>
                </div>
              ) : null,
            )}
          </div>

          {/* AI Merge Suggestion */}
          {branch.aiMergeSuggestion && (
            <div className="mx-5 mb-4 bg-accent/5 border border-accent/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-semibold text-accent">
                  AI Merge Analysis
                </span>
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                {branch.aiMergeSuggestion}
              </p>
              {branch.status === "active" && (
                <div className="mt-2 flex items-center gap-2">
                  {branch.mergeReady ? (
                    <button className="btn-primary text-[11px] py-1 px-3 flex items-center gap-1.5">
                      <GitMerge className="w-3 h-3" />
                      Merge to main
                    </button>
                  ) : (
                    <span className="text-[11px] text-gold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Not ready to merge — more study needed
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const BranchView: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>("b2");
  const [showMerged, setShowMerged] = useState(true);

  const activeBranches = branches.filter(
    (b) => b.status === "active" && b.id !== "b0",
  );
  const mergedBranches = branches.filter((b) => b.status === "merged");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" />
            Branches
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeBranches.length} active · {mergedBranches.length} merged ·
            Each topic is a separate learning branch
          </p>
        </div>
      </div>

      {/* Branch visualization */}
      <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Branch Graph</h2>
        <div className="relative">
          {/* Main branch line */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <div className="flex-1 h-0.5 bg-slate-600 relative">
              {/* Merge points */}
              {mergedBranches.map((b, i) => (
                <div
                  key={b.id}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${20 + i * 30}%` }}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-surface-card"
                    style={{ backgroundColor: b.color }}
                    title={`${b.displayName} merged`}
                  />
                </div>
              ))}
            </div>
            <code className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              main
            </code>
          </div>

          {/* Active branch lines */}
          {activeBranches.map((b, i) => (
            <div
              key={b.id}
              className="flex items-center gap-2 mb-2 pl-8"
              style={{ marginLeft: `${5 + i * 3}%` }}
            >
              <div className="w-0.5 h-4 bg-slate-700 -mb-2" />
              <div
                className="flex-1 h-0.5 relative"
                style={{ backgroundColor: `${b.color}60` }}
              >
                {/* Commits on branch */}
                {b.commits.map((_, ci) => (
                  <div
                    key={ci}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      left: `${15 + ci * 25}%`,
                      backgroundColor: b.color,
                    }}
                  />
                ))}
              </div>
              <code
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${b.color}15`,
                  color: b.color,
                }}
              >
                {b.name}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Active branches */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          Active Branches
        </h2>
        <div className="space-y-2">
          {activeBranches.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              expanded={expanded === b.id}
              onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
            />
          ))}
        </div>
      </div>

      {/* Merged branches */}
      <div>
        <button
          onClick={() => setShowMerged(!showMerged)}
          className="text-sm font-semibold text-white mb-3 flex items-center gap-2 hover:text-accent transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          Merged Branches ({mergedBranches.length})
          {showMerged ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
        {showMerged && (
          <div className="space-y-2">
            {mergedBranches.map((b) => (
              <BranchCard
                key={b.id}
                branch={b}
                expanded={expanded === b.id}
                onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
