import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  Upload,
  FileText,
  Key,
  Loader,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
// Removed hardcoded imports - now using backend-generated data only
// import { courses, conceptNodes, conceptLinks } from "@/data/microsoftCoursePilotData";
import { getMasteryColor } from "@/utils/helpers";
import {
  summarizeFile,
  extractKeywordsFromFile,
  getSummaries,
  getKeywords,
  deleteSummary,
  deleteKeywordsRecord,
  generateConceptMapFromFile,
  getConceptMaps,
  deleteConceptMap,
  SummaryResponse,
  KeywordsResponse,
  ConceptMapResponse,
} from "@/api/quizApi";

// Define terminology data for each concept node
interface TermDefinition {
  term: string;
  definition: string;
  examples?: string[];
  relatedTerms: string[];
}

// HARDCODED DATA - COMMENTED OUT - NOW USING BACKEND-GENERATED DATA
/*
const terminologyData: Record<string, TermDefinition> = {
  cn1: {
    term: "Arrays",
    definition:
      "A contiguous block of memory storing elements of the same type, accessed by index. Arrays provide O(1) random access but O(n) insertion/deletion.",
    examples: [
      "int[] numbers = {1, 2, 3, 4, 5}",
      "Fixed-size collections",
      "Matrix representations",
    ],
    relatedTerms: ["cn2", "cn3"],
  },
  cn2: {
    term: "Linked Lists",
    definition:
      "A linear data structure where elements are stored in nodes, each pointing to the next. Provides O(1) insertion/deletion at known positions but O(n) access.",
    examples: [
      "Singly linked list",
      "Doubly linked list",
      "Circular linked list",
    ],
    relatedTerms: ["cn1", "cn4"],
  },
  cn3: {
    term: "Hash Tables",
    definition:
      "A data structure that maps keys to values using a hash function. Provides average O(1) for insertion, deletion, and lookup operations.",
    examples: [
      "Dictionary/Map implementations",
      "Caching systems",
      "Symbol tables",
    ],
    relatedTerms: ["cn1"],
  },
  cn4: {
    term: "Trees",
    definition:
      "A hierarchical data structure with nodes connected by edges, where each node has a parent (except root) and zero or more children.",
    examples: [
      "Binary trees",
      "BST (Binary Search Tree)",
      "AVL trees",
      "B-trees",
    ],
    relatedTerms: ["cn2", "cn5"],
  },
  cn5: {
    term: "Graphs",
    definition:
      "A non-linear data structure consisting of vertices (nodes) connected by edges. Can be directed or undirected, weighted or unweighted.",
    examples: ["Social networks", "Road maps", "Dependency graphs"],
    relatedTerms: ["cn4", "cn6", "cn7"],
  },
  cn6: {
    term: "BFS / DFS",
    definition:
      "Graph traversal algorithms. BFS (Breadth-First Search) explores level by level. DFS (Depth-First Search) explores as deep as possible before backtracking.",
    examples: [
      "Finding shortest path in unweighted graph (BFS)",
      "Topological sorting (DFS)",
      "Cycle detection",
    ],
    relatedTerms: ["cn5", "cn7", "cn8"],
  },
  cn7: {
    term: "Shortest Path",
    definition:
      "Algorithms to find the minimum-cost path between vertices in a graph. Dijkstra's works for non-negative weights, Bellman-Ford handles negative weights.",
    examples: ["GPS navigation", "Network routing", "Game AI pathfinding"],
    relatedTerms: ["cn5", "cn6"],
  },
  cn8: {
    term: "Dynamic Programming",
    definition:
      "An algorithmic paradigm that solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation.",
    examples: [
      "Fibonacci sequence",
      "Knapsack problem",
      "Longest common subsequence",
    ],
    relatedTerms: ["cn6"],
  },
  cn9: {
    term: "Vectors",
    definition:
      "Mathematical objects with magnitude and direction. In linear algebra, vectors are elements of vector spaces with operations like addition and scalar multiplication.",
    examples: ["Position vectors", "Velocity vectors", "Column/row vectors"],
    relatedTerms: ["cn10"],
  },
  cn10: {
    term: "Matrices",
    definition:
      "Two-dimensional arrays of numbers arranged in rows and columns. Used for linear transformations, systems of equations, and data representation.",
    examples: ["Rotation matrices", "Identity matrix", "Adjacency matrices"],
    relatedTerms: ["cn9", "cn11"],
  },
  cn11: {
    term: "Determinants",
    definition:
      "A scalar value computed from a square matrix that indicates if the matrix is invertible and represents the scaling factor of the linear transformation.",
    examples: [
      "det(A) = ad - bc for 2x2",
      "Checking invertibility",
      "Computing cross products",
    ],
    relatedTerms: ["cn10"],
  },
};
*/

// History item interfaces (match API response)
interface SummaryHistoryItem {
  id: string;
  course_name: string;
  filename: string;
  summary: string;
  total_pages: number;
  created_at: string;
}

interface KeywordsHistoryItem {
  id: string;
  course_name: string;
  filename: string;
  keywords: string[];
  total_pages: number;
  created_at: string;
}

interface ConceptMapHistoryItem {
  id: string;
  course_name: string;
  filename: string;
  concept_map_data: string;
  total_pages: number;
  created_at: string;
}

// Define node and link interfaces for dynamic visualization
interface ConceptNode {
  id: string;
  name: string;
  courseId: string;
  mastery: number;
  x: number;
  y: number;
  dependencies: string[];
  description: string;
  isGap: boolean;
}

interface ConceptLink {
  source: string;
  target: string;
  strength: number;
}

export const ConceptMapPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>("backend-generated");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [connectionPath, setConnectionPath] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);

  // Summary section state
  const [summaryCourseName, setSummaryCourseName] = useState("");
  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResponse | null>(null);
  const [summaryHistory, setSummaryHistory] = useState<SummaryHistoryItem[]>([]);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [selectedSummaryHistory, setSelectedSummaryHistory] = useState<SummaryHistoryItem | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Keywords section state
  const [keywordsCourseName, setKeywordsCourseName] = useState("");
  const [keywordsFile, setKeywordsFile] = useState<File | null>(null);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [keywordsResult, setKeywordsResult] = useState<KeywordsResponse | null>(null);
  const [keywordsHistory, setKeywordsHistory] = useState<KeywordsHistoryItem[]>([]);
  const [keywordsExpanded, setKeywordsExpanded] = useState(true);
  const [selectedKeywordsHistory, setSelectedKeywordsHistory] = useState<KeywordsHistoryItem | null>(null);
  const [keywordsError, setKeywordsError] = useState<string | null>(null);

  // Concept Map section state
  const [conceptMapCourseName, setConceptMapCourseName] = useState("");
  const [conceptMapFile, setConceptMapFile] = useState<File | null>(null);
  const [conceptMapLoading, setConceptMapLoading] = useState(false);
  const [conceptMapResult, setConceptMapResult] = useState<ConceptMapResponse | null>(null);
  const [conceptMapHistory, setConceptMapHistory] = useState<ConceptMapHistoryItem[]>([]);
  const [conceptMapExpanded, setConceptMapExpanded] = useState(true);
  const [selectedConceptMapHistory, setSelectedConceptMapHistory] = useState<ConceptMapHistoryItem | null>(null);
  const [conceptMapError, setConceptMapError] = useState<string | null>(null);
  const [dynamicTerminologyData, setDynamicTerminologyData] = useState<Record<string, TermDefinition> | null>(null);

  // Load history from MongoDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [summaries, keywords, conceptMaps] = await Promise.all([
          getSummaries(),
          getKeywords(),
          getConceptMaps(),
        ]);
        setSummaryHistory(summaries as unknown as SummaryHistoryItem[]);
        setKeywordsHistory(keywords as unknown as KeywordsHistoryItem[]);
        setConceptMapHistory(conceptMaps as unknown as ConceptMapHistoryItem[]);
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    };
    loadHistory();
  }, []);

  // Handle summary file upload and generation
  const handleSummarySubmit = async () => {
    if (!summaryFile || !summaryCourseName.trim()) return;
    
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const result = await summarizeFile(summaryFile, summaryCourseName);
      setSummaryResult(result);
      
      // Add the new result to history (API already saved to MongoDB)
      setSummaryHistory((prev) => [result as unknown as SummaryHistoryItem, ...prev]);
      
      // Reset form
      setSummaryCourseName("");
      setSummaryFile(null);
    } catch (error: any) {
      console.error("Failed to generate summary:", error);
      setSummaryError(error?.response?.data?.detail || error?.message || "Failed to generate summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle keywords file upload and extraction
  const handleKeywordsSubmit = async () => {
    if (!keywordsFile || !keywordsCourseName.trim()) return;
    
    setKeywordsLoading(true);
    setKeywordsError(null);
    try {
      const result = await extractKeywordsFromFile(keywordsFile, keywordsCourseName);
      setKeywordsResult(result);
      
      // Add the new result to history (API already saved to MongoDB)
      setKeywordsHistory((prev) => [result as unknown as KeywordsHistoryItem, ...prev]);
      
      // Reset form
      setKeywordsCourseName("");
      setKeywordsFile(null);
    } catch (error: any) {
      console.error("Failed to extract keywords:", error);
      setKeywordsError(error?.response?.data?.detail || error?.message || "Failed to extract keywords. Please try again.");
    } finally {
      setKeywordsLoading(false);
    }
  };

  // Handle deleting a summary
  const handleDeleteSummary = async (id: string) => {
    try {
      await deleteSummary(id);
      setSummaryHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedSummaryHistory?.id === id) {
        setSelectedSummaryHistory(null);
      }
    } catch (error) {
      console.error("Failed to delete summary:", error);
    }
  };

  // Handle deleting keywords
  const handleDeleteKeywords = async (id: string) => {
    try {
      await deleteKeywordsRecord(id);
      setKeywordsHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedKeywordsHistory?.id === id) {
        setSelectedKeywordsHistory(null);
      }
    } catch (error) {
      console.error("Failed to delete keywords:", error);
    }
  };

  // Handle concept map file upload and generation
  const handleConceptMapSubmit = async () => {
    if (!conceptMapFile || !conceptMapCourseName.trim()) return;
    
    setConceptMapLoading(true);
    setConceptMapError(null);
    try {
      console.log("Uploading file for concept map generation...");
      const result = await generateConceptMapFromFile(conceptMapFile, conceptMapCourseName);
      console.log("Received concept map result:", result);
      setConceptMapResult(result);
      
      // Parse the concept_map_data and set it as dynamic terminology
      console.log("Parsing concept map data...");
      const parsed = parseConceptMapData(result.concept_map_data);
      console.log("Parsed data has", Object.keys(parsed).length, "concepts");
      setDynamicTerminologyData(parsed);
      
      // Add the new result to history (API already saved to MongoDB)
      setConceptMapHistory((prev) => [result as unknown as ConceptMapHistoryItem, ...prev]);
      
      // Reset form
      setConceptMapCourseName("");
      setConceptMapFile(null);
    } catch (error: any) {
      console.error("Failed to generate concept map:", error);
      setConceptMapError(error?.response?.data?.detail || error?.message || "Failed to generate concept map. Please try again.");
    } finally {
      setConceptMapLoading(false);
    }
  };

  // Handle deleting a concept map
  const handleDeleteConceptMap = async (id: string) => {
    try {
      await deleteConceptMap(id);
      setConceptMapHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedConceptMapHistory?.id === id) {
        setSelectedConceptMapHistory(null);
        setDynamicTerminologyData(null);
      }
    } catch (error) {
      console.error("Failed to delete concept map:", error);
    }
  };

  // Load a concept map from history
  const handleLoadConceptMap = (item: ConceptMapHistoryItem) => {
    setSelectedConceptMapHistory(item);
    const parsed = parseConceptMapData(item.concept_map_data);
    setDynamicTerminologyData(parsed);
  };

  // Parse JavaScript object literal into TermDefinition format
  const parseConceptMapData = (data: string): Record<string, TermDefinition> => {
    try {
      console.log("Raw concept map data:", data.substring(0, 200));
      
      // Remove markdown code fences if present
      let cleanData = data.trim();
      if (cleanData.startsWith("```")) {
        cleanData = cleanData.replace(/```[a-z]*\n?/g, '').replace(/```$/g, '').trim();
      }
      
      // The AI returns a JavaScript object literal without outer braces
      // e.g., "cn1: {...}, cn2: {...}"
      const jsonString = `{${cleanData}}`;
      console.log("Attempting to parse:", jsonString.substring(0, 200));
      
      const parsed = eval(`(${jsonString})`);
      console.log("Successfully parsed concept map with keys:", Object.keys(parsed));
      return parsed;
    } catch (error) {
      console.error("Failed to parse concept map data:", error);
      console.error("Raw data was:", data);
      return {};
    }
  };

  // Generate nodes and links dynamically from backend terminology data
  const { nodes, links } = useMemo(() => {
    if (!dynamicTerminologyData || Object.keys(dynamicTerminologyData).length === 0) {
      return { nodes: [], links: [] };
    }

    const termIds = Object.keys(dynamicTerminologyData);
    const generatedNodes: ConceptNode[] = [];
    const generatedLinks: ConceptLink[] = [];

    // Generate nodes with auto-positioned coordinates in a circular layout
    const centerX = 500;
    const centerY = 190;
    const radius = 300;
    const angleStep = (2 * Math.PI) / termIds.length;

    termIds.forEach((id, index) => {
      const term = dynamicTerminologyData[id];
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle) - 50; // Offset for node width
      const y = centerY + radius * Math.sin(angle) - 30; // Offset for node height

      generatedNodes.push({
        id,
        name: term.term,
        courseId: selectedCourse,
        mastery: 50, // Default mastery for backend-generated nodes
        x,
        y,
        dependencies: term.relatedTerms || [],
        description: term.definition.substring(0, 100) + "...",
        isGap: false,
      });

      // Generate links from relatedTerms
      if (term.relatedTerms) {
        term.relatedTerms.forEach((relatedId) => {
          if (termIds.includes(relatedId)) {
            generatedLinks.push({
              source: id,
              target: relatedId,
              strength: 0.7,
            });
          }
        });
      }
    });

    return { nodes: generatedNodes, links: generatedLinks };
  }, [dynamicTerminologyData, selectedCourse]);

  // Calculate bounds for dynamic SVG sizing
  const bounds = useMemo(() => {
    if (!nodes.length) return { w: 1000, h: 600, offsetX: 0, offsetY: 0 };

    const padding = 80;
    const nodeWidth = 100;
    const nodeHeight = 60;

    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + nodeWidth));
    const maxY = Math.max(...nodes.map(n => n.y + nodeHeight));

    return {
      offsetX: -minX + padding,
      offsetY: -minY + padding,
      w: (maxX - minX) + padding * 2,
      h: (maxY - minY) + padding * 2,
    };
  }, [nodes]);

  // Use ONLY backend-generated dynamic terminology data
  const activeTerminologyData = dynamicTerminologyData || {};
  console.log("Active terminology data:", activeTerminologyData);
  console.log("Number of concepts loaded:", Object.keys(activeTerminologyData).length);
  console.log("Generated nodes:", nodes.length);
  console.log("Generated links:", links.length);

  const selectedNodeData = selectedNode
    ? nodes.find((n) => n.id === selectedNode)
    : null;

  // Handle terminology click - show definition and add to path
  const handleTermClick = useCallback(
    (nodeId: string) => {
      if (expandedTerm === nodeId) {
        // If clicking same term, close it
        setExpandedTerm(null);
      } else {
        setExpandedTerm(nodeId);
        // Add to connection path for visual trail
        if (!connectionPath.includes(nodeId)) {
          setConnectionPath((prev) => [...prev, nodeId]);
        }
      }
      setSelectedNode(nodeId);
    },
    [expandedTerm, connectionPath],
  );

  // Navigate to related term
  const navigateToRelated = useCallback(
    (nodeId: string) => {
      setExpandedTerm(nodeId);
      setSelectedNode(nodeId);
      if (!connectionPath.includes(nodeId)) {
        setConnectionPath((prev) => [...prev, nodeId]);
      }
    },
    [connectionPath],
  );

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

        {/* Course info display and zoom controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {conceptMapResult && (
              <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/60 rounded-xl px-4 py-2 border border-white/50 shadow-lg">
                <BookOpen className="w-4 h-4 text-[#5c2d91]" />
                <span className="text-sm font-semibold text-neutral-800">
                  {conceptMapResult.course_name}
                </span>
                <span className="text-xs text-neutral-500">({conceptMapResult.total_pages} pages)</span>
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/80 p-2 rounded-xl border border-white/50 shadow-lg">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 20))}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5 text-neutral-400" />
              </button>
              <span className="text-[12px] font-bold text-neutral-600 min-w-[3rem] text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 20))}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
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
                  {conceptMapResult?.course_name || "Concept Map"} · Interactive Terminology Map
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-neutral-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />{" "}
                  Mastered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />{" "}
                  Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />{" "}
                  Learning
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-dashed border-red-500 inline-block" />{" "}
                  Gap
                </span>
              </div>
            </div>

            <div className="relative rounded-lg bg-gradient-to-br from-neutral-50 to-white border border-neutral-100">
              {nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5c2d91]/10 to-[#0078d4]/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-[#5c2d91]/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Concept Map Loaded</h3>
                  <p className="text-sm text-neutral-500 text-center max-w-md">
                    Upload a PDF or PPTX file below to generate an AI-powered concept map with interactive terminology definitions.
                  </p>
                </div>
              ) : (
                <div
                  className="overflow-auto"
                  style={{ 
                    width: "100%",
                    height: "600px"
                  }}
                >
                <div style={{ 
                  width: `${bounds.w * (zoom / 100)}px`,
                  height: `${bounds.h * (zoom / 100)}px`,
                  position: 'relative'
                }}>
                <div style={{ 
                  transform: `scale(${zoom / 100})`, 
                  transformOrigin: 'top left', 
                  transition: 'transform 0.3s ease',
                  width: `${bounds.w}px`,
                  height: `${bounds.h}px`,
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}>
                <svg
                  width={bounds.w}
                  height={bounds.h}
                  viewBox={`0 0 ${bounds.w} ${bounds.h}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Animated connection path overlay */}
                  {activeConnections.map((conn, idx) => {
                    const source = nodes.find((n) => n.id === conn.source);
                    const target = nodes.find((n) => n.id === conn.target);
                    if (!source || !target) return null;
                    return (
                      <line
                        key={`path-${idx}`}
                        x1={source.x + 50 + bounds.offsetX}
                        y1={source.y + 30 + bounds.offsetY}
                        x2={target.x + 50 + bounds.offsetX}
                        y2={target.y + 30 + bounds.offsetY}
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
                    <linearGradient
                      id="pathGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#5c2d91" />
                      <stop offset="100%" stopColor="#50e6ff" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Regular Links */}
                  {links.map((link) => {
                    const source = nodes.find((n) => n.id === link.source);
                    const target = nodes.find((n) => n.id === link.target);
                    if (!source || !target) return null;
                    const isHovered =
                      hoveredNode === link.source ||
                      hoveredNode === link.target;
                    const isInPath =
                      connectionPath.includes(link.source) &&
                      connectionPath.includes(link.target);
                    return (
                      <line
                        key={`${link.source}-${link.target}`}
                        x1={source.x + 50 + bounds.offsetX}
                        y1={source.y + 30 + bounds.offsetY}
                        x2={target.x + 50 + bounds.offsetX}
                        y2={target.y + 30 + bounds.offsetY}
                        stroke={
                          isInPath
                            ? "#5c2d91"
                            : isHovered
                              ? "#0078d4"
                              : "#e5e5e5"
                        }
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
                    const termData = activeTerminologyData[node.id];

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
                          x={node.x + bounds.offsetX}
                          y={node.y + bounds.offsetY}
                          width={100}
                          height={60}
                          rx={12}
                          fill={
                            isExpanded
                              ? "url(#pathGradient)"
                              : isSelected
                                ? color
                                : "white"
                          }
                          stroke={
                            isInPath
                              ? "#5c2d91"
                              : isSelected
                                ? color
                                : isHovered
                                  ? color
                                  : "#e5e5e5"
                          }
                          strokeWidth={
                            isExpanded
                              ? 3
                              : isSelected || isInPath
                                ? 2
                                : node.isGap
                                  ? 1.5
                                  : 1
                          }
                          strokeDasharray={
                            node.isGap && !isExpanded ? "4 3" : "none"
                          }
                          className="transition-all duration-300"
                        />

                        {/* Term name */}
                        <text
                          x={node.x + 50 + bounds.offsetX}
                          y={node.y + 24 + bounds.offsetY}
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
                          x={node.x + 50 + bounds.offsetX}
                          y={node.y + 40 + bounds.offsetY}
                          textAnchor="middle"
                          className="text-[9px] pointer-events-none"
                          fill={
                            isExpanded || isSelected
                              ? "rgba(255,255,255,0.9)"
                              : "#a3a3a3"
                          }
                        >
                          {node.mastery > 0
                            ? `${node.mastery}% mastery`
                            : "Not started"}
                        </text>

                        {/* Click hint */}
                        <text
                          x={node.x + 50 + bounds.offsetX}
                          y={node.y + 52 + bounds.offsetY}
                          textAnchor="middle"
                          className="text-[8px] pointer-events-none"
                          fill={
                            isExpanded || isSelected
                              ? "rgba(255,255,255,0.7)"
                              : isHovered
                                ? "#0078d4"
                                : "transparent"
                          }
                        >
                          {isHovered && !isExpanded ? "Click to explore →" : ""}
                        </text>

                        {/* Gap indicator */}
                        {node.isGap && (
                          <circle
                            cx={node.x + 92 + bounds.offsetX}
                            cy={node.y + 8 + bounds.offsetY}
                            r={5}
                            fill="#dc2626"
                          />
                        )}

                        {/* Path indicator */}
                        {isInPath && !isExpanded && (
                          <circle
                            cx={node.x + 8 + bounds.offsetX}
                            cy={node.y + 8 + bounds.offsetY}
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
                </div>
              )}
            </div>

            {/* Expanded Definition Panel (NotebookLM style) */}
            {expandedTerm && activeTerminologyData[expandedTerm] && (
              <div className="mt-4 p-5 bg-gradient-to-br from-[#5c2d91]/5 to-[#0078d4]/5 rounded-xl border border-[#5c2d91]/20 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#0078d4] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-800">
                      {activeTerminologyData[expandedTerm].term}
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
                  {activeTerminologyData[expandedTerm].definition}
                </p>

                {activeTerminologyData[expandedTerm].examples && (
                  <div className="mb-4">
                    <p className="text-[12px] font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                      Examples
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeTerminologyData[expandedTerm].examples?.map(
                        (ex, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white/80 rounded-lg text-[12px] text-neutral-600 border border-neutral-200"
                          >
                            {ex}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Related Terms - NotebookLM style navigation */}
                {activeTerminologyData[expandedTerm].relatedTerms.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-neutral-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Continue Learning
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeTerminologyData[expandedTerm].relatedTerms.map(
                        (relId) => {
                          const relNode = nodes.find((n) => n.id === relId);
                          const relTerm = activeTerminologyData[relId];
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
                              {isVisited && (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              {relTerm.term}
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate New Concept Map */}
            <div className="mt-5 pt-5 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#16a34a]" />
                  <h3 className="text-sm font-semibold text-neutral-800">Generate Concept Map from File</h3>
                </div>
                <button
                  onClick={() => setConceptMapExpanded(!conceptMapExpanded)}
                  className="text-xs text-neutral-500 hover:text-[#16a34a] transition-colors"
                >
                  {conceptMapExpanded ? "Hide" : "Show"}
                </button>
              </div>

              {conceptMapExpanded && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={conceptMapCourseName}
                      onChange={(e) => setConceptMapCourseName(e.target.value)}
                      placeholder="Course name (e.g., Data Structures)"
                      className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#16a34a]"
                    />
                    <input
                      type="file"
                      accept=".pdf,.pptx"
                      onChange={(e) => setConceptMapFile(e.target.files?.[0] || null)}
                      className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#16a34a]/10 file:text-[#16a34a] file:font-medium hover:file:bg-[#16a34a]/20 file:cursor-pointer"
                    />
                  </div>
                  
                  <button
                    onClick={handleConceptMapSubmit}
                    disabled={!conceptMapFile || !conceptMapCourseName.trim() || conceptMapLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#16a34a] to-[#86efac] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                  >
                    {conceptMapLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Terminology Map
                      </>
                    )}
                  </button>

                  {conceptMapError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Error</p>
                        <p className="text-xs text-red-600">{conceptMapError}</p>
                      </div>
                      <button onClick={() => setConceptMapError(null)} className="p-1 hover:bg-red-100 rounded transition-colors">
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  )}

                  {conceptMapResult && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Generated concept map for <strong>{conceptMapResult.course_name}</strong> ({conceptMapResult.total_pages} pages)
                      </p>
                    </div>
                  )}

                  {conceptMapHistory.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                        Previously Generated Maps
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {conceptMapHistory.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleLoadConceptMap(item)}
                            className={`p-2 rounded-lg border text-left transition-all hover:shadow-sm ${
                              selectedConceptMapHistory?.id === item.id
                                ? "border-[#16a34a] bg-[#16a34a]/5"
                                : "border-neutral-200 hover:border-[#16a34a]/50"
                            }`}
                          >
                            <p className="text-xs font-medium text-neutral-800 truncate">{item.course_name}</p>
                            <p className="text-[10px] text-neutral-400">{new Date(item.created_at).toLocaleDateString()}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {selectedNodeData ? (
              <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: getMasteryColor(
                        selectedNodeData.mastery,
                      ),
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
                  Click on any concept to see its definition, examples, and
                  navigate to related topics like NotebookLM.
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
                    const node = nodes.find((n) => n.id === nodeId);
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

            {/* Concept Map Stats - Only show when data is loaded */}
            {nodes.length > 0 && (
              <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-4 shadow-lg">
                <h3 className="text-[13px] font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center">
                    <Info className="w-3.5 h-3.5 text-white" />
                  </div>
                  Concept Map Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Total Concepts:</span>
                    <span className="font-semibold text-neutral-700">{nodes.length}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Connections:</span>
                    <span className="font-semibold text-neutral-700">{links.length}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Explored:</span>
                    <span className="font-semibold text-neutral-700">{connectionPath.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-neutral-800">Document Summary</h2>
                <p className="text-sm text-neutral-500">Upload a PDF to generate an AI summary</p>
              </div>
            </div>
            {summaryExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          {summaryExpanded && (
            <div className="space-y-4">
              {/* Upload Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={summaryCourseName}
                    onChange={(e) => setSummaryCourseName(e.target.value)}
                    placeholder="e.g., Data Structures"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30 focus:border-[#0078d4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    PDF File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.pptx"
                      onChange={(e) => setSummaryFile(e.target.files?.[0] || null)}
                      className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0078d4]/10 file:text-[#0078d4] file:font-medium hover:file:bg-[#0078d4]/20 file:cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSummarySubmit}
                disabled={!summaryFile || !summaryCourseName.trim() || summaryLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
              >
                {summaryLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </button>

              {/* Error Display */}
              {summaryError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-xs text-red-600">{summaryError}</p>
                  </div>
                  <button
                    onClick={() => setSummaryError(null)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}

              {/* Current Result */}
              {summaryResult && !selectedSummaryHistory && (
                <div className="p-4 bg-gradient-to-br from-[#0078d4]/5 to-[#50e6ff]/5 rounded-xl border border-[#0078d4]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-neutral-800">
                      {summaryResult.course_name}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({summaryResult.total_pages} pages)
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {summaryResult.summary}
                  </p>
                </div>
              )}

              {/* Selected History Item */}
              {selectedSummaryHistory && (
                <div className="p-4 bg-gradient-to-br from-[#0078d4]/5 to-[#50e6ff]/5 rounded-xl border border-[#0078d4]/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0078d4]" />
                      <span className="text-sm font-semibold text-neutral-800">
                        {selectedSummaryHistory.course_name}
                      </span>
                      <span className="text-xs text-neutral-400">
                        ({selectedSummaryHistory.total_pages} pages)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteSummary(selectedSummaryHistory.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete this summary"
                      >
                        <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                      </button>
                      <button
                        onClick={() => setSelectedSummaryHistory(null)}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">
                    {new Date(selectedSummaryHistory.created_at).toLocaleDateString()} · {selectedSummaryHistory.filename}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {selectedSummaryHistory.summary}
                  </p>
                </div>
              )}

              {/* History */}
              {summaryHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Previous Summaries
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {summaryHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border text-left transition-all hover:shadow-md relative group ${
                          selectedSummaryHistory?.id === item.id
                            ? "border-[#0078d4] bg-[#0078d4]/5"
                            : "border-neutral-200 hover:border-[#0078d4]/50"
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedSummaryHistory(item);
                            setSummaryResult(null);
                          }}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-neutral-800 truncate pr-6">
                            {item.course_name}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">
                            {item.filename}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSummary(item.id);
                          }}
                          className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Keywords Extraction Section */}
        <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 p-5 shadow-lg">
          <button
            onClick={() => setKeywordsExpanded(!keywordsExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#b4a0ff] flex items-center justify-center shadow-md">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-neutral-800">Extract Keywords</h2>
                <p className="text-sm text-neutral-500">Upload a PDF to extract key concepts</p>
              </div>
            </div>
            {keywordsExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          {keywordsExpanded && (
            <div className="space-y-4">
              {/* Upload Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={keywordsCourseName}
                    onChange={(e) => setKeywordsCourseName(e.target.value)}
                    placeholder="e.g., Linear Algebra"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c2d91]/30 focus:border-[#5c2d91]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    PDF File
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.pptx"
                      onChange={(e) => setKeywordsFile(e.target.files?.[0] || null)}
                      className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#5c2d91]/10 file:text-[#5c2d91] file:font-medium hover:file:bg-[#5c2d91]/20 file:cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleKeywordsSubmit}
                disabled={!keywordsFile || !keywordsCourseName.trim() || keywordsLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#5c2d91] to-[#b4a0ff] text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
              >
                {keywordsLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Extracting Keywords...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Extract Keywords
                  </>
                )}
              </button>

              {/* Error Display */}
              {keywordsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-xs text-red-600">{keywordsError}</p>
                  </div>
                  <button
                    onClick={() => setKeywordsError(null)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}

              {/* Current Result */}
              {keywordsResult && !selectedKeywordsHistory && (
                <div className="p-4 bg-gradient-to-br from-[#5c2d91]/5 to-[#b4a0ff]/5 rounded-xl border border-[#5c2d91]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-neutral-800">
                      {keywordsResult.course_name}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({keywordsResult.total_pages} pages)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywordsResult.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm text-[#5c2d91] border border-[#5c2d91]/20 font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected History Item */}
              {selectedKeywordsHistory && (
                <div className="p-4 bg-gradient-to-br from-[#5c2d91]/5 to-[#b4a0ff]/5 rounded-xl border border-[#5c2d91]/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5c2d91]" />
                      <span className="text-sm font-semibold text-neutral-800">
                        {selectedKeywordsHistory.course_name}
                      </span>
                      <span className="text-xs text-neutral-400">
                        ({selectedKeywordsHistory.total_pages} pages)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteKeywords(selectedKeywordsHistory.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete this extraction"
                      >
                        <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                      </button>
                      <button
                        onClick={() => setSelectedKeywordsHistory(null)}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mb-3">
                    {new Date(selectedKeywordsHistory.created_at).toLocaleDateString()} · {selectedKeywordsHistory.filename}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedKeywordsHistory.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm text-[#5c2d91] border border-[#5c2d91]/20 font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* History */}
              {keywordsHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Previous Extractions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {keywordsHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border text-left transition-all hover:shadow-md relative group ${
                          selectedKeywordsHistory?.id === item.id
                            ? "border-[#5c2d91] bg-[#5c2d91]/5"
                            : "border-neutral-200 hover:border-[#5c2d91]/50"
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedKeywordsHistory(item);
                            setKeywordsResult(null);
                          }}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-neutral-800 truncate pr-6">
                            {item.course_name}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">
                            {item.filename}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            {item.keywords.length} keywords · {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteKeywords(item.id);
                          }}
                          className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};