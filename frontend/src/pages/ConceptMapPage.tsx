import React, { useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
  X,
  ArrowRight,
  Sparkles,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { courses, conceptNodes, conceptLinks } from "@/data/learnLensData";
import { getMasteryColor } from "@/utils/helpers";

// Define terminology data for each concept node
interface TermDefinition {
  term: string;
  definition: string;
  examples?: string[];
  relatedTerms: string[];
}

const terminologyData: Record<string, TermDefinition> = {
  cn1: {
    term: "Arrays",
    definition: "A contiguous block of memory storing elements of the same type, accessed by index. Arrays provide O(1) random access but O(n) insertion/deletion.",
    examples: ["int[] numbers = {1, 2, 3, 4, 5}", "Fixed-size collections", "Matrix representations"],
    relatedTerms: ["cn2", "cn3"],
  },
  cn2: {
    term: "Linked Lists",
    definition: "A linear data structure where elements are stored in nodes, each pointing to the next. Provides O(1) insertion/deletion at known positions but O(n) access.",
    examples: ["Singly linked list", "Doubly linked list", "Circular linked list"],
    relatedTerms: ["cn1", "cn4"],
  },
  cn3: {
    term: "Hash Tables",
    definition: "A data structure that maps keys to values using a hash function. Provides average O(1) for insertion, deletion, and lookup operations.",
    examples: ["Dictionary/Map implementations", "Caching systems", "Symbol tables"],
    relatedTerms: ["cn1"],
  },
  cn4: {
    term: "Trees",
    definition: "A hierarchical data structure with nodes connected by edges, where each node has a parent (except root) and zero or more children.",
    examples: ["Binary trees", "BST (Binary Search Tree)", "AVL trees", "B-trees"],
    relatedTerms: ["cn2", "cn5"],
  },
  cn5: {
    term: "Graphs",
    definition: "A non-linear data structure consisting of vertices (nodes) connected by edges. Can be directed or undirected, weighted or unweighted.",
    examples: ["Social networks", "Road maps", "Dependency graphs"],
    relatedTerms: ["cn4", "cn6", "cn7"],
  },
  cn6: {
    term: "BFS / DFS",
    definition: "Graph traversal algorithms. BFS (Breadth-First Search) explores level by level. DFS (Depth-First Search) explores as deep as possible before backtracking.",
    examples: ["Finding shortest path in unweighted graph (BFS)", "Topological sorting (DFS)", "Cycle detection"],
    relatedTerms: ["cn5", "cn7", "cn8"],
  },
  cn7: {
    term: "Shortest Path",
    definition: "Algorithms to find the minimum-cost path between vertices in a graph. Dijkstra's works for non-negative weights, Bellman-Ford handles negative weights.",
    examples: ["GPS navigation", "Network routing", "Game AI pathfinding"],
    relatedTerms: ["cn5", "cn6"],
  },
  cn8: {
    term: "Dynamic Programming",
    definition: "An algorithmic paradigm that solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation.",
    examples: ["Fibonacci sequence", "Knapsack problem", "Longest common subsequence"],
    relatedTerms: ["cn6"],
  },
  cn9: {
    term: "Vectors",
    definition: "Mathematical objects with magnitude and direction. In linear algebra, vectors are elements of vector spaces with operations like addition and scalar multiplication.",
    examples: ["Position vectors", "Velocity vectors", "Column/row vectors"],
    relatedTerms: ["cn10"],
  },
  cn10: {
    term: "Matrices",
    definition: "Two-dimensional arrays of numbers arranged in rows and columns. Used for linear transformations, systems of equations, and data representation.",
    examples: ["Rotation matrices", "Identity matrix", "Adjacency matrices"],
    relatedTerms: ["cn9", "cn11"],
  },
  cn11: {
    term: "Determinants",
    definition: "A scalar value computed from a square matrix that indicates if the matrix is invertible and represents the scaling factor of the linear transformation.",
    examples: ["det(A) = ad - bc for 2x2", "Checking invertibility", "Computing cross products"],
    relatedTerms: ["cn10"],
  },
};

export const ConceptMapPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>(
    courses[0]?.id ?? "",
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [connectionPath, setConnectionPath] = useState<string[]>([]);

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

  // Handle terminology click - show definition and add to path
  const handleTermClick = useCallback((nodeId: string) => {
    if (expandedTerm === nodeId) {
      // If clicking same term, close it
      setExpandedTerm(null);
    } else {
      setExpandedTerm(nodeId);
      // Add to connection path for visual trail
      if (!connectionPath.includes(nodeId)) {
        setConnectionPath(prev => [...prev, nodeId]);
      }
    }
    setSelectedNode(nodeId);
  }, [expandedTerm, connectionPath]);

  // Navigate to related term
  const navigateToRelated = useCallback((nodeId: string) => {
    setExpandedTerm(nodeId);
    setSelectedNode(nodeId);
    if (!connectionPath.includes(nodeId)) {
      setConnectionPath(prev => [...prev, nodeId]);
    }
  }, [connectionPath]);

  // Clear exploration path
  const clearPath = useCallback(() => {
    setConnectionPath([]);
    setExpandedTerm(null);
  }, []);

  // Get active connections (for animation)
  const activeConnections = useMemo(() => {
    const connections: { source: string; target: string }[] = [];
    for (let i = 0; i < connectionPath.length - 1; i++) {
      connections.push({
        source: connectionPath[i],
        target: connectionPath[i + 1],
      });
    }
    return connections;
  }, [connectionPath]);

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/concepts.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Microsoft-style gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#5c2d91]/10 via-white/90 to-[#0078d4]/10" />
      
      {/* Content container */}
      <div className="relative z-10 space-y-5 max-w-[1200px] mx-auto py-8 px-4">
        <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 border border-white/50 shadow-lg inline-block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#b4a0ff] flex items-center justify-center shadow-md">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#5c2d91] to-[#0078d4] bg-clip-text text-transparent">
                Concept Map
              </h1>
              <p className="text-sm text-neutral-600">
                Click on any term to explore definitions and connections
              </p>
            </div>
          </div>
        </div>

        {/* Course selector with Microsoft tab style */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="inline-flex items-center gap-1 backdrop-blur-md bg-white/60 rounded-xl p-1.5 border border-white/50 shadow-lg">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCourse(c.id);
                  setSelectedNode(null);
                  setExpandedTerm(null);
                  setConnectionPath([]);
                }}
                className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all ${
                  selectedCourse === c.id
                    ? "bg-gradient-to-r from-[#5c2d91] to-[#b4a0ff] text-white shadow-md"
                    : "text-neutral-600 hover:bg-[#5c2d91]/10 hover:text-[#5c2d91]"
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>

          {/* Path trail indicator */}
          {connectionPath.length > 0 && (
            <div className="flex items-center gap-2 backdrop-blur-md bg-white/60 rounded-xl px-4 py-2 border border-white/50 shadow-lg">
              <Sparkles className="w-4 h-4 text-[#5c2d91]" />
              <span className="text-[12px] text-neutral-600 font-medium">
                Learning Path: {connectionPath.length} concepts explored
              </span>
              <button
                onClick={clearPath}
                className="ml-2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-neutral-400" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Interactive Concept Map */}
          <div className="lg:col-span-3 backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#5c2d91]" />
                <h2 className="text-[14px] font-semibold text-neutral-800">
                  {course?.name} · Interactive Terminology Map
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-neutral-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Mastered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" /> Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Learning
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-red-500 inline-block" /> Gap
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-white border border-neutral-100">
              <div className="overflow-x-auto overflow-y-hidden" style={{ maxWidth: "100%" }}>
                <svg
                  width="100%"
                  height="380"
                  viewBox="0 0 1000 380"
                  preserveAspectRatio="xMidYMid meet"
                  className="min-w-[700px]"
                  style={{ maxHeight: "380px" }}
                >
                {/* Animated connection path overlay */}
                {activeConnections.map((conn, idx) => {
                  const source = nodes.find((n) => n.id === conn.source);
                  const target = nodes.find((n) => n.id === conn.target);
                  if (!source || !target) return null;
                  return (
                    <line
                      key={`path-${idx}`}
                      x1={source.x + 50}
                      y1={source.y + 30}
                      x2={target.x + 50}
                      y2={target.y + 30}
                      stroke="url(#pathGradient)"
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      className="animate-pulse"
                      style={{ 
                        animation: "dash 1s linear infinite",
                      }}
                    />
                  );
                })}

                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5c2d91" />
                    <stop offset="100%" stopColor="#50e6ff" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Regular Links */}
                {links.map((link) => {
                  const source = nodes.find((n) => n.id === link.source);
                  const target = nodes.find((n) => n.id === link.target);
                  if (!source || !target) return null;
                  const isHovered =
                    hoveredNode === link.source || hoveredNode === link.target;
                  const isInPath = connectionPath.includes(link.source) && connectionPath.includes(link.target);
                  return (
                    <line
                      key={`${link.source}-${link.target}`}
                      x1={source.x + 50}
                      y1={source.y + 30}
                      x2={target.x + 50}
                      y2={target.y + 30}
                      stroke={isInPath ? "#5c2d91" : isHovered ? "#0078d4" : "#e5e5e5"}
                      strokeWidth={isInPath ? 2 : isHovered ? 2 : 1}
                      strokeDasharray={link.strength < 0.5 ? "6 4" : "none"}
                      className="transition-all duration-200"
                    />
                  );
                })}

                {/* Interactive Terminology Nodes */}
                {nodes.map((node) => {
                  const color = getMasteryColor(node.mastery);
                  const isHovered = hoveredNode === node.id;
                  const isSelected = selectedNode === node.id;
                  const isExpanded = expandedTerm === node.id;
                  const isInPath = connectionPath.includes(node.id);
                  const termData = terminologyData[node.id];
                  
                  return (
                    <g
                      key={node.id}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => handleTermClick(node.id)}
                      className="cursor-pointer"
                      style={{ filter: isExpanded ? "url(#glow)" : "none" }}
                    >
                      {/* Node background with hover effect */}
                      <rect
                        x={node.x}
                        y={node.y}
                        width={100}
                        height={60}
                        rx={12}
                        fill={isExpanded ? "url(#pathGradient)" : isSelected ? color : "white"}
                        stroke={isInPath ? "#5c2d91" : isSelected ? color : isHovered ? color : "#e5e5e5"}
                        strokeWidth={isExpanded ? 3 : isSelected || isInPath ? 2 : node.isGap ? 1.5 : 1}
                        strokeDasharray={node.isGap && !isExpanded ? "4 3" : "none"}
                        className="transition-all duration-300"
                      />
                      
                      {/* Term name */}
                      <text
                        x={node.x + 50}
                        y={node.y + 24}
                        textAnchor="middle"
                        className="text-[11px] font-semibold pointer-events-none"
                        fill={isExpanded || isSelected ? "white" : "#171717"}
                      >
                        {node.name.length > 14
                          ? node.name.slice(0, 14) + ".."
                          : node.name}
                      </text>
                      
                      {/* Mastery percentage */}
                      <text
                        x={node.x + 50}
                        y={node.y + 40}
                        textAnchor="middle"
                        className="text-[9px] pointer-events-none"
                        fill={isExpanded || isSelected ? "rgba(255,255,255,0.9)" : "#a3a3a3"}
                      >
                        {node.mastery > 0 ? `${node.mastery}% mastery` : "Not started"}
                      </text>
                      
                      {/* Click hint */}
                      <text
                        x={node.x + 50}
                        y={node.y + 52}
                        textAnchor="middle"
                        className="text-[8px] pointer-events-none"
                        fill={isExpanded || isSelected ? "rgba(255,255,255,0.7)" : isHovered ? "#0078d4" : "transparent"}
                      >
                        {isHovered && !isExpanded ? "Click to explore →" : ""}
                      </text>

                      {/* Gap indicator */}
                      {node.isGap && (
                        <circle
                          cx={node.x + 92}
                          cy={node.y + 8}
                          r={5}
                          fill="#dc2626"
                        />
                      )}

                      {/* Path indicator */}
                      {isInPath && !isExpanded && (
                        <circle
                          cx={node.x + 8}
                          cy={node.y + 8}
                          r={5}
                          fill="#5c2d91"
                          className="animate-pulse"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              </div>
            </div>

            {/* Expanded Definition Panel (NotebookLM style) */}
            {expandedTerm && terminologyData[expandedTerm] && (
              <div className="mt-4 p-5 bg-gradient-to-br from-[#5c2d91]/5 to-[#0078d4]/5 rounded-xl border border-[#5c2d91]/20 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#0078d4] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-800">
                      {terminologyData[expandedTerm].term}
                    </h3>
                  </div>
                  <button
                    onClick={() => setExpandedTerm(null)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
                
                <p className="text-[14px] text-neutral-700 leading-relaxed mb-4">
                  {terminologyData[expandedTerm].definition}
                </p>

                {terminologyData[expandedTerm].examples && (
                  <div className="mb-4">
                    <p className="text-[12px] font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                      Examples
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {terminologyData[expandedTerm].examples?.map((ex, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-white/80 rounded-lg text-[12px] text-neutral-600 border border-neutral-200"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Terms - NotebookLM style navigation */}
                {terminologyData[expandedTerm].relatedTerms.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Continue Learning
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {terminologyData[expandedTerm].relatedTerms.map((relId) => {
                        const relNode = nodes.find(n => n.id === relId);
                        const relTerm = terminologyData[relId];
                        if (!relNode || !relTerm) return null;
                        const isVisited = connectionPath.includes(relId);
                        return (
                          <button
                            key={relId}
                            onClick={() => navigateToRelated(relId)}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:shadow-md ${
                              isVisited
                                ? "bg-[#5c2d91]/10 text-[#5c2d91] border border-[#5c2d91]/30"
                                : "bg-white text-neutral-700 border border-neutral-200 hover:border-[#0078d4] hover:text-[#0078d4]"
                            }`}
                          >
                            {isVisited && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {relTerm.term}
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selectedNodeData ? (
            <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
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
                        <button
                          key={depId}
                          onClick={() => navigateToRelated(depId)}
                          className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded hover:bg-[#5c2d91]/10 hover:text-[#5c2d91] transition-colors"
                        >
                          {dep.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#b4a0ff] flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-[13px] font-medium text-neutral-700">
                  Explore Terms
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400">
                Click on any concept to see its definition, examples, and navigate to related topics like NotebookLM.
              </p>
            </div>
          )}

          {/* Learning Path */}
          {connectionPath.length > 0 && (
            <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
              <h3 className="text-[13px] font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#0078d4] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                Your Learning Path
              </h3>
              <div className="space-y-1">
                {connectionPath.map((nodeId, idx) => {
                  const node = nodes.find(n => n.id === nodeId);
                  if (!node) return null;
                  return (
                    <div key={nodeId} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#5c2d91] to-[#0078d4] text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => navigateToRelated(nodeId)}
                        className="text-[11px] text-neutral-600 hover:text-[#5c2d91] transition-colors"
                      >
                        {node.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Knowledge Gaps */}
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
            <h3 className="text-[13px] font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#d83b01] to-[#ff6f61] flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              Knowledge Gaps ({gaps.length})
            </h3>
            <div className="space-y-1.5">
              {gaps.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleTermClick(n.id)}
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
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
            <h3 className="text-[13px] font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#107c10] to-[#00cc6a] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              Mastered ({mastered.length})
            </h3>
            <div className="space-y-1">
              {mastered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleTermClick(n.id)}
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
    </div>
  );
};
