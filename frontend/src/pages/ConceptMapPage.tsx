import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
} from "lucide-react";
import { courses, conceptNodes, conceptLinks } from "@/data/learnLensData";
import { getMasteryColor } from "@/utils/helpers";

export const ConceptMapPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>(
    courses[0]?.id ?? "",
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const course = courses.find((c) => c.id === selectedCourse);
  const nodes = conceptNodes.filter((n) => n.courseId === selectedCourse);
  const links = conceptLinks.filter(
    (l) =>
      nodes.some((n) => n.id === l.source) &&
      nodes.some((n) => n.id === l.target),
  );

  const selectedNodeData = selectedNode
    ? nodes.find((n) => n.id === selectedNode)
    : null;

  const gaps = nodes.filter((n) => n.isGap);
  const mastered = nodes.filter((n) => n.mastery >= 80);

  return (
    <div className="space-y-5 max-w-[1080px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Concept Map</h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Explore topic relationships and identify knowledge gaps
        </p>
      </div>

      {/* Course selector */}
      <div className="flex items-center gap-1 border-b border-neutral-200">
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCourse(c.id);
              setSelectedNode(null);
            }}
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              selectedCourse === c.id
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Concept Map SVG */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-neutral-800">
              {course?.name} · Topic Dependencies
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Mastered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" /> Good
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Needs Work
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-red-500 inline-block" /> Gap
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
                    stroke={isHovered ? "#0078d4" : "#e5e5e5"}
                    strokeWidth={isHovered ? 2 : 1}
                    strokeDasharray={link.strength < 0.5 ? "6 4" : "none"}
                    className="transition-all duration-200"
                  />
                );
              })}

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
                    <rect
                      x={node.x}
                      y={node.y}
                      width={80}
                      height={40}
                      rx={6}
                      fill={isSelected ? color : "white"}
                      stroke={isSelected ? color : isHovered ? color : "#e5e5e5"}
                      strokeWidth={isSelected ? 2 : node.isGap ? 1.5 : 1}
                      strokeDasharray={node.isGap ? "4 3" : "none"}
                      className="transition-all duration-200"
                    />
                    <text
                      x={node.x + 40}
                      y={node.y + 17}
                      textAnchor="middle"
                      className="text-[10px] font-medium pointer-events-none"
                      fill={isSelected ? "white" : "#171717"}
                    >
                      {node.name.length > 12
                        ? node.name.slice(0, 12) + ".."
                        : node.name}
                    </text>
                    <text
                      x={node.x + 40}
                      y={node.y + 32}
                      textAnchor="middle"
                      className="text-[9px] pointer-events-none"
                      fill={isSelected ? "rgba(255,255,255,0.8)" : "#a3a3a3"}
                    >
                      {node.mastery > 0 ? `${node.mastery}%` : "Not started"}
                    </text>
                    {node.isGap && (
                      <circle
                        cx={node.x + 75}
                        cy={node.y + 5}
                        r={4}
                        fill="#dc2626"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selectedNodeData ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: getMasteryColor(selectedNodeData.mastery),
                  }}
                />
                <h3 className="text-[13px] font-semibold text-neutral-800">
                  {selectedNodeData.name}
                </h3>
              </div>
              <p className="text-[11px] text-neutral-500 mb-3">
                {selectedNodeData.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-400">Mastery</span>
                  <span className="font-medium text-neutral-700 tabular-nums">
                    {selectedNodeData.mastery}%
                  </span>
                </div>
                <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedNodeData.mastery}%`,
                      backgroundColor: getMasteryColor(
                        selectedNodeData.mastery,
                      ),
                    }}
                  />
                </div>
                {selectedNodeData.isGap && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 rounded-md mt-2">
                    <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-red-700">
                      Knowledge gap detected. This topic needs focused study.
                    </p>
                  </div>
                )}
              </div>
              {selectedNodeData.dependencies.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-neutral-400 mb-1.5">
                    Prerequisites:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNodeData.dependencies.map((depId) => {
                      const dep = nodes.find((n) => n.id === depId);
                      return dep ? (
                        <span
                          key={depId}
                          className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded"
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
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                <h3 className="text-[13px] font-medium text-neutral-700">
                  Select a Topic
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400">
                Click on any node in the concept map to see details, mastery
                level, and prerequisites.
              </p>
            </div>
          )}

          {/* Knowledge Gaps */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="text-[13px] font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Knowledge Gaps ({gaps.length})
            </h3>
            <div className="space-y-1.5">
              {gaps.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-neutral-50 transition-colors"
                >
                  <Circle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-neutral-700">
                      {n.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 tabular-nums">
                      {n.mastery}% mastery
                    </p>
                  </div>
                </button>
              ))}
              {gaps.length === 0 && (
                <p className="text-[11px] text-neutral-400 text-center py-2">
                  No knowledge gaps detected
                </p>
              )}
            </div>
          </div>

          {/* Mastered */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h3 className="text-[13px] font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Mastered ({mastered.length})
            </h3>
            <div className="space-y-1">
              {mastered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-neutral-50 transition-colors"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-600 shrink-0" />
                  <span className="text-[11px] text-neutral-600">{n.name}</span>
                  <span className="text-[10px] text-green-600 ml-auto tabular-nums">
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
