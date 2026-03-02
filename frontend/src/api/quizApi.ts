import { apiClient } from "./apiClient";

// Quiz generation types
export interface ParsedSlide {
  number: number;
  heading: string;
  body: string;
  notes?: string;
  tables?: string;
}

export interface ParseResponse {
  filename: string;
  total_slides: number;
  slides: ParsedSlide[];
  content_string: string;
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

export interface ClippyContentResponse {
  filename: string;
  total_pages: number;
  content: string;
  summary_prompt: string;
}

/**
 * Upload and parse a file (PDF/PPTX) for quiz generation
 */
export async function parseFile(file: File): Promise<ParseResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/ai/files/parse", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Generate a quiz directly from an uploaded file
 */
export async function generateQuizFromFile(
  file: File,
  title?: string,
  topic?: string,
  numMcq: number = 5,
): Promise<QuizResponse> {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  if (topic) form.append("topic", topic);
  form.append("num_mcq", String(numMcq));

  const res = await apiClient.post("/ai/files/quiz-from-file", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Generate quiz from already-parsed slides
 */
export async function generateQuiz(
  slides: ParsedSlide[],
  request: { title?: string; topic?: string; num_mcq?: number } = {},
): Promise<QuizResponse> {
  const res = await apiClient.post("/ai/quiz/generate", { slides, request });
  return res.data;
}

/**
 * Grade student answers for a quiz
 */
export async function gradeQuiz(
  quizQuestions: QuizQuestion[],
  studentAnswers: StudentAnswer[],
  options?: {
    quiz_id?: string;
    course_code?: string;
    time_spent_minutes?: number;
    user_id?: string;
  },
): Promise<GradeResult> {
  const res = await apiClient.post("/ai/quiz/grade", {
    quiz_questions: quizQuestions,
    student_answers: studentAnswers,
    quiz_id: options?.quiz_id,
    course_code: options?.course_code,
    time_spent_minutes: options?.time_spent_minutes || 0,
    user_id: options?.user_id || "default",
  });
  return res.data;
}

/**
 * Upload file and get content optimized for Clippy assistant
 */
export async function getContentForClippy(
  file: File,
): Promise<ClippyContentResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/ai/files/content-for-clippy", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Generate improvement quiz based on weak areas
 */
export async function generateImprovementQuiz(
  courseCode?: string,
): Promise<QuizResponse> {
  const params = new URLSearchParams();
  if (courseCode) params.append("course_code", courseCode);
  const res = await apiClient.post(
    `/ai/improve/generate-test?${params.toString()}`,
  );
  return res.data;
}

/**
 * Weak topic structure from backend
 */
export interface WeakTopic {
  topic: string;
  count: number;
  percentage: number;
}

/**
 * Get weak topics based on wrong answers
 */
export async function getWeakTopics(
  userId: string = "default",
  courseCode?: string,
): Promise<{ weak_topics: WeakTopic[]; total_wrong: number }> {
  const params = new URLSearchParams({ user_id: userId });
  if (courseCode) params.append("course_code", courseCode);
  const res = await apiClient.get(
    `/ai/improve/weak-topics?${params.toString()}`,
  );
  return res.data;
}

/**
 * Get wrong questions for a user
 */
export async function getWrongQuestions(
  userId: string = "default",
  courseCode?: string,
): Promise<{ user_id: string; wrong_questions: any[] }> {
  const params = new URLSearchParams({ user_id: userId });
  if (courseCode) params.append("course_code", courseCode);
  const res = await apiClient.get(
    `/ai/improve/wrong-questions?${params.toString()}`,
  );
  return res.data;
}

/**
 * Clear wrong questions for a user
 */
export async function clearWrongQuestions(
  userId: string = "default",
  courseCode?: string,
): Promise<{ message: string }> {
  const params = new URLSearchParams({ user_id: userId });
  if (courseCode) params.append("course_code", courseCode);
  const res = await apiClient.delete(
    `/ai/improve/wrong-questions?${params.toString()}`,
  );
  return res.data;
}

/**
 * Quiz result structure from backend
 */
export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  time_spent_minutes: number;
  course_code?: string;
  topics_covered: string[];
  created_at: string;
}

/**
 * Get quiz results for a user from MongoDB
 */
export async function getQuizResults(
  userId: string = "default",
  limit: number = 10,
): Promise<{ user_id: string; results: QuizResult[] }> {
  const res = await apiClient.get(
    `/ai/improve/quiz-results?user_id=${userId}&limit=${limit}`,
  );
  return res.data;
}

/**
 * Generate summary from slides
 */
export async function generateSummary(slides: ParsedSlide[]): Promise<string> {
  const res = await apiClient.post("/ai/tools/summary", slides);
  return res.data;
}

/**
 * Extract key points from slides
 */
export async function extractKeyPoints(
  slides: ParsedSlide[],
): Promise<string[]> {
  const res = await apiClient.post("/ai/tools/key-points", slides);
  return res.data;
}

/**
 * Extract concepts from slides
 */
export async function extractConcepts(
  slides: ParsedSlide[],
): Promise<Array<{ term: string; definition: string }>> {
  const res = await apiClient.post("/ai/tools/concepts", slides);
  return res.data;
}

// ============ SAVED MATERIALS ============

/**
 * Saved material structure from backend
 */
export interface SavedMaterial {
  id: string;
  filename: string;
  title: string;
  course_code?: string;
  total_slides: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save a material for later quiz generation
 */
export async function saveMaterial(
  file: File,
  courseCode?: string,
  title?: string,
  userId: string = "default",
): Promise<{
  message: string;
  id: string;
  filename: string;
  total_slides: number;
}> {
  const form = new FormData();
  form.append("file", file);
  if (courseCode) form.append("course_code", courseCode);
  if (title) form.append("title", title);
  form.append("user_id", userId);

  const res = await apiClient.post("/ai/files/save-material", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Get all saved materials for a user
 */
export async function getSavedMaterials(
  userId: string = "default",
  courseCode?: string,
): Promise<{ materials: SavedMaterial[] }> {
  const params = new URLSearchParams({ user_id: userId });
  if (courseCode) params.append("course_code", courseCode);
  const res = await apiClient.get(
    `/ai/files/saved-materials?${params.toString()}`,
  );
  return res.data;
}

/**
 * Generate quiz from a saved material
 */
export async function generateQuizFromSavedMaterial(
  materialId: string,
  title?: string,
  topic?: string,
  numMcq: number = 5,
): Promise<QuizResponse> {
  const params = new URLSearchParams();
  if (title) params.append("title", title);
  if (topic) params.append("topic", topic);
  params.append("num_mcq", String(numMcq));

  const res = await apiClient.post(
    `/ai/files/quiz-from-saved/${materialId}?${params.toString()}`,
  );
  return res.data;
}

/**
 * Delete a saved material
 */
export async function deleteSavedMaterial(
  materialId: string,
  userId: string = "default",
): Promise<{ message: string }> {
  const res = await apiClient.delete(
    `/ai/files/saved-materials/${materialId}?user_id=${userId}`,
  );
  return res.data;
}
