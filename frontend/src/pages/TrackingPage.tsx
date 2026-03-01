import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  Award,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import { courses, performanceMetrics, studySessions, quizResults } from "@/data/learnLensData";
import { getCourseAverage, formatDate } from "@/utils/helpers";

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-[11px]">
        <p className="text-slate-400">Week {label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-medium" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const TrackingPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<"overview" | "courses">("overview");

  // Course performance radar
  const radarData = courses.map((c) => ({
    course: c.code,
    progress: c.progress,
    average: getCourseAverage(c),
    target: 80,
  }));

  // Study hours by course
  const studyByCourseLast7 = courses.map((c) => ({
    course: c.code,
    hours: Math.round(
      studySessions
        .filter((s) => s.course === c.id)
        .reduce((sum, s) => sum + s.hours, 0) * 10
    ) / 10,
    color: c.color,
  }));

  // Weekly study hours
  const weeklyHours = performanceMetrics.map((m) => ({
    week: m.week,
    hours: m.studyHours,
    quizAvg: m.quizAverage,
  }));

  // Summary stats
  const totalStudyHours = studySessions.reduce((sum, s) => sum + s.hours, 0);
  const avgQuizScore =
    quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length)
      : 0;
  const totalAssignments = courses.reduce((sum, c) => sum + c.assignments.length, 0);
  const completedAssignments = courses.reduce(
    (sum, c) => sum + c.assignments.filter((a) => a.status === "submitted").length,
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Performance Tracking
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Monitor your progress across all courses
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(["overview", "courses"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedView(v)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                selectedView === v
                  ? "bg-white text-[#0078d4] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Study Hours",
            value: `${totalStudyHours.toFixed(1)}h`,
            sub: "Last 2 weeks",
            icon: Clock,
            color: "#0078d4",
          },
          {
            title: "Avg Quiz Score",
            value: `${avgQuizScore}%`,
            sub: `${quizResults.length} quizzes taken`,
            icon: Target,
            color: "#107c10",
          },
          {
            title: "Assignments",
            value: `${completedAssignments}/${totalAssignments}`,
            sub: "Completed",
            icon: Award,
            color: "#8661c5",
          },
          {
            title: "Overall Progress",
            value: `${Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)}%`,
            sub: "Across all courses",
            icon: TrendingUp,
            color: "#ffb900",
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${m.color}10` }}
                >
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <span className="text-[12px] text-slate-500">{m.title}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{m.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {selectedView === "overview" ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Weekly Study Hours */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-[14px] font-semibold text-slate-700 mb-4">
                Weekly Study Hours
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHours}>
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
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="hours"
                      name="Study Hours"
                      fill="#0078d4"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course Performance Radar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-[14px] font-semibold text-slate-700 mb-4">
                Course Performance
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.2)" />
                    <PolarAngleAxis
                      dataKey="course"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Radar
                      name="Progress"
                      dataKey="progress"
                      stroke="#0078d4"
                      fill="#0078d4"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Quiz Avg"
                      dataKey="average"
                      stroke="#107c10"
                      fill="#107c10"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Study Hours by Course */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-[14px] font-semibold text-slate-700 mb-4">
              Study Hours by Course (Last 2 Weeks)
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {studyByCourseLast7.map((s) => (
                <div
                  key={s.course}
                  className="text-center p-4 rounded-xl border border-slate-100"
                >
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center relative"
                    style={{ backgroundColor: `${s.color}10` }}
                  >
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: s.color }}
                    >
                      {s.hours}h
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-slate-600">
                    {s.course}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Course-by-course view */
        <div className="space-y-4">
          {courses.map((course) => {
            const avg = getCourseAverage(course);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${course.color}10` }}
                  >
                    <BarChart3
                      className="w-5 h-5"
                      style={{ color: course.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-slate-700">
                      {course.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {course.code} -- {course.instructor}
                    </p>
                  </div>
                  <span
                    className="text-[15px] font-bold px-3 py-1 rounded-lg"
                    style={{
                      color: course.color,
                      backgroundColor: `${course.color}10`,
                    }}
                  >
                    {course.grade}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${course.progress}%`,
                        backgroundColor: course.color,
                      }}
                    />
                  </div>
                </div>

                {/* Checkpoints timeline */}
                <div className="flex items-center gap-2">
                  {course.checkpoints.map((cp) => (
                    <div
                      key={cp.id}
                      className={`flex-1 p-2 rounded-lg border text-center ${
                        cp.status === "completed"
                          ? "bg-[#107c10]/5 border-[#107c10]/20"
                          : cp.status === "upcoming"
                            ? "bg-[#ffb900]/5 border-[#ffb900]/20"
                            : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <p className="text-[10px] font-medium text-slate-600 truncate">
                        {cp.name.length > 20 ? cp.name.slice(0, 20) + "..." : cp.name}
                      </p>
                      {cp.score !== undefined ? (
                        <p
                          className="text-[12px] font-bold mt-0.5"
                          style={{
                            color:
                              cp.score >= 80
                                ? "#107c10"
                                : cp.score >= 60
                                  ? "#ffb900"
                                  : "#d83b01",
                          }}
                        >
                          {cp.score}%
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          W{cp.weekNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
