// ─── Existing types ───
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface VisionAnalysis {
  description: string;
  objects: string[];
  text?: string;
  confidence?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface AgentTask {
  task: string;
  agentName: string;
  useTools?: boolean;
}

export interface UploadedFile {
  file: File;
  preview: string;
  type: string;
  name: string;
}

// ─── Git-inspired Learning Types ───

export type MasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "mastered";
export type CommitType = "study" | "quiz" | "review" | "practice" | "exam";
export type BranchStatus = "active" | "merged" | "stale";
export type PRStatus = "open" | "merged" | "changes_requested";

export interface Topic {
  id: string;
  name: string;
  color: string;
  mastery: number;
  masteryLevel: MasteryLevel;
  totalCommits: number;
  totalTimeMinutes: number;
}

export interface StudyCommit {
  id: string;
  hash: string;
  topic: string;
  topicName: string;
  branch: string;
  message: string;
  date: string;
  timeSpentMinutes: number;
  scoreImprovement: number;
  scoreBefore: number;
  scoreAfter: number;
  type: CommitType;
  notes: string;
  difficulty: number;
  mistakes: string[];
}

export interface LearningBranch {
  id: string;
  name: string;
  displayName: string;
  topic: string;
  color: string;
  status: BranchStatus;
  createdDate: string;
  lastCommitDate: string;
  commits: string[];
  parentBranch: string;
  aheadOfMain: number;
  mergeReady: boolean;
  aiMergeSuggestion?: string;
}

export interface PullRequest {
  id: string;
  title: string;
  description: string;
  branch: string;
  targetBranch: string;
  status: PRStatus;
  createdDate: string;
  mergedDate?: string;
  commits: string[];
  score: number;
  aiReview: AIReview;
  checksPass: boolean;
  labels: string[];
}

export interface AIReview {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  readyToMerge: boolean;
  confidence: number;
}

export interface BlameEntry {
  id: string;
  line: string;
  commitHash: string;
  topic: string;
  mistake: string;
  frequency: number;
  lastOccurred: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestion: string;
  responsible: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastStudyDate: string;
}
