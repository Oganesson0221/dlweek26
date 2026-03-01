import React from "react";
import {
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
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
import {
  courses,
  semesterInfo,
  performanceMetrics,
  studySessions,
} from "@/data/learnLensData";
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
      <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2 shadow-md">
        <p className="text-[11px] text-neutral-400">Week {label}</p>
        <p className="text-sm font-semibold text-neutral-800">
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
            performanceMetrics.length,
        )
      : 0;

  const upcomingCheckpoints = courses
    .flatMap((c) =>
      c.checkpoints
        .filter((cp) => cp.status === "upcoming")
        .map((cp) => ({ ...cp, courseName: c.name, courseCode: c.code })),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const metrics = [
    {
      title: "Current GPA",
      value: semesterInfo.gpa.toFixed(2),
      subtitle: `${semesterInfo.completedCredits} / ${semesterInfo.totalCredits} credits`,
      icon: Award,
    },
    {
      title: "Semester Progress",
      value: `Week ${semesterInfo.currentWeek}`,
      subtitle: `${semesterInfo.totalWeeks - semesterInfo.currentWeek} weeks remaining`,
      icon: Calendar,
    },
    {
      title: "Avg Study Hours",
      value: `${avgWeeklyHours}h`,
      subtitle: "Per week average",
      icon: Clock,
    },
    {
      title: "Active Courses",
      value: String(courses.length),
      subtitle: `${courses.reduce((s, c) => s + c.credits, 0)} total credits`,
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1080px] mx-auto">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Welcome back, Student
          </h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            {semesterInfo.name} · Week {semesterInfo.currentWeek} of{" "}
            {semesterInfo.totalWeeks}
          </p>
        </div>
        <button
          onClick={() => onNavigate("journey")}
          className="flex items-center gap-2 px-3.5 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          View Journey Map
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Semester Progress Bar */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-neutral-800">
            Semester Timeline
          </h2>
          <span className="text-[12px] text-neutral-400 tabular-nums">
            {Math.round(
              (semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100,
            )}
            % complete
          </span>
        </div>
        <div className="relative">
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{
                width: `${(semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 px-0.5">
            {Array.from({ length: semesterInfo.totalWeeks }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    i + 1 <= semesterInfo.currentWeek
                      ? "bg-accent"
                      : "bg-neutral-200"
                  }`}
                />
                {(i + 1) % 4 === 0 && (
                  <span className="text-[9px] text-neutral-400 mt-1">
                    W{i + 1}
                  </span>
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
              className="bg-white rounded-lg border border-neutral-200 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-neutral-400" />
                <span className="text-[12px] text-neutral-500">{m.title}</span>
              </div>
              <p className="text-xl font-semibold text-neutral-900">{m.value}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{m.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* GPA Chart + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* GPA Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[13px] font-semibold text-neutral-800">
                GPA Trend
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Weekly performance
              </p>
            </div>
            <span className="text-[11px] text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-md">
              This semester
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceMetrics}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0078d4" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#0078d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(163,163,163,0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#a3a3a3" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `W${v}`}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a3a3a3" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[3.0, 4.0]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="gpa"
                  stroke="#0078d4"
                  strokeWidth={2}
                  fill="url(#gpaGrad)"
                  dot={false}
                  activeDot={{
                    r: 3.5,
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
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <h2 className="text-[13px] font-semibold text-neutral-800 mb-4">
            Upcoming
          </h2>
          <div className="space-y-2.5">
            {upcomingCheckpoints.map((cp) => {
              const daysLeft = getDaysUntil(cp.date);
              return (
                <div
                  key={cp.id}
                  className="p-3 bg-neutral-50 rounded-lg border border-neutral-100"
                >
                  <p className="text-[12px] font-medium text-neutral-700 truncate">
                    {cp.name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {cp.courseName}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(cp.date)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        daysLeft <= 7 ? "text-red-600" : "text-neutral-500"
                      }`}
                    >
                      {daysLeft}d
                    </span>
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
          <h2 className="text-[13px] font-semibold text-neutral-800">
            Course Progress
          </h2>
          <button
            onClick={() => onNavigate("journey")}
            className="text-[12px] text-accent font-medium hover:underline flex items-center gap-1"
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
                className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 transition-colors cursor-pointer"
                onClick={() => onNavigate("journey")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-[13px] font-semibold text-neutral-800">
                      {course.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400">{course.code}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-600">
                    {course.grade}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>
                      {completedTopics} / {course.topics.length} topics
                    </span>
                    <span className="tabular-nums">{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {estTime}h remaining
                  </span>
                  {nextCp && (
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {nextCp.name.length > 15
                        ? nextCp.name.slice(0, 15) + "…"
                        : nextCp.name}
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
