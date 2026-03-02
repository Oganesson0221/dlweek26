import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Award,
  Target,
  BarChart3,
  Loader2,
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
  getProgressOverview,
  getCourseProgress,
  getProgressTimeline,
  type CourseProgress,
  type TimelineWeek,
} from "@/api/academicApi";
import type { ProgressOverview, DbCourse } from "@/types/backendAcademic";

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

  // Backend data state
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [courseProgress, setCourseProgress] = useState<
    Map<string, CourseProgress>
  >(new Map());
  const [timeline, setTimeline] = useState<TimelineWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewData, timelineData] = await Promise.all([
          getProgressOverview(),
          getProgressTimeline(),
        ]);

        setOverview(overviewData);
        setTimeline(timelineData.timeline);

        // Fetch individual course progress
        if (overviewData.courses && overviewData.courses.length > 0) {
          const progressMap = new Map<string, CourseProgress>();
          await Promise.all(
            overviewData.courses.map(async (course) => {
              try {
                const progress = await getCourseProgress(course.code);
                progressMap.set(course.code, progress);
              } catch (e) {
                console.warn(`Failed to fetch progress for ${course.code}:`, e);
              }
            }),
          );
          setCourseProgress(progressMap);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load progress data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute derived data from backend
  const courses = overview?.courses ?? [];
  const totalAssignments = overview?.total_assignments ?? 0;
  const completedAssignments = overview?.completed_assignments ?? 0;
  const inProgressAssignments = overview?.in_progress_assignments ?? 0;
  const completionPercentage = overview?.completion_percentage ?? 0;

  // Radar chart data from courses
  const radarData = courses.map((c) => ({
    course: c.code,
    progress: c.progress ?? 0,
    average: c.progress ?? 0, // Use progress as approximation
    target: 80,
  }));

  // Weekly hours from timeline
  const weeklyHours = timeline.map((week, idx) => ({
    week: idx + 1,
    hours: week.items.length * 2, // Estimate 2 hours per item
    quizAvg:
      week.items.length > 0
        ? Math.round(
            (week.items.filter((i) => i.status === "submitted").length /
              week.items.length) *
              100,
          )
        : 0,
  }));

  // Study hours by course (computed from assignments)
  const studyByCourseLast7 = courses.map((c) => ({
    course: c.code,
    hours: (c.total_assignments ?? 0) * 1.5, // Estimate hours
  }));

  // Compute total study hours estimate
  const totalStudyHours = studyByCourseLast7.reduce(
    (sum, s) => sum + s.hours,
    0,
  );

  // Use assignment-based quiz average estimate
  const avgQuizScore = Math.round(completionPercentage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0078d4]/10 via-white/90 to-[#00cc6a]/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#0078d4]" />
          <p className="text-neutral-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0078d4]/10 via-white/90 to-[#00cc6a]/10">
        <div className="backdrop-blur-md bg-white/80 rounded-xl border border-red-200 p-6 shadow-lg max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Error Loading Data
          </h2>
          <p className="text-neutral-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#0078d4] text-white rounded-lg text-sm font-medium hover:bg-[#106ebe] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
              sub: "Estimated",
              icon: Clock,
              color: "from-[#0078d4] to-[#50e6ff]",
            },
            {
              title: "Completion Rate",
              value: `${Math.round(completionPercentage)}%`,
              sub: `${completedAssignments} of ${totalAssignments} done`,
              icon: Target,
              color: "from-[#ff8c00] to-[#ffb900]",
            },
            {
              title: "Assignments",
              value: `${completedAssignments}/${totalAssignments}`,
              sub: `${inProgressAssignments} in progress`,
              icon: Award,
              color: "from-[#5c2d91] to-[#b4a0ff]",
            },
            {
              title: "Overall Progress",
              value: `${courses.length > 0 ? Math.round(courses.reduce((s, c) => s + (c.progress ?? 0), 0) / courses.length) : 0}%`,
              sub: `${courses.length} courses`,
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
                <div
                  className={`w-10 h-10 mb-3 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-neutral-800 tabular-nums">
                  {m.value}
                </p>
                <p className="text-[12px] text-neutral-500 mt-1 font-medium">
                  {m.title}
                </p>
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
                      <div
                        className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center`}
                      >
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
              const progress = courseProgress.get(course.code);
              const courseCompletionPct =
                progress?.completion_percentage ?? course.progress ?? 0;
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
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center shadow-md`}
                    >
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-neutral-800">
                        {course.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        {course.code} · {course.term}
                      </p>
                    </div>
                    <span
                      className={`text-[14px] font-bold ml-auto px-3 py-1 rounded-lg bg-gradient-to-r ${colors[idx % colors.length]} text-white shadow-md`}
                    >
                      {Math.round(courseCompletionPct)}%
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Progress</span>
                      <span className="tabular-nums">
                        {Math.round(courseCompletionPct)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${courseCompletionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Assignment breakdown */}
                  {progress && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 rounded-md border text-center bg-green-50 border-green-100">
                        <p className="text-[10px] font-medium text-neutral-600">
                          Completed
                        </p>
                        <p className="text-[12px] font-semibold mt-0.5 tabular-nums text-green-700">
                          {progress.completed}
                        </p>
                      </div>
                      <div className="flex-1 p-2 rounded-md border text-center bg-amber-50 border-amber-100">
                        <p className="text-[10px] font-medium text-neutral-600">
                          In Progress
                        </p>
                        <p className="text-[12px] font-semibold mt-0.5 tabular-nums text-amber-600">
                          {progress.in_progress}
                        </p>
                      </div>
                      <div className="flex-1 p-2 rounded-md border text-center bg-neutral-50 border-neutral-200">
                        <p className="text-[10px] font-medium text-neutral-600">
                          Not Started
                        </p>
                        <p className="text-[12px] font-semibold mt-0.5 tabular-nums text-neutral-600">
                          {progress.total_assignments -
                            progress.completed -
                            progress.in_progress}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
