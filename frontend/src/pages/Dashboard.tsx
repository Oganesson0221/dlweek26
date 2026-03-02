import React from "react";
import {
  TrendingUp,
  Flame,
  ArrowUpRight,
  GraduationCap,
  Sparkles,
  ChevronRight,
  GitCommitHorizontal,
  GitBranch,
  GitPullRequest,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  topics,
  commits,
  branches,
  pullRequests,
  contributions,
  streakInfo,
} from "@/data/mockData";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const progressionData = [
  { week: "W1", score: 42 },
  { week: "W2", score: 48 },
  { week: "W3", score: 51 },
  { week: "W4", score: 56 },
  { week: "W5", score: 61 },
  { week: "W6", score: 58 },
  { week: "W7", score: 67 },
  { week: "W8", score: 72 },
  { week: "W9", score: 74 },
  { week: "W10", score: 78 },
  { week: "W11", score: 82 },
  { week: "W12", score: 87 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 shadow-xl">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-sm font-bold text-accent">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

// Contribution heatmap component
function ContributionGraph() {
  // Group by weeks (7 days per column)
  const weeks: (typeof contributions)[number][][] = [];
  let currentWeek: (typeof contributions)[number][] = [];

  contributions.forEach((day, i) => {
    const dayOfWeek = new Date(day.date).getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const levelColors = [
    "bg-slate-800",
    "bg-emerald-900",
    "bg-emerald-700",
    "bg-emerald-500",
    "bg-emerald-400",
  ];

  const totalStudy = contributions.reduce((a, d) => a + d.count, 0);

  return (
    <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Study Activity</h2>
          <p className="text-[11px] text-slate-500">
            {totalStudy} study sessions in the last 16 weeks
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          Less
          {levelColors.map((c, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
          ))}
          More
        </div>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm ${levelColors[day.level]} transition-colors hover:ring-1 hover:ring-white/30`}
                title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const avgMastery = Math.round(
    topics.reduce((a, t) => a + t.mastery, 0) / topics.length,
  );
  const activeBranches = branches.filter(
    (b) => b.status === "active" && b.id !== "b0",
  ).length;
  const openPRs = pullRequests.filter(
    (p) => p.status === "open" || p.status === "changes_requested",
  ).length;

  const metrics = [
    {
      title: "Avg Mastery",
      value: `${avgMastery}%`,
      subtitle: `Across ${topics.length} topics`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent-subtle",
      borderColor: "border-accent/20",
    },
    {
      title: "Study Streak",
      value: `${streakInfo.current} days`,
      subtitle: `Record: ${streakInfo.longest} days`,
      icon: Flame,
      color: "text-gold",
      bgColor: "bg-gold-subtle",
      borderColor: "border-gold/20",
    },
    {
      title: "Total Commits",
      value: String(commits.length),
      subtitle: `${activeBranches} active branches`,
      icon: GitCommitHorizontal,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/8",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Open PRs",
      value: String(openPRs),
      subtitle: `${pullRequests.filter((p) => p.status === "merged").length} merged`,
      icon: GitPullRequest,
      color: "text-purple-400",
      bgColor: "bg-purple-500/8",
      borderColor: "border-purple-500/20",
    },
  ];

  const quickActions = [
    {
      title: "Commit History",
      desc: "View all study sessions",
      icon: GitCommitHorizontal,
      page: "commits",
    },
    {
      title: "Branches",
      desc: "Topic learning paths",
      icon: GitBranch,
      page: "branches",
    },
    {
      title: "Pull Requests",
      desc: "Milestone assessments",
      icon: GitPullRequest,
      page: "pullrequests",
    },
    {
      title: "Blame View",
      desc: "Track misconceptions",
      icon: Eye,
      page: "blame",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's your learning overview — {streakInfo.current} day streak 🔥
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-surface-raised border border-border-subtle rounded-md px-3 py-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Microsoft CoursePilot</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className={`bg-surface-card border ${m.borderColor} rounded-lg p-5 relative overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-md ${m.bgColor}`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white tracking-tight">
                {m.value}
              </p>
              <p className="text-[13px] font-medium text-slate-400 mt-0.5">
                {m.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{m.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Contribution Graph */}
      <ContributionGraph />

      {/* Chart + Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Learning Progression Chart */}
        <div className="lg:col-span-2 bg-surface-card border border-border-subtle rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Learning Progression
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mastery score over time
              </p>
            </div>
            <span className="text-[11px] text-slate-500 bg-surface-overlay px-2 py-1 rounded">
              Last 12 weeks
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progressionData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0078d4" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0078d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[30, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#0078d4"
                  strokeWidth={2}
                  fill="url(#blueGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0078d4",
                    stroke: "#0f172a",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Topic Mastery
          </h2>
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    <span className="text-[13px] text-slate-300">
                      {topic.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {topic.mastery}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${topic.mastery}%`,
                      backgroundColor: topic.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => onNavigate(action.page)}
              className="card-hover flex items-center gap-3 text-left group"
            >
              <div className="p-2.5 rounded-lg bg-accent-subtle border border-accent/10 shrink-0">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white group-hover:text-accent transition-colors">
                  {action.title}
                </p>
                <p className="text-[11px] text-slate-500">{action.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-accent transition-colors shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="bg-accent-subtle border border-accent/15 rounded-lg px-5 py-4 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-accent shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-accent">
            Microsoft CoursePilot — Powered by GPT-4o
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Your version-controlled learning platform. Track commits, branches,
            and merge knowledge with AI guidance.
          </p>
        </div>
      </div>
    </div>
  );
};
