import React, { useState } from "react";
import {
  MapPin,
  Flag,
  Clock,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  AlertCircle,
  Zap,
  Target,
  BookOpen,
} from "lucide-react";
import { courses, semesterInfo } from "@/data/learnLensData";
import type { Course, Checkpoint } from "@/types";
import {
  formatDate,
  getDaysUntil,
  getEstimatedTimeRemaining,
  getCompletedTopicsCount,
} from "@/utils/helpers";

interface JourneyMapPageProps {
  onNavigate: (page: string) => void;
}

const checkpointIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-5 h-5" />,
  "in-progress": <AlertCircle className="w-5 h-5" />,
  upcoming: <Circle className="w-5 h-5" />,
  locked: <Lock className="w-5 h-5" />,
};

function RouteVisualization({
  course,
  isExpanded,
  onToggle,
}: {
  course: Course;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const completedTopics = getCompletedTopicsCount(course);
  const totalTopics = course.topics.length;
  const estTimeRemaining = getEstimatedTimeRemaining(course);
  const nextCheckpoint = course.checkpoints.find(
    (cp) => cp.status === "upcoming" || cp.status === "in-progress"
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Course Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
      >
        {/* Course icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: course.color }}
        >
          <Flag className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-slate-800">
              {course.name}
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              {course.code}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-slate-500">
              {course.progress}% complete
            </span>
            <span className="text-[11px] text-slate-400">|</span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {estTimeRemaining}h remaining
            </span>
            {nextCheckpoint && (
              <>
                <span className="text-[11px] text-slate-400">|</span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Next: {nextCheckpoint.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Grade */}
        <span
          className="text-[15px] font-bold px-3 py-1 rounded-lg"
          style={{
            color: course.color,
            backgroundColor: `${course.color}10`,
          }}
        >
          {course.grade}
        </span>

        {/* Progress ring */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={course.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(course.progress / 100) * 125.6} 125.6`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-700">
            {course.progress}%
          </span>
        </div>

        <ChevronRight
          className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>

      {/* Expanded route */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {/* Route progress bar */}
          <div className="mt-4 mb-6 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500">
                Start
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Course Complete
              </span>
            </div>
            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 relative"
                style={{
                  width: `${course.progress}%`,
                  background: `linear-gradient(90deg, ${course.color}, ${course.color}cc)`,
                }}
              >
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-[3px] shadow-sm"
                  style={{ borderColor: course.color }}
                />
              </div>
            </div>
            {/* Checkpoint markers on the bar */}
            {course.checkpoints.map((cp) => {
              const position = (cp.weekNumber / course.totalWeeks) * 100;
              return (
                <div
                  key={cp.id}
                  className="absolute top-[26px]"
                  style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                      cp.status === "completed"
                        ? "bg-[#107c10]"
                        : cp.status === "upcoming"
                          ? "bg-[#ffb900]"
                          : "bg-slate-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Route / checkpoints */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

            {/* Start node */}
            <div className="relative flex items-center gap-4 mb-4">
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#107c10] flex items-center justify-center shadow-md">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-700">
                  Semester Start
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(semesterInfo.startDate)} -- Week 1
                </p>
              </div>
            </div>

            {/* Topics & Checkpoints interleaved by week */}
            {(() => {
              const items: Array<
                | { type: "topic"; data: (typeof course.topics)[0] }
                | { type: "checkpoint"; data: Checkpoint }
              > = [];

              course.topics.forEach((t) =>
                items.push({ type: "topic", data: t })
              );
              course.checkpoints.forEach((cp) =>
                items.push({ type: "checkpoint", data: cp as any })
              );
              items.sort((a, b) => {
                const weekA =
                  a.type === "topic" ? a.data.weekNumber : (a.data as any).weekNumber;
                const weekB =
                  b.type === "topic" ? b.data.weekNumber : (b.data as any).weekNumber;
                if (weekA !== weekB) return weekA - weekB;
                return a.type === "checkpoint" ? 1 : -1;
              });

              return items.map((item) => {
                if (item.type === "topic") {
                  const topic = item.data;
                  return (
                    <div key={topic.id} className="relative flex items-start gap-4 mb-2">
                      {/* Node */}
                      <div
                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 ${
                          topic.completed
                            ? "bg-[#107c10]/10 border-[#107c10]"
                            : topic.mastery > 0
                              ? "bg-[#ffb900]/10 border-[#ffb900]"
                              : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {topic.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[#107c10]" />
                        ) : topic.mastery > 0 ? (
                          <Zap className="w-5 h-5 text-[#ffb900]" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 py-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-[12px] font-medium ${
                              topic.completed ? "text-slate-600" : topic.mastery > 0 ? "text-slate-700" : "text-slate-400"
                            }`}
                          >
                            {topic.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            W{topic.weekNumber}
                          </span>
                        </div>
                        {topic.mastery > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${topic.mastery}%`,
                                  backgroundColor:
                                    topic.mastery >= 80
                                      ? "#107c10"
                                      : topic.mastery >= 50
                                        ? "#ffb900"
                                        : "#d83b01",
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {topic.mastery}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Checkpoint
                const cp = item.data as Checkpoint;
                const daysLeft = getDaysUntil(cp.date);
                return (
                  <div
                    key={cp.id}
                    className="relative flex items-start gap-4 my-3"
                  >
                    <div
                      className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        cp.status === "completed"
                          ? "bg-[#107c10]"
                          : cp.status === "upcoming"
                            ? "bg-[#ffb900]"
                            : "bg-slate-200"
                      }`}
                    >
                      <span className="text-white">
                        {checkpointIcons[cp.status]}
                      </span>
                    </div>
                    <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-semibold text-slate-700">
                              {cp.name}
                            </p>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                cp.type === "final"
                                  ? "bg-[#d83b01]/8 text-[#d83b01]"
                                  : cp.type === "midterm"
                                    ? "bg-[#ffb900]/8 text-[#ffb900]"
                                    : "bg-[#0078d4]/8 text-[#0078d4]"
                              }`}
                            >
                              {cp.type.charAt(0).toUpperCase() + cp.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {cp.description}
                          </p>
                        </div>
                        {cp.score !== undefined && (
                          <span className="text-[14px] font-bold text-[#107c10]">
                            {cp.score}/{cp.maxScore}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>{formatDate(cp.date)} (W{cp.weekNumber})</span>
                        <span>Weight: {cp.weight}%</span>
                        {cp.status === "upcoming" && (
                          <span className="font-medium text-[#ffb900]">
                            {daysLeft} days away -- {cp.estimatedPrepTime}h prep
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Destination */}
            <div className="relative flex items-center gap-4 mt-4">
              <div
                className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: course.color }}
              >
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-700">
                  Course Complete
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatDate(semesterInfo.endDate)} -- Final destination
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const JourneyMapPage: React.FC<JourneyMapPageProps> = ({ onNavigate }) => {
  const [expandedCourse, setExpandedCourse] = useState<string>(courses[0]?.id ?? "");

  const totalUpcoming = courses.reduce(
    (sum, c) => sum + c.checkpoints.filter((cp) => cp.status === "upcoming").length,
    0
  );

  const totalEstTime = courses.reduce(
    (sum, c) => sum + getEstimatedTimeRemaining(c),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Journey Map</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Your learning routes -- {courses.length} courses, {totalUpcoming}{" "}
            upcoming checkpoints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {totalEstTime}h total remaining
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[11px] text-slate-500 bg-white rounded-xl border border-slate-200 px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 bg-gradient-to-r from-[#107c10] to-[#107c10] rounded-full" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 bg-[#ffb900] rounded-full" style={{ backgroundImage: "repeating-linear-gradient(90deg, #ffb900 0, #ffb900 4px, transparent 4px, transparent 8px)" }} />
          In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-8 h-1.5 bg-slate-200 rounded-full" />
          Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#107c10]" />
          Passed
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ffb900]" />
          Next
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-400" />
          Locked
        </span>
      </div>

      {/* Course Routes */}
      <div className="space-y-4">
        {courses.map((course) => (
          <RouteVisualization
            key={course.id}
            course={course}
            isExpanded={expandedCourse === course.id}
            onToggle={() =>
              setExpandedCourse(expandedCourse === course.id ? "" : course.id)
            }
          />
        ))}
      </div>
    </div>
  );
};
