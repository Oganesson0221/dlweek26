import React, { useState } from "react";
import {
  Network,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
} from "lucide-react";
import { courses, conceptNodes, conceptLinks } from "@/data/learnLensData";
import { getMasteryColor } from "@/utils/helpers";

export const ConceptMapPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>(courses[0]?.id ?? "");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const course = courses.find((c) => c.id === selectedCourse);
  const nodes = conceptNodes.filter((n) => n.courseId === selectedCourse);
  const links = conceptLinks.filter(
    (l) =>
      nodes.some((n) => n.id === l.source) && nodes.some((n) => n.id === l.target)
  );

  const selectedNodeData = selectedNode
    ? nodes.find((n) => n.id === selectedNode)
    : null;

  const gaps = nodes.filter((n) => n.isGap);
  const mastered = nodes.filter((n) => n.mastery >= 80);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Concept Map</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Explore topic relationships and identify knowledge gaps
          </p>
        </div>
      </div>

      {/* Course selector */}
      <div className="flex items-center gap-2">
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCourse(c.id);
              setSelectedNode(null);
            }}
            className={`px-4 py-2 rounded-xl text-[12px] font-medium transition-all ${
              selectedCourse === c.id
                ? "text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            style={
              selectedCourse === c.id
                ? { backgroundColor: c.color }
                : undefined
            }
          >
            {c.code}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Concept Map SVG */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-slate-700">
              {course?.name} -- Topic Dependencies
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#107c10]" /> Mastered
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#0078d4]" /> Good
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#ffb900]" /> Needs Work
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-dashed border-[#d83b01]" /> Gap
              </span>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <svg
              width="900"
              height="380"
              viewBox="0 0 900 380"
              className="w-full h-auto"
            >
              {/* Links */}
              {links.map((link) => {
                const source = nodes.find((n) => n.id === link.source);
                const target = nodes.find((n) => n.id === link.target);
                if (!source || !target) return null;
                const isHovered =
                  hoveredNode === link.source || hoveredNode === link.target;
                return (
                  <line
                    key={`${link.source}-${link.target}`}
                    x1={source.x + 40}
                    y1={source.y + 20}
                    x2={target.x + 40}
                    y2={target.y + 20}
                    stroke={isHovered ? "#0078d4" : "#e2e8f0"}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={link.strength < 0.5 ? "6 4" : "none"}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Arrow markers */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                </marker>
              </defs>

              {/* Nodes */}
              {nodes.map((node) => {
                const color = getMasteryColor(node.mastery);
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                return (
                  <g
                    key={node.id}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() =>
                      setSelectedNode(selectedNode === node.id ? null : node.id)
                    }
                    className="cursor-pointer"
                  >
                    {/* Node background */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={80}
                      height={40}
                      rx={12}
                      fill={isSelected ? color : "white"}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : node.isGap ? 2 : 1.5}
                      strokeDasharray={node.isGap ? "4 3" : "none"}
                      className="transition-all duration-200"
                      filter={isHovered || isSelected ? "url(#shadow)" : "none"}
                    />
                    {/* Label */}
                    <text
                      x={node.x + 40}
                      y={node.y + 17}
                      textAnchor="middle"
                      className="text-[10px] font-medium pointer-events-none"
                      fill={isSelected ? "white" : "#334155"}
                    >
                      {node.name.length > 12 ? node.name.slice(0, 12) + ".." : node.name}
                    </text>
                    {/* Mastery */}
                    <text
                      x={node.x + 40}
                      y={node.y + 32}
                      textAnchor="middle"
                      className="text-[9px] pointer-events-none"
                      fill={isSelected ? "rgba(255,255,255,0.8)" : "#94a3b8"}
                    >
                      {node.mastery > 0 ? `${node.mastery}%` : "Not started"}
                    </text>
                    {/* Gap indicator */}
                    {node.isGap && (
                      <circle
                        cx={node.x + 75}
                        cy={node.y + 5}
                        r={5}
                        fill="#d83b01"
                      />
                    )}
                  </g>
                );
              })}

              {/* Shadow filter */}
              <defs>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="3"
                    floodOpacity="0.1"
                  />
                </filter>
              </defs>
            </svg>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Node detail */}
          {selectedNodeData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getMasteryColor(selectedNodeData.mastery) }}
                />
                <h3 className="text-[14px] font-semibold text-slate-700">
                  {selectedNodeData.name}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                {selectedNodeData.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Mastery</span>
                  <span className="font-medium text-slate-700">
                    {selectedNodeData.mastery}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedNodeData.mastery}%`,
                      backgroundColor: getMasteryColor(selectedNodeData.mastery),
                    }}
                  />
                </div>
                {selectedNodeData.isGap && (
                  <div className="flex items-start gap-2 p-2.5 bg-[#d83b01]/5 rounded-lg mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d83b01] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[#d83b01]">
                      Knowledge gap detected. This topic needs focused study.
                    </p>
                  </div>
                )}
              </div>
              {selectedNodeData.dependencies.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-slate-400 mb-1.5">
                    Prerequisites:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNodeData.dependencies.map((depId) => {
                      const dep = nodes.find((n) => n.id === depId);
                      return dep ? (
                        <span
                          key={depId}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md"
                        >
                          {dep.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-[#0078d4]" />
                <h3 className="text-[13px] font-semibold text-slate-700">
                  Select a Topic
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Click on any node in the concept map to see details, mastery
                level, and prerequisites.
              </p>
            </div>
          )}

          {/* Knowledge Gaps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#d83b01]" />
              Knowledge Gaps ({gaps.length})
            </h3>
            <div className="space-y-2">
              {gaps.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n.id)}
                  className="w-full flex items-center gap-2.5 p-2.5 bg-[#d83b01]/5 rounded-lg text-left hover:bg-[#d83b01]/8 transition-colors"
                >
                  <Circle className="w-3 h-3 text-[#d83b01] shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700">
                      {n.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {n.mastery}% mastery
                    </p>
                  </div>
                </button>
              ))}
              {gaps.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-2">
                  No knowledge gaps detected
                </p>
              )}
            </div>
          </div>

          {/* Mastered */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-[13px] font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#107c10]" />
              Mastered ({mastered.length})
            </h3>
            <div className="space-y-1.5">
              {mastered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#107c10] shrink-0" />
                  <span className="text-[11px] text-slate-600">{n.name}</span>
                  <span className="text-[10px] text-[#107c10] ml-auto">
                    {n.mastery}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
