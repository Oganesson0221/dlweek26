import React, { useState } from "react";
import {
  TrendingUp,
  Clock,
  Award,
  Target,
  BarChart3,
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
import {
  courses,
  performanceMetrics,
  studySessions,
  quizResults,
} from "@/data/learnLensData";
import { getCourseAverage, formatDate } from "@/utils/helpers";

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2 shadow-md text-[11px]">
        <p className="text-neutral-400">Week {label}</p>
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
  const [selectedView, setSelectedView] = useState<"overview" | "courses">(
    "overview",
  );

  const radarData = courses.map((c) => ({
    course: c.code,
    progress: c.progress,
    average: getCourseAverage(c),
    target: 80,
  }));

  const studyByCourseLast7 = courses.map((c) => ({
    course: c.code,
    hours:
      Math.round(
        studySessions
          .filter((s) => s.course === c.id)
          .reduce((sum, s) => sum + s.hours, 0) * 10,
      ) / 10,
  }));

  const weeklyHours = performanceMetrics.map((m) => ({
    week: m.week,
    hours: m.studyHours,
    quizAvg: m.quizAverage,
  }));

  const totalStudyHours = studySessions.reduce((sum, s) => sum + s.hours, 0);
  const avgQuizScore =
    quizResults.length > 0
      ? Math.round(
          quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length,
        )
      : 0;
  const totalAssignments = courses.reduce(
    (sum, c) => sum + c.assignments.length,
    0,
  );
  const completedAssignments = courses.reduce(
    (sum, c) =>
      sum + c.assignments.filter((a) => a.status === "submitted").length,
    0,
  );

  return (
    <div className="space-y-5 max-w-[1080px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Performance Tracking
          </h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Monitor your progress across all courses
          </p>
        </div>
        <div className="flex items-center gap-1 border border-neutral-200 rounded-lg p-0.5">
          {(["overview", "courses"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedView(v)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                selectedView === v
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:text-neutral-700"
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
          },
          {
            title: "Avg Quiz Score",
            value: `${avgQuizScore}%`,
            sub: `${quizResults.length} quizzes taken`,
            icon: Target,
          },
          {
            title: "Assignments",
            value: `${completedAssignments}/${totalAssignments}`,
            sub: "Completed",
            icon: Award,
          },
          {
            title: "Overall Progress",
            value: `${Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)}%`,
            sub: "Across all courses",
            icon: TrendingUp,
          },
        ].map((m) => {
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
              <p className="text-xl font-semibold text-neutral-900 tabular-nums">{m.value}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {selectedView === "overview" ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Weekly Study Hours */}
            <div className="bg-white rounded-lg border border-neutral-200 p-5">
              <h2 className="text-[13px] font-semibold text-neutral-800 mb-4">
                Weekly Study Hours
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHours}>
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
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="hours"
                      name="Study Hours"
                      fill="#525252"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course Performance Radar */}
            <div className="bg-white rounded-lg border border-neutral-200 p-5">
              <h2 className="text-[13px] font-semibold text-neutral-800 mb-4">
                Course Performance
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(163,163,163,0.2)" />
                    <PolarAngleAxis
                      dataKey="course"
                      tick={{ fontSize: 11, fill: "#525252" }}
                    />
                    <Radar
                      name="Progress"
                      dataKey="progress"
                      stroke="#0078d4"
                      fill="#0078d4"
                      fillOpacity={0.1}
                      strokeWidth={1.5}
                    />
                    <Radar
                      name="Quiz Avg"
                      dataKey="average"
                      stroke="#525252"
                      fill="#525252"
                      fillOpacity={0.05}
                      strokeWidth={1.5}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Study Hours by Course */}
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h2 className="text-[13px] font-semibold text-neutral-800 mb-4">
              Study Hours by Course (Last 2 Weeks)
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {studyByCourseLast7.map((s) => (
                <div
                  key={s.course}
                  className="text-center p-3 rounded-lg border border-neutral-100"
                >
                  <p className="text-lg font-semibold text-neutral-800 tabular-nums">
                    {s.hours}h
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {s.course}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const avg = getCourseAverage(course);
            return (
              <div
                key={course.id}
                className="bg-white rounded-lg border border-neutral-200 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-[13px] font-semibold text-neutral-800">
                      {course.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      {course.code} · {course.instructor}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-neutral-600 ml-auto">
                    {course.grade}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Progress</span>
                    <span className="tabular-nums">{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {course.checkpoints.map((cp) => (
                    <div
                      key={cp.id}
                      className={`flex-1 p-2 rounded-md border text-center ${
                        cp.status === "completed"
                          ? "bg-green-50 border-green-100"
                          : cp.status === "upcoming"
                            ? "bg-neutral-50 border-neutral-200"
                            : "bg-neutral-50 border-neutral-100"
                      }`}
                    >
                      <p className="text-[10px] font-medium text-neutral-600 truncate">
                        {cp.name.length > 20
                          ? cp.name.slice(0, 20) + "…"
                          : cp.name}
                      </p>
                      {cp.score !== undefined ? (
                        <p
                          className={`text-[12px] font-semibold mt-0.5 tabular-nums ${
                            cp.score >= 80
                              ? "text-green-700"
                              : cp.score >= 60
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {cp.score}%
                        </p>
                      ) : (
                        <p className="text-[10px] text-neutral-400 mt-0.5">
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
