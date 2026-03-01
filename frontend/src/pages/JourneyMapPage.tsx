import React, { useState, useMemo } from "react";
import {
  Check,
  Lock,
  Circle,
  Clock,
  Calendar,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Zap,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { courses, semesterInfo } from "@/data/learnLensData";
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
  const [zoom, setZoom] = useState(100);

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

  // Count weak areas (mastery < 50%)
  const weakAreas = course.topics.filter(t => !t.completed && t.mastery < 50).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 selection:bg-indigo-100 relative">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
            Course <span className="text-indigo-600">Journey</span>
          </h1>
          <p className="mt-4 text-[15px] font-medium text-slate-500 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            {completedTopics} of {totalTopics} topics mastered · {estRemaining}h remaining
          </p>
        </div>
        
        <div className="inline-flex items-center gap-2 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 20))}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-slate-400" />
          </button>
          <span className="text-[12px] font-bold text-slate-600 min-w-[3rem] text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 20))}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>


      {/* Course Tabs */}
      <div className="flex gap-2 flex-wrap">
        {courses.map((c) => {
          const active = selectedCourseId === c.id;
          return (
            <motion.button
              key={c.id}
              onClick={() => {
                setSelectedCourseId(c.id);
                setExpandedNode(null);
                setZoom(100);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-[13px] transition-all ${
                active
                  ? "text-white shadow-lg"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
              style={active ? { backgroundColor: c.color } : {}}
            >
              {c.code}
              <span className="ml-2 text-[11px] opacity-75">{c.progress}%</span>
            </motion.button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Content - Interactive Map */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Progress</p>
              <motion.p className="text-[24px] font-black text-slate-900">
                {Math.round((completedTopics / totalTopics) * 100)}%
              </motion.p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedTopics / totalTopics) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: course.color }}
                />
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Topics Left</p>
              <motion.p className="text-[24px] font-black text-slate-900">
                {totalTopics - completedTopics}
              </motion.p>
              <p className="text-[11px] text-slate-400 mt-2">{estRemaining}h remaining</p>
            </div>

            <div className={`rounded-[24px] p-5 border shadow-sm ${weakAreas > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: weakAreas > 0 ? '#b91c1c' : '#15803d' }}>
                {weakAreas > 0 ? 'Weak Areas' : 'On Track'}
              </p>
              <motion.p className="text-[24px] font-black" style={{ color: weakAreas > 0 ? '#991b1b' : '#166534' }}>
                {weakAreas}
              </motion.p>
              {weakAreas > 0 && <p className="text-[11px] mt-2 text-rose-700">Need reinforcement</p>}
            </div>
          </div>

          {/* Course Header */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-[28px] font-black text-slate-900 tracking-tight">{course.name}</h2>
                <p className="text-[13px] text-slate-500 mt-2">{course.instructor} · {course.schedule}</p>
              </div>
              <div className="text-right">
                <p className="text-[32px] font-black text-slate-900">{course.grade}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Grade</p>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: course.color }}
              />
            </div>
          </div>

          {/* Interactive Journey Map */}
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <Zap className="w-48 h-48 text-slate-900" />
            </div>

            <h3 className="text-[20px] font-black text-slate-900 mb-8">Course Route Map</h3>

            <div
              className="relative bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-[32px] border border-slate-200 p-6 overflow-auto"
              style={{ minHeight: `${(svgH + 40) * (zoom / 100)}px` }}
            >
              {/* SVG overlay for connections - scales with zoom */}
              <svg
                className="absolute top-6 left-6 pointer-events-none"
                width={`${100 * (zoom / 100)}%`}
                height={`${(svgH + 20) * (zoom / 100)}px`}
                viewBox={`0 0 100 ${svgH + 20}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ 
                  left: '24px',
                  top: '24px'
                }}
              >
                {/* Animated connection paths */}
                {positions.map((pos, i) => {
                  if (i === 0) return null;
                  const prev = positions[i - 1];
                  const prevState = getNodeState(route[i - 1], i - 1, route);
                  const currState = getNodeState(route[i], i, route);
                  const done = prevState === "completed";
                  const midY = (prev.y + pos.y) / 2;
                  
                  return (
                    <g key={`connection-${i}`}>
                      {/* Background line for visual clarity */}
                      <path
                        d={`M ${prev.x} ${prev.y} C ${prev.x} ${midY}, ${pos.x} ${midY}, ${pos.x} ${pos.y}`}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                      {/* Animated completed path */}
                      {done && (
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, ease: "easeInOut" }}
                          d={`M ${prev.x} ${prev.y} C ${prev.x} ${midY}, ${pos.x} ${midY}, ${pos.x} ${pos.y}`}
                          fill="none"
                          stroke={course.color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          filter={`drop-shadow(0 0 6px ${course.color}60)`}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Interactive route nodes - scaled together */}
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
                {/* Route Nodes */}
                {route.map((node, i) => {
                  const pos = positions[i];
                  const state = getNodeState(node, i, route);
                  const isCheckpoint = node.kind === "checkpoint";
                  const isExpanded = expandedNode === i;
                  const label = node.kind === "topic" ? node.data.name : node.data.name;
                  const hasWeakArea = node.kind === "topic" && !node.data.completed && node.data.mastery < 50;

                  return (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${pos.x}%`,
                        top: pos.y,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        <motion.button
                          onClick={() => setExpandedNode(isExpanded ? null : i)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={state === "locked"}
                          className={`relative flex items-center justify-center rounded-full font-bold text-white shadow-lg transition-all ${
                            state === "locked" ? "cursor-default opacity-50" : "cursor-pointer"
                          } ${isExpanded ? "ring-4 ring-offset-2" : ""} ${hasWeakArea ? 'animate-pulse' : ''}`}
                          style={{
                            width: isCheckpoint ? 44 : 36,
                            height: isCheckpoint ? 44 : 36,
                            backgroundColor: state === "completed" ? course.color : state === "current" ? course.color + 'dd' : '#e2e8f0',
                            borderColor: hasWeakArea ? '#dc2626' : course.color,
                            border: state === 'locked' ? '2px solid #cbd5e1' : `2px solid ${course.color}`,
                            boxShadow: state === "completed" ? `0 8px 16px ${course.color}40` : 'none',
                          }}
                        >
                          {state === "completed" && (
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          )}
                          {state === "current" && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                          {state === "upcoming" && (
                            <Circle className="w-3 h-3 text-slate-400" />
                          )}
                          {state === "locked" && (
                            <Lock className="w-4 h-4 text-slate-400" />
                          )}
                          
                          {hasWeakArea && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white">
                              <AlertTriangle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </motion.button>

                        <motion.div
                          className="mt-3 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className={`text-[11px] font-bold leading-tight max-w-[100px] ${
                            state === "completed" || state === "current"
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}>
                            {label.length > 20 ? label.slice(0, 18) + "..." : label}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {node.kind === "topic" ? `W${node.data.weekNumber}` : node.data.type}
                          </p>
                        </motion.div>

                        {/* Expanded Detail Card */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute top-full z-20 mt-4 w-72 bg-white rounded-[24px] shadow-xl border border-slate-200 p-5"
                            >
                              {node.kind === "topic" ? (
                                <TopicDetail t={node.data} onClose={() => setExpandedNode(null)} color={course.color} />
                              ) : (
                                <CheckpointDetail cp={node.data} onClose={() => setExpandedNode(null)} color={course.color} />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Grade Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-[16px] font-black text-slate-900 mb-5">Grade Breakdown</h3>
            <div className="space-y-4">
              {course.courseOutline.map((comp, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-slate-700">{comp.name}</p>
                    <span className="text-[12px] font-black text-slate-900">{comp.weight}%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{comp.description}</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${comp.weight}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Next Checkpoint */}
          {(() => {
            const next = course.checkpoints.find((cp) => cp.status === "upcoming");
            if (!next) return null;
            const daysLeft = getDaysUntil(next.date);
            const urgency = daysLeft <= 7;

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-[32px] border p-6 shadow-sm ${
                  urgency
                    ? "bg-rose-50 border-rose-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${urgency ? 'bg-rose-100' : 'bg-slate-100'}`}>
                    <Clock className={`w-5 h-5 ${urgency ? 'text-rose-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${urgency ? 'text-rose-600' : 'text-slate-400'}`}>
                      {urgency ? "Due Soon" : "Next"}
                    </p>
                    <h3 className={`text-[14px] font-black ${urgency ? 'text-rose-900' : 'text-slate-900'}`}>
                      {next.name}
                    </h3>
                  </div>
                </div>
                <p className={`text-[12px] mb-3 ${urgency ? 'text-rose-700' : 'text-slate-600'}`}>
                  {next.description}
                </p>
                <div className={`flex items-center gap-2 text-[11px] font-bold ${urgency ? 'text-rose-600' : 'text-slate-600'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(next.date)} · {daysLeft}d left
                </div>
              </motion.div>
            );
          })()}

          {/* Legend */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[14px] font-black text-slate-900 mb-4">Route Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: course.color }} />
                <span className="text-[12px] text-slate-600">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: course.color }} />
                <span className="text-[12px] text-slate-600">In Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-200" />
                <span className="text-[12px] text-slate-600">Upcoming</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-300" />
                <span className="text-[12px] text-slate-600">Locked</span>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-[12px] text-red-600 font-bold">Weak Area</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function TopicDetail({
  t,
  onClose,
  color,
}: {
  t: CourseTopic;
  onClose: () => void;
  color: string;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-[14px] font-black text-slate-900">
          {t.name}
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
          ×
        </button>
      </div>
      <p className="text-[12px] text-slate-600 mb-4">{t.description}</p>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mastery</span>
            <span className="text-[13px] font-black text-slate-900">{t.mastery}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${t.mastery}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
            <p className="text-[12px] font-black mt-1" style={{ color: t.completed ? '#15803d' : t.mastery > 0 ? color : '#94a3b8' }}>
              {t.completed ? "Completed" : t.mastery > 0 ? "In Progress" : "Locked"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Week</p>
            <p className="text-[12px] font-black text-slate-900 mt-1">W{t.weekNumber}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Hours</p>
            <p className="text-[12px] font-black text-slate-900 mt-1">{t.estimatedHours}h</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prerequisites</p>
            <p className="text-[12px] font-black text-slate-900 mt-1">{t.dependencies.length}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function CheckpointDetail({
  cp,
  onClose,
  color,
}: {
  cp: Checkpoint;
  onClose: () => void;
  color: string;
}) {
  const daysLeft = getDaysUntil(cp.date);
  const urgency = daysLeft <= 7;

  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-[14px] font-black text-slate-900">
          {cp.name}
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
          ×
        </button>
      </div>
      <p className="text-[12px] text-slate-600 mb-4">{cp.description}</p>

      <div className="space-y-3">
        <div className={`rounded-lg p-3 border ${urgency ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-black uppercase tracking-widest ${urgency ? 'text-rose-600' : 'text-blue-600'}`}>
              {urgency ? "Due Soon" : "Days Until"}
            </span>
            <span className={`text-[16px] font-black ${urgency ? 'text-rose-600' : 'text-blue-600'}`}>
              {daysLeft}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
            <p className="text-[12px] font-black text-slate-900 mt-1 capitalize">{cp.type}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weight</p>
            <p className="text-[12px] font-black text-slate-900 mt-1">{cp.weight}%</p>
          </div>
        </div>

        {cp.score !== undefined && (
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Score</p>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-black text-emerald-600">{cp.score}/{cp.maxScore}</p>
              <p className="text-[11px] font-bold text-emerald-600">
                {Math.round((cp.score / cp.maxScore) * 100)}%
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200">
          <span>Prep Time:</span>
          <span className="font-bold">{cp.estimatedPrepTime}h</span>
        </div>
      </div>
    </>
  );
}
