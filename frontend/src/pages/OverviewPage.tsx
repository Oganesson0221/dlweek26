import React, { useState, useEffect } from "react";
import {
  Clock,
  BookOpen,
  Calendar,
  Target,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Timer,
  LayoutDashboard,
  Bell,
  X,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoursesBackend } from "@/hooks/useCoursesBackend";
import {
  getDaysUntil,
  formatDate,
  getCompletedTopicsCount,
} from "@/utils/helpers";

interface OverviewPageProps {
  onNavigate: (page: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [showDeadlinePopup, setShowDeadlinePopup] = useState(true);

  // Fetch courses from MongoDB backend
  const {
    courses,
    semesterInfo,
    loading,
    error,
  } = useCoursesBackend();

  // Calculate current date info
  const today = new Date(); // Use actual date
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const getWeekStartDate = (weekNum: number) => {
    const start = new Date(semesterInfo.startDate);
    start.setDate(start.getDate() + (weekNum - 1) * 7);
    return start;
  };

  const getWeekRange = (weekNum: number) => {
    const start = getWeekStartDate(weekNum);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

  const upcomingCheckpoints = courses
    .flatMap((c) =>
      c.checkpoints
        .filter((cp) => cp.status === "upcoming")
        .map((cp) => ({
          ...cp,
          courseName: c.name,
          courseCode: c.code,
          courseColor: c.color,
        })),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const criticalDeadline = upcomingCheckpoints[0];

  const weeklyRoadmap = Array.from({ length: 4 }, (_, i) => {
    const weekNum = semesterInfo.currentWeek + i;
    const { start, end } = getWeekRange(weekNum);
    const weekCheckpoints = courses.flatMap((c) =>
      c.checkpoints
        .filter((cp) => cp.weekNumber === weekNum)
        .map((cp) => {
          // Extract time if it exists in description or simulate based on course schedule
          const scheduleTime = c.schedule.split(" ").slice(1).join(" ");
          return {
            ...cp,
            courseCode: c.code,
            courseColor: c.color,
            time: scheduleTime || "TBD",
          };
        }),
    );
    return { weekNum, start, end, checkpoints: weekCheckpoints };
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-red-600">
          <AlertCircle className="w-8 h-8" />
          <p>Failed to load courses: {error}</p>
        </div>
      </div>
    );
  }

  // Show message if no courses  
  if (courses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col gap-6 mt-10">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            Welcome, <span className="text-indigo-600">Student.</span>
          </h1>
          <div className="bg-slate-100 rounded-[32px] p-8 text-center">
            <p className="text-slate-600">No courses found yet. Please add courses to get started.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 selection:bg-indigo-100 relative">
      {/* Deadline Popup - Fixed in top right */}
      <AnimatePresence>
        {showDeadlinePopup && criticalDeadline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="fixed top-24 right-8 z-50 w-80 bg-white/80 backdrop-blur-xl rounded-[32px] p-5 shadow-2xl shadow-indigo-100/50 border border-white flex flex-col gap-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <button
                onClick={() => setShowDeadlinePopup(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                Upcoming
              </p>
              <h3 className="text-slate-900 font-bold text-[15px] leading-tight">
                {criticalDeadline.name}
              </h3>
              <p className="text-slate-500 text-[12px] mt-1">
                for{" "}
                <span className="font-bold text-slate-700">
                  {criticalDeadline.courseName}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col">
                <span className="text-[18px] font-black text-slate-900 leading-none">
                  {getDaysUntil(criticalDeadline.date)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Days Left
                </span>
              </div>
              <button
                onClick={() => onNavigate("journey")}
                className="px-5 py-2.5 bg-slate-900 text-white text-[12px] font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-md active:scale-95"
              >
                View Map
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Row - Full Width */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
            Hello, <span className="text-indigo-600">Student.</span>
          </h1>
          <p className="mt-4 text-[15px] font-medium text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-300" />
            {dayName}, {dateStr}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                  alt="avatar"
                />
              </div>
            ))}
          </div>
          <div className="px-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              Current Focus
            </p>
            <p className="text-[13px] font-bold text-slate-700">
              3 Courses active
            </p>
          </div>
        </div>
      </div>

      {/* Semester Trajectory - Full Width Span */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
          <Timer className="w-48 h-48 text-slate-900" />
        </div>

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-[20px] font-black text-slate-900 tracking-tight flex items-center gap-3">
                Semester Trajectory
                <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full">
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Week {semesterInfo.currentWeek}
                  </span>
                </div>
              </h2>
              <p className="text-[13px] font-medium text-slate-400 mt-1">
                Your academic progress across the semester
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex flex-col items-end">
              <p className="text-[32px] font-black text-slate-900 leading-none">
                {Math.round(
                  (semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100,
                )}
                <span className="text-indigo-600">%</span>
              </p>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                Term Completed
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="relative h-5 bg-slate-50 rounded-full border border-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100}%`,
              }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-slate-900 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/20" />

              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                <div className="w-10 h-10 bg-white rounded-2xl shadow-xl border-[6px] border-slate-900 flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </div>
              </div>
            </motion.div>
          </div>

          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${semesterInfo.totalWeeks}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: semesterInfo.totalWeeks }, (_, i) => {
              const weekNum = i + 1;
              const weekStart = getWeekStartDate(weekNum);
              const isCurrent = weekNum === semesterInfo.currentWeek;
              const isPast = weekNum < semesterInfo.currentWeek;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-4 group/week relative"
                >
                  <div
                    className={`w-full h-2 rounded-full transition-all duration-700 ${
                      isPast
                        ? "bg-slate-200"
                        : isCurrent
                          ? "bg-slate-900 scale-y-125 shadow-lg shadow-slate-200"
                          : "bg-slate-50"
                    }`}
                  />

                  <div className="absolute -bottom-12 opacity-0 group-hover/week:opacity-100 transition-all pointer-events-none z-20 translate-y-2 group-hover/week:translate-y-0">
                    <div className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-2xl whitespace-nowrap shadow-2xl border border-white/10">
                      Starts{" "}
                      {weekStart.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-black tracking-tighter transition-colors ${isCurrent ? "text-slate-900 scale-110" : isPast ? "text-slate-400" : "text-slate-200"}`}
                  >
                    W{weekNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course Velocity - Expanded & Detailed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            Course Progress
          </h2>
          <button
            onClick={() => onNavigate("journey")}
            className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            Deep Dive Journey
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group cursor-pointer"
              onClick={() => onNavigate("journey")}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                    style={{
                      backgroundColor: c.color,
                      boxShadow: `0 8px 16px -4px ${c.color}40`,
                    }}
                  >
                    {c.code[0]}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                      {c.code}
                    </h3>
                    <p className="text-[12px] font-medium text-slate-400 truncate w-32">
                      {c.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[20px] font-black text-slate-900">
                    {c.progress}%
                  </span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Mastery
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 group-hover:bg-white group-hover:border-indigo-50 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                      Status
                    </p>
                    <p className="text-[12px] font-bold text-slate-700">
                      Ahead
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 group-hover:bg-white group-hover:border-indigo-50 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
                      Upcoming
                    </p>
                    <p className="text-[12px] font-bold text-slate-700 truncate">
                      Quiz 2
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Roadmap - Redesigned for clarity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              </div>
              Weekly Roadmap
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {weeklyRoadmap.map((week, idx) => (
              <div
                key={week.weekNum}
                className={`rounded-[36px] p-6 transition-all border ${
                  idx === 0
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-200 border-slate-800 scale-[1.05] z-10"
                    : "bg-white border-slate-200 shadow-sm hover:border-indigo-100"
                }`}
              >
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === 0 ? "text-white/40" : "text-slate-400"}`}
                    >
                      {week.start.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {idx === 0 && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-[22px] font-black tracking-tight leading-none">
                    Week {week.weekNum}
                  </h3>
                </div>

                <div className="space-y-4">
                  {week.checkpoints.length > 0 ? (
                    week.checkpoints.map((cp, cpIdx) => (
                      <div
                        key={`${cp.courseCode}-${cp.id}-${cpIdx}`}
                        className={`p-4 rounded-2xl border transition-all relative overflow-hidden group/item ${
                          idx === 0
                            ? "bg-white/10 border-white/10 hover:bg-white/15"
                            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-50"
                        }`}
                      >
                        {/* Subject Color Stripe */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
                          style={{ backgroundColor: cp.courseColor }}
                        />

                        <div className="flex items-center justify-between mb-3 pl-1">
                          <span
                            className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === 0 ? "text-white/40" : "text-slate-400"}`}
                          >
                            {cp.courseCode}
                          </span>
                          <div
                            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              cp.type === "midterm"
                                ? "bg-rose-500 text-white"
                                : "bg-amber-400 text-slate-900"
                            }`}
                          >
                            {cp.type}
                          </div>
                        </div>

                        <div className="pl-1">
                          <p
                            className={`text-[13px] font-bold leading-tight mb-2 ${idx === 0 ? "text-white" : "text-slate-800"}`}
                          >
                            {cp.name}
                          </p>

                          <div
                            className={`flex flex-col gap-1 ${idx === 0 ? "text-white/50" : "text-slate-400"}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">
                                {new Date(cp.date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">
                                {cp.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className={`py-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${idx === 0 ? "border-white/10 text-white/20" : "border-slate-100 text-slate-300"}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                        Rest Period
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Card - Outlook */}
        <div className="xl:col-span-4">
          <div className="sticky top-24">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200 group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <GraduationCap className="w-32 h-32 text-white" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-6 border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    System Health: Optimal
                  </span>
                </div>

                <h3 className="text-[24px] font-black tracking-tight mb-3">
                  Academic Outlook
                </h3>
                <p className="text-white/50 text-[14px] leading-relaxed mb-8">
                  You're currently maintaining a high engagement level across
                  all course modules. Keep it up!
                </p>

                <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">
                      Active Term Progress
                    </span>
                    <span className="text-[18px] font-black">
                      {semesterInfo.currentWeek} / {semesterInfo.totalWeeks}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(semesterInfo.currentWeek / semesterInfo.totalWeeks) * 100}%`,
                      }}
                      className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                      Total Topics
                    </p>
                    <p className="text-[20px] font-black">128</p>
                  </div>
                  <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <p className="text-[20px] font-black text-emerald-400">
                      On Track
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
