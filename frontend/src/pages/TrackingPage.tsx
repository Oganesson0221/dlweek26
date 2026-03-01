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
    <div className="relative min-h-screen">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/tracking.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Microsoft-style gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0078d4]/10 via-white/90 to-[#00cc6a]/10" />
      
      {/* Content container */}
      <div className="relative z-10 space-y-5 max-w-[1080px] mx-auto py-8 px-4">
        <div className="flex items-start justify-between mb-2">
          <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 border border-white/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0078d4] to-[#00cc6a] flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0078d4] to-[#00cc6a] bg-clip-text text-transparent">
                  Performance Tracking
                </h1>
                <p className="text-sm text-neutral-600">
                  Monitor your progress across all courses
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 backdrop-blur-md bg-white/60 rounded-xl p-1.5 border border-white/50 shadow-lg">
            {(["overview", "courses"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedView(v)}
                className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                  selectedView === v
                    ? "bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white shadow-md"
                    : "text-neutral-600 hover:bg-[#0078d4]/10 hover:text-[#0078d4]"
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards with Microsoft Fluent Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Study Hours",
              value: `${totalStudyHours.toFixed(1)}h`,
              sub: "Last 2 weeks",
              icon: Clock,
              color: "from-[#0078d4] to-[#50e6ff]",
            },
            {
              title: "Avg Quiz Score",
              value: `${avgQuizScore}%`,
              sub: `${quizResults.length} quizzes taken`,
              icon: Target,
              color: "from-[#ff8c00] to-[#ffb900]",
            },
            {
              title: "Assignments",
              value: `${completedAssignments}/${totalAssignments}`,
              sub: "Completed",
              icon: Award,
              color: "from-[#5c2d91] to-[#b4a0ff]",
            },
            {
              title: "Overall Progress",
              value: `${Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)}%`,
              sub: "Across all courses",
              icon: TrendingUp,
              color: "from-[#107c10] to-[#00cc6a]",
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="group backdrop-blur-md bg-white/70 rounded-xl border border-white/50 p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-10 h-10 mb-3 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-neutral-800 tabular-nums">{m.value}</p>
                <p className="text-[12px] text-neutral-500 mt-1 font-medium">{m.title}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{m.sub}</p>
              </div>
            );
          })}
        </div>

      {selectedView === "overview" ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Weekly Study Hours */}
            <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg">
              <h2 className="text-[14px] font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-white" />
                </div>
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
            <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg">
              <h2 className="text-[14px] font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#b4a0ff] flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
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
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg">
            <h2 className="text-[14px] font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#107c10] to-[#00cc6a] flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-white" />
              </div>
              Study Hours by Course (Last 2 Weeks)
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {studyByCourseLast7.map((s, idx) => {
                const colors = [
                  "from-[#0078d4] to-[#50e6ff]",
                  "from-[#107c10] to-[#00cc6a]",
                  "from-[#ff8c00] to-[#ffb900]",
                  "from-[#5c2d91] to-[#b4a0ff]",
                  "from-[#d83b01] to-[#ff6f61]",
                ];
                return (
                  <div
                    key={s.course}
                    className="text-center p-4 rounded-xl backdrop-blur-sm bg-white/50 border border-white/50 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center`}>
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xl font-bold text-neutral-800 tabular-nums">
                      {s.hours}h
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                      {s.course}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {courses.map((course, idx) => {
            const avg = getCourseAverage(course);
            const colors = [
              "from-[#0078d4] to-[#50e6ff]",
              "from-[#107c10] to-[#00cc6a]",
              "from-[#ff8c00] to-[#ffb900]",
              "from-[#5c2d91] to-[#b4a0ff]",
              "from-[#d83b01] to-[#ff6f61]",
            ];
            return (
              <div
                key={course.id}
                className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center shadow-md`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-neutral-800">
                      {course.name}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      {course.code} · {course.instructor}
                    </p>
                  </div>
                  <span className={`text-[14px] font-bold ml-auto px-3 py-1 rounded-lg bg-gradient-to-r ${colors[idx % colors.length]} text-white shadow-md`}>
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
    </div>
  );
};
