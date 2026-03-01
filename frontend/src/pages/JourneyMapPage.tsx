import React, { useState, useMemo } from "react";
import {
  Check,
  Lock,
  Circle,
  Clock,
  Calendar,
} from "lucide-react";
import { courses } from "@/data/learnLensData";
import type { Course, CourseTopic, Checkpoint } from "@/types";
import {
  formatDate,
  getDaysUntil,
  getEstimatedTimeRemaining,
  getCompletedTopicsCount,
} from "@/utils/helpers";

type RouteNode =
  | { kind: "topic"; data: CourseTopic; index: number }
  | { kind: "checkpoint"; data: Checkpoint; index: number };

function buildRoute(course: Course): RouteNode[] {
  const nodes: RouteNode[] = [];
  let idx = 0;
  course.topics.forEach((t) =>
    nodes.push({ kind: "topic", data: t, index: idx++ }),
  );
  course.checkpoints.forEach((cp) =>
    nodes.push({ kind: "checkpoint", data: cp, index: idx++ }),
  );
  nodes.sort((a, b) => {
    const wA = a.data.weekNumber;
    const wB = b.data.weekNumber;
    if (wA !== wB) return wA - wB;
    return a.kind === "checkpoint" ? 1 : -1;
  });
  nodes.forEach((n, i) => (n.index = i));
  return nodes;
}

function getNodeState(
  node: RouteNode,
  i: number,
  route: RouteNode[],
): "completed" | "current" | "upcoming" | "locked" {
  if (node.kind === "topic") {
    const t = node.data;
    if (t.completed) return "completed";
    if (t.mastery > 0) return "current";
    if (
      i === 0 ||
      (route[i - 1].kind === "topic" &&
        (route[i - 1].data as CourseTopic).completed) ||
      (route[i - 1].kind === "checkpoint" &&
        (route[i - 1].data as Checkpoint).status === "completed")
    )
      return "upcoming";
    return "locked";
  }
  const cp = node.data;
  if (cp.status === "completed") return "completed";
  if (cp.status === "upcoming" || cp.status === "in-progress") return "current";
  return "locked";
}

function getNodePositions(count: number) {
  const positions: { x: number; y: number }[] = [];
  const xPattern = [25, 50, 75, 50];
  const startY = 48;
  const gap = 88;
  for (let i = 0; i < count; i++) {
    positions.push({
      x: xPattern[i % xPattern.length],
      y: startY + i * gap,
    });
  }
  return positions;
}

export const JourneyMapPage: React.FC = () => {
  const [selectedCourseId, setSelectedCourseId] = useState(
    courses[0]?.id ?? "",
  );
  const [expandedNode, setExpandedNode] = useState<number | null>(null);

  const course = courses.find((c) => c.id === selectedCourseId)!;
  const route = useMemo(() => buildRoute(course), [course]);
  const positions = useMemo(
    () => getNodePositions(route.length),
    [route.length],
  );
  const completedTopics = getCompletedTopicsCount(course);
  const totalTopics = course.topics.length;
  const estRemaining = getEstimatedTimeRemaining(course);
  const svgH =
    positions.length > 0 ? positions[positions.length - 1].y + 60 : 300;

  return (
    <div className="max-w-[1080px] mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">
          Learning Path
        </h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          {completedTopics} of {totalTopics} topics completed &middot;{" "}
          {estRemaining}h remaining
        </p>
      </div>

      {/* Course tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {courses.map((c) => {
          const active = selectedCourseId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCourseId(c.id);
                setExpandedNode(null);
              }}
              className={`px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                active
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {c.code}
              <span className="ml-1.5 text-[11px] text-neutral-400">
                {c.progress}%
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: The Path */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-800">
                {course.name}
              </h2>
              <p className="text-xs text-neutral-400">
                {course.instructor} · {course.schedule}
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-700">
              {course.grade}
            </span>
          </div>

          <div className="mb-5">
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          <div
            className="relative bg-white border border-neutral-200 rounded-lg p-4"
            style={{ minHeight: svgH + 20 }}
          >
            {/* SVG connector lines */}
            <svg
              className="absolute inset-0 w-full pointer-events-none"
              style={{ height: svgH + 20 }}
              viewBox={`0 0 100 ${svgH + 20}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {positions.map((pos, i) => {
                if (i === 0) return null;
                const prev = positions[i - 1];
                const prevState = getNodeState(route[i - 1], i - 1, route);
                const done = prevState === "completed";
                const midY = (prev.y + pos.y) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${prev.x} ${prev.y} C ${prev.x} ${midY}, ${pos.x} ${midY}, ${pos.x} ${pos.y}`}
                    fill="none"
                    stroke={done ? "#0078d4" : "#e5e5e5"}
                    strokeWidth={done ? "1.2" : "0.8"}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {route.map((node, i) => {
              const pos = positions[i];
              const state = getNodeState(node, i, route);
              const isCheckpoint = node.kind === "checkpoint";
              const isExpanded = expandedNode === i;
              const label =
                node.kind === "topic" ? node.data.name : node.data.name;
              const size = isCheckpoint ? 36 : 28;
              const bg =
                state === "completed"
                  ? "#0078d4"
                  : state === "current"
                    ? "#ffffff"
                    : state === "upcoming"
                      ? "#ffffff"
                      : "#f5f5f5";
              const border =
                state === "completed"
                  ? "#0078d4"
                  : state === "current"
                    ? "#0078d4"
                    : state === "upcoming"
                      ? "#d4d4d4"
                      : "#e5e5e5";
              const iconColor =
                state === "completed"
                  ? "#fff"
                  : state === "current"
                    ? "#0078d4"
                    : "#a3a3a3";

              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${pos.x}%`,
                    top: pos.y,
                    transform: "translate(-50%, -50%)",
                    zIndex: isExpanded ? 20 : 10,
                  }}
                >
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() =>
                        setExpandedNode(isExpanded ? null : i)
                      }
                      disabled={state === "locked"}
                      className={`relative flex items-center justify-center rounded-full border-2 ${
                        state === "locked"
                          ? "cursor-default"
                          : "cursor-pointer hover:shadow-md"
                      } ${isExpanded ? "ring-2 ring-accent/20 ring-offset-1" : ""}`}
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: bg,
                        borderColor: border,
                      }}
                    >
                      {state === "completed" && (
                        <Check
                          className="w-3.5 h-3.5"
                          style={{ color: iconColor }}
                          strokeWidth={3}
                        />
                      )}
                      {state === "current" && (
                        <Circle
                          className="w-3 h-3"
                          style={{ color: iconColor, fill: iconColor }}
                        />
                      )}
                      {state === "upcoming" && (
                        <Circle
                          className="w-2.5 h-2.5"
                          style={{ color: "#d4d4d4" }}
                        />
                      )}
                      {state === "locked" && (
                        <Lock
                          className="w-3 h-3"
                          style={{ color: iconColor }}
                        />
                      )}
                      {isCheckpoint && (
                        <span className="absolute -top-1 -right-2 text-[8px] font-semibold bg-neutral-800 text-white px-1 py-0 rounded">
                          {node.data.weight}%
                        </span>
                      )}
                    </button>

                    <span
                      className={`mt-1.5 text-[10px] text-center max-w-[90px] leading-tight ${
                        state === "completed" || state === "current"
                          ? "text-neutral-600 font-medium"
                          : "text-neutral-400"
                      }`}
                    >
                      {label.length > 22 ? label.slice(0, 20) + "\u2026" : label}
                    </span>
                    {node.kind === "topic" && (
                      <span className="text-[9px] text-neutral-400">
                        W{node.data.weekNumber}
                      </span>
                    )}
                    {node.kind === "checkpoint" && (
                      <span className="text-[9px] text-neutral-400">
                        {node.data.type}
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="absolute z-30 top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg p-3.5">
                      {node.kind === "topic" ? (
                        <TopicDetail
                          t={node.data}
                          onClose={() => setExpandedNode(null)}
                        />
                      ) : (
                        <CheckpointDetail
                          cp={node.data}
                          onClose={() => setExpandedNode(null)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-neutral-800 mb-3">
              Grade Breakdown
            </h3>
            <div className="space-y-2.5">
              {course.courseOutline.map((comp, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-700">
                      {comp.name}
                      {comp.count && (
                        <span className="text-neutral-400 ml-1">
                          ({comp.count})
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {comp.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-600 ml-3 tabular-nums">
                    {comp.weight}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100 text-xs">
              <span className="text-neutral-400">Total</span>
              <span className="font-semibold text-neutral-700">
                {course.courseOutline.reduce((s, c) => s + c.weight, 0)}%
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-neutral-800 mb-3">
              Progress
            </h3>
            <div className="space-y-2">
              <SidebarRow label="Topics" value={`${completedTopics} / ${totalTopics}`} />
              <SidebarRow label="Time left" value={`${estRemaining}h`} />
              <SidebarRow
                label="Checkpoints"
                value={`${course.checkpoints.filter((cp) => cp.status === "completed").length} / ${course.checkpoints.length}`}
              />
              {course.checkpoints
                .filter((cp) => cp.status === "completed" && cp.score !== undefined)
                .map((cp) => (
                  <SidebarRow
                    key={cp.id}
                    label={cp.name}
                    value={`${cp.score}/${cp.maxScore}`}
                    accent
                  />
                ))}
            </div>
          </div>

          {(() => {
            const next = course.checkpoints.find(
              (cp) => cp.status === "upcoming",
            );
            if (!next) return null;
            const daysLeft = getDaysUntil(next.date);
            return (
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">
                  Next milestone
                </p>
                <p className="text-[13px] font-semibold text-neutral-800">
                  {next.name}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {next.description}
                </p>
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(next.date)}
                  </span>
                  <span
                    className={`font-medium ${daysLeft <= 7 ? "text-red-600" : "text-neutral-600"}`}
                  >
                    {daysLeft}d
                  </span>
                  <span>{next.estimatedPrepTime}h prep</span>
                </div>
              </div>
            );
          })()}

          <div className="px-1 text-[10px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent inline-block" />
              Completed
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-accent inline-block" />
              In progress
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-neutral-300 inline-block" />
              Available
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-neutral-100 border-2 border-neutral-200 inline-block" />
              Locked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SidebarRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-500">{label}</span>
      <span
        className={`font-medium tabular-nums ${accent ? "text-accent" : "text-neutral-700"}`}
      >
        {value}
      </span>
    </div>
  );
}

function TopicDetail({
  t,
  onClose,
}: {
  t: CourseTopic;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[13px] font-semibold text-neutral-800">
          {t.name}
        </h4>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-sm">
          ×
        </button>
      </div>
      <p className="text-[11px] text-neutral-500 mb-2.5">{t.description}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-neutral-400">Week</span>
          <span className="text-neutral-700">{t.weekNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Status</span>
          <span
            className={
              t.completed
                ? "text-green-600"
                : t.mastery > 0
                  ? "text-accent"
                  : "text-neutral-400"
            }
          >
            {t.completed ? "Completed" : t.mastery > 0 ? "In Progress" : "Locked"}
          </span>
        </div>
        {t.mastery > 0 && (
          <>
            <div className="flex justify-between">
              <span className="text-neutral-400">Mastery</span>
              <span className="text-neutral-700">{t.mastery}%</span>
            </div>
            <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${t.mastery}%` }}
              />
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-400">Est. hours</span>
          <span className="text-neutral-700">{t.estimatedHours}h</span>
        </div>
      </div>
    </>
  );
}

function CheckpointDetail({
  cp,
  onClose,
}: {
  cp: Checkpoint;
  onClose: () => void;
}) {
  const daysLeft = getDaysUntil(cp.date);
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[13px] font-semibold text-neutral-800">
          {cp.name}
        </h4>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-sm">
          ×
        </button>
      </div>
      <p className="text-[11px] text-neutral-500 mb-2.5">{cp.description}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-neutral-400">Type</span>
          <span className="text-neutral-700 capitalize">{cp.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Date</span>
          <span className="text-neutral-700">{formatDate(cp.date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Weight</span>
          <span className="font-semibold text-neutral-700">{cp.weight}%</span>
        </div>
        {cp.score !== undefined && (
          <div className="flex justify-between">
            <span className="text-neutral-400">Score</span>
            <span className="font-semibold text-green-600">
              {cp.score}/{cp.maxScore}
            </span>
          </div>
        )}
        {cp.status === "upcoming" && (
          <div className="mt-1.5 p-2 bg-neutral-50 rounded text-[11px] text-neutral-500">
            {daysLeft > 0 ? `${daysLeft} days away` : "Today"} · {cp.estimatedPrepTime}h recommended prep
          </div>
        )}
      </div>
    </>
  );
}
