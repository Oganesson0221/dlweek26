import React from "react";
import {
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { courses, semesterInfo, performanceMetrics, studySessions } from "@/data/learnLensData";
import {
  getNextCheckpoint,
  getDaysUntil,
  formatDate,
  getEstimatedTimeRemaining,
  getCompletedTopicsCount,
} from "@/utils/helpers";

interface OverviewPageProps {
  onNavigate: (page: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-[11px] text-slate-400">Week {label}</p>
        <p className="text-sm font-bold text-[#0078d4]">
          GPA: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const totalStudyHours = studySessions.reduce((sum, s) => sum + s.hours, 0);
  const avgWeeklyHours =
    performanceMetrics.length > 0
      ? Math.round(
          performanceMetrics.reduce((sum, m) => sum + m.studyHours, 0) /
            performanceMetrics.length
        )
      : 0;

  const upcomingCheckpoints = courses
    .flatMap((c) =>
      c.checkpoints
        .filter((cp) => cp.status === "upcoming")
        .map((cp) => ({ ...cp, courseName: c.name, courseColor: c.color }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const metrics = [
    {
      title: "Current GPA",
      value: semesterInfo.gpa.toFixed(2),
      subtitle: `${semesterInfo.completedCredits} / ${semesterInfo.totalCredits} credits`,
      icon: Award,
      color: "#0078d4",
      bg: "bg-[#0078d4]/6",
    },
    {
      title: "Semester Progress",
      value: `Week ${semesterInfo.currentWeek}`,
      subtitle: `${semesterInfo.totalWeeks - semesterInfo.currentWeek} weeks remaining`,
      icon: Calendar,
      color: "#107c10",
      bg: "bg-[#107c10]/6",
    },
    {
      title: "Avg Study Hours",
      value: `${avgWeeklyHours}h`,
      subtitle: "Per week average",
      icon: Clock,
      color: "#8661c5",
      bg: "bg-[#8661c5]/6",
    },
    {
      title: "Active Courses",
      value: String(courses.length),
      subtitle: `${courses.reduce((s, c) => s + c.credits, 0)} total credits`,
      icon: BookOpen,
      color: "#ffb900",
      bg: "bg-[#ffb900]/6",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Welcome back, Student
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {semesterInfo.name} -- Week {semesterInfo.currentWeek} of{" "}
            {semesterInfo.totalWeeks}
          </p>
        </div>
        <button
          onClick={() => onNavigate("journey")}
          className="flex items-center gap-2 px-4 py-2 bg-[#0078d4] text-white text-[13px] font-medium rounded-xl hover:bg-[#0078d4]/90 transition-colors shadow-sm"
        >
          View Journey Map
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Semester Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-slate-700">
            Semester Timeline
          </h2>
          <span className="text-[12px] text-slate-400">
            {Math.round((semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100)}% complete
          </span>
        </div>
        <div className="relative">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0078d4] to-[#2899f5] rounded-full transition-all duration-700"
              style={{
                width: `${(semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100}%`,
              }}
            />
          </div>
          {/* Week markers */}
          <div className="flex justify-between mt-2 px-0.5">
            {Array.from({ length: semesterInfo.totalWeeks }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    i + 1 <= semesterInfo.currentWeek
                      ? "bg-[#0078d4]"
                      : i + 1 === semesterInfo.currentWeek + 1
                        ? "bg-[#ffb900]"
                        : "bg-slate-200"
                  }`}
                />
                {(i + 1) % 4 === 0 && (
                  <span className="text-[9px] text-slate-400 mt-1">W{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${m.bg}`}>
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{m.value}</p>
              <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                {m.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{m.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* GPA Chart + Course Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GPA Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-700">
                GPA Trend
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Weekly performance
              </p>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
              This semester
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceMetrics}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0078d4" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0078d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `W${v}`}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[3.0, 4.0]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  stroke="#0078d4"
                  strokeWidth={2.5}
                  fill="url(#gpaGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0078d4",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Checkpoints */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-[14px] font-semibold text-slate-700 mb-4">
            Upcoming Checkpoints
          </h2>
          <div className="space-y-3">
            {upcomingCheckpoints.map((cp) => {
              const daysLeft = getDaysUntil(cp.date);
              return (
                <div
                  key={cp.id}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: cp.courseColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-700 truncate">
                        {cp.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{cp.courseName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(cp.date)}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                            daysLeft <= 7
                              ? "bg-[#d83b01]/8 text-[#d83b01]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {daysLeft} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course Progress Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-slate-700">
            Course Progress
          </h2>
          <button
            onClick={() => onNavigate("journey")}
            className="text-[12px] text-[#0078d4] font-medium hover:underline flex items-center gap-1"
          >
            View journey map <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const nextCp = getNextCheckpoint(course);
            const estTime = getEstimatedTimeRemaining(course);
            const completedTopics = getCompletedTopicsCount(course);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => onNavigate("journey")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${course.color}10` }}
                    >
                      <span
                        className="text-[16px] font-bold"
                        style={{ color: course.color }}
                      >
                        {course.code.split(" ")[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-slate-700 group-hover:text-[#0078d4] transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{course.code}</p>
                    </div>
                  </div>
                  <span
                    className="text-[13px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: course.color,
                      backgroundColor: `${course.color}10`,
                    }}
                  >
                    {course.grade}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>
                      {completedTopics} / {course.topics.length} topics
                    </span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${course.progress}%`,
                        backgroundColor: course.color,
                      }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {estTime}h remaining
                  </span>
                  {nextCp && (
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Next: {nextCp.name.length > 15 ? nextCp.name.slice(0, 15) + "..." : nextCp.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
