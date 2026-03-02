// ─── LearnLens Types ───

export type CheckpointType =
  | "quiz"
  | "midterm"
  | "final"
  | "assignment"
  | "project";
export type CheckpointStatus =
  | "completed"
  | "in-progress"
  | "upcoming"
  | "locked";
export type SubmissionStatus =
  | "submitted"
  | "in-progress"
  | "pending"
  | "overdue";
export type CourseStatus = "active" | "completed" | "upcoming";

export interface CourseOutlineComponent {
  name: string;
  weight: number;
  count?: number;
  description: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  progress: number;
  currentWeek: number;
  totalWeeks: number;
  grade: string;
  credits: number;
  instructor: string;
  topics: CourseTopic[];
  checkpoints: Checkpoint[];
  assignments: Assignment[];
  schedule: string;
  status: CourseStatus;
  courseOutline: CourseOutlineComponent[];
}

export interface CourseTopic {
  id: string;
  name: string;
  weekNumber: number;
  completed: boolean;
  mastery: number;
  estimatedHours: number;
  dependencies: string[];
  description: string;
}

export interface Checkpoint {
  id: string;
  courseId: string;
  name: string;
  type: CheckpointType;
  weekNumber: number;
  date: string;
  status: CheckpointStatus;
  score?: number;
  maxScore: number;
  weight: number;
  topics: string[];
  estimatedPrepTime: number;
  description: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: SubmissionStatus;
  type: "essay" | "problem-set" | "project" | "presentation" | "lab";
  fileType: "docx" | "pptx" | "pdf" | "code";
  score?: number;
  maxScore: number;
  weight: number;
  topics: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "open-ended" | "true-false";
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizResult {
  id: string;
  courseId: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  topics: string[];
  weakAreas: string[];
  timeSpent: number;
}

export interface ConceptNode {
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

export interface ConceptLink {
  source: string;
  target: string;
  strength: number;
}

export interface StudySession {
  date: string;
  hours: number;
  course: string;
}

export interface PerformanceMetric {
  week: number;
  gpa: number;
  studyHours: number;
  assignmentsCompleted: number;
  quizAverage: number;
}

export interface CopilotSuggestion {
  id: string;
  type: "study" | "reminder" | "insight" | "warning" | "tip";
  title: string;
  body: string;
  priority: number;
  courseId?: string;
  actionLabel?: string;
  actionPage?: string;
}

export interface SemesterInfo {
  name: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  gpa: number;
  totalCredits: number;
  completedCredits: number;
}

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
  icon: string;
  color: string;
  systemPrompt?: string;
}

export interface VisionAnalysis {
  id: string;
  imageUrl: string;
  analysis: string;
  timestamp: Date;
  topics: string[];
}

export interface BlameEntry {
  id: string;
  lineStart: number;
  lineEnd: number;
  content: string;
  author: string;
  date: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

// ─── Git-Style Learning Types ───

export interface Topic {
  id: string;
  name: string;
  color: string;
  mastery: number;
  masteryLevel: "beginner" | "learning" | "proficient" | "mastered";
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
  type: "study" | "practice" | "review" | "assessment";
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
  status: "active" | "merged" | "stale";
  createdDate: string;
  lastCommitDate: string;
  commits: string[];
  parentBranch: string;
  aheadOfMain: number;
  mergeReady: boolean;
  aiMergeSuggestion?: string;
}

export interface AIReview {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  readyToMerge: boolean;
  confidence: number;
}

export interface PullRequest {
  id: string;
  title: string;
  description: string;
  branch: string;
  targetBranch: string;
  status: "open" | "merged" | "closed";
  createdDate: string;
  mergedDate?: string;
  commits: string[];
  score: number;
  aiReview: AIReview;
  checksPass: boolean;
  labels: string[];
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
