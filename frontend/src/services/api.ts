/**
 * API service for backend communication
 * Centralizes all backend API calls
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://coursepilot-qyw8.onrender.com";

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `API error: ${response.status}`,
    );
  }

  return response.json();
}

// ============ Notes API ============

export interface Note {
  id: string;
  content: string;
  subject: string;
  sourceUrl?: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
}

export interface NotesListResponse {
  notes: Note[];
  total: number;
}

export interface NoteCreate {
  content: string;
  subject: string;
  sourceUrl?: string;
  tags?: string[];
}

export const notesApi = {
  list: (subject?: string, search?: string) => {
    const params = new URLSearchParams();
    if (subject && subject !== "all") params.append("subject", subject);
    if (search) params.append("search", search);
    const query = params.toString();
    return apiFetch<NotesListResponse>(`/notes${query ? `?${query}` : ""}`);
  },

  get: (id: string) => apiFetch<Note>(`/notes/${id}`),

  create: (note: NoteCreate) =>
    apiFetch<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(note),
    }),

  update: (id: string, updates: Partial<NoteCreate>) =>
    apiFetch<Note>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/notes/${id}`, {
      method: "DELETE",
    }),
};

// ============ Quiz API ============

export interface SlideContent {
  heading?: string;
  body?: string;
  bullets?: string[];
}

export interface QuizGenerateRequest {
  title?: string;
  topic?: string;
  num_mcq?: number;
}

export interface MCQOption {
  label: string;
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  topic?: string;
  difficulty?: string;
  marks: number;
  options?: MCQOption[];
  explanation?: string;
}

export interface QuizResponse {
  id: string;
  title: string;
  source_file?: string;
  topic?: string;
  total_questions: number;
  total_marks: number;
  estimated_duration_minutes?: number;
  questions: QuizQuestion[];
  topics_covered?: string[];
  created_at?: string;
}

export interface StudentAnswer {
  question_id: string;
  answer: string;
}

export interface GradeResult {
  marks_earned: number;
  marks_available: number;
  score_pct: number;
  total_correct: number;
  total_wrong: number;
  results: Array<{
    question_id: string;
    is_correct: boolean;
    correct_answer: string;
    student_answer: string;
  }>;
}

export const quizApi = {
  generate: (slides: SlideContent[], request: QuizGenerateRequest = {}) =>
    apiFetch<QuizResponse>("/ai/quiz/generate", {
      method: "POST",
      body: JSON.stringify({ slides, request }),
    }),

  grade: (quiz_questions: QuizQuestion[], student_answers: StudentAnswer[]) =>
    apiFetch<GradeResult>("/ai/quiz/grade", {
      method: "POST",
      body: JSON.stringify({ quiz_questions, student_answers }),
    }),

  generateImprovement: () =>
    apiFetch<QuizResponse>("/ai/improve/generate-test", {
      method: "POST",
    }),
};

// ============ AI Tools API ============

export const aiToolsApi = {
  generateSummary: (slides: SlideContent[]) =>
    apiFetch<string>("/ai/tools/summary", {
      method: "POST",
      body: JSON.stringify(slides),
    }),

  extractKeyPoints: (slides: SlideContent[]) =>
    apiFetch<string[]>("/ai/tools/key-points", {
      method: "POST",
      body: JSON.stringify(slides),
    }),

  extractConcepts: (slides: SlideContent[]) =>
    apiFetch<Array<{ term: string; definition: string }>>(
      "/ai/tools/concepts",
      {
        method: "POST",
        body: JSON.stringify(slides),
      },
    ),
};

// ============ Academic API ============

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  status: string;
  course_code: string;
}

export const academicApi = {
  // Courses
  listCourses: () => apiFetch<Course[]>("/academic/courses"),
  getCourse: (code: string) => apiFetch<Course>(`/academic/courses/${code}`),

  // Assignments
  listAssignments: (courseCode: string) =>
    apiFetch<Assignment[]>(
      `/academic/submissions/courses/${courseCode}/assignments`,
    ),

  createAssignment: (courseCode: string, assignment: Partial<Assignment>) =>
    apiFetch<Assignment>(
      `/academic/submissions/courses/${courseCode}/assignments`,
      {
        method: "POST",
        body: JSON.stringify(assignment),
      },
    ),

  updateAssignmentStatus: (assignmentId: number, status: string) =>
    apiFetch(`/academic/submissions/assignments/${assignmentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Progress
  getProgressOverview: () => apiFetch("/academic/progress/overview"),

  getCourseProgress: (courseId: string) =>
    apiFetch(`/academic/progress/courses/${courseId}`),

  getTimeline: () => apiFetch("/academic/progress/timeline"),
};

// ============ Health Check ============

export const healthCheck = () => apiFetch<{ status: string }>("/health");

export default {
  notes: notesApi,
  quiz: quizApi,
  aiTools: aiToolsApi,
  academic: academicApi,
  healthCheck,
};
