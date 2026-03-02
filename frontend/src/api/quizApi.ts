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
): Promise<GradeResult> {
  const res = await apiClient.post("/ai/quiz/grade", {
    quiz_questions: quizQuestions,
    student_answers: studentAnswers,
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
export async function generateImprovementQuiz(): Promise<QuizResponse> {
  const res = await apiClient.post("/ai/improve/generate-test");
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

// ─── File-based Summary and Keyword Extraction ───────────────────────────────

export interface SummaryResponse {
  id: string;
  filename: string;
  course_name: string;
  total_pages: number;
  summary: string;
  created_at: string;
}

export interface KeywordsResponse {
  id: string;
  filename: string;
  course_name: string;
  total_pages: number;
  keywords: string[];
  created_at: string;
}

/**
 * Upload a file and generate a summary (saved to MongoDB)
 */
export async function summarizeFile(
  file: File,
  courseName: string,
): Promise<SummaryResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("course_name", courseName);

  const res = await apiClient.post("/ai/files/summarize", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 minutes for file processing
  });
  return res.data;
}

/**
 * Get all saved summaries
 */
export async function getSummaries(): Promise<SummaryResponse[]> {
  const res = await apiClient.get("/ai/files/summaries");
  return res.data;
}

/**
 * Get a specific summary by ID
 */
export async function getSummaryById(id: string): Promise<SummaryResponse> {
  const res = await apiClient.get(`/ai/files/summaries/${id}`);
  return res.data;
}

/**
 * Delete a summary by ID
 */
export async function deleteSummary(id: string): Promise<void> {
  await apiClient.delete(`/ai/files/summaries/${id}`);
}

/**
 * Upload a file and extract keywords (saved to MongoDB)
 */
export async function extractKeywordsFromFile(
  file: File,
  courseName: string,
): Promise<KeywordsResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("course_name", courseName);

  const res = await apiClient.post("/ai/files/extract-keywords", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 minutes for file processing
  });
  return res.data;
}

/**
 * Get all saved keywords records
 */
export async function getKeywords(): Promise<KeywordsResponse[]> {
  const res = await apiClient.get("/ai/files/keywords");
  return res.data;
}

/**
 * Get a specific keywords record by ID
 */
export async function getKeywordsById(id: string): Promise<KeywordsResponse> {
  const res = await apiClient.get(`/ai/files/keywords/${id}`);
  return res.data;
}

/**
 * Delete a keywords record by ID
 */
export async function deleteKeywordsRecord(id: string): Promise<void> {
  await apiClient.delete(`/ai/files/keywords/${id}`);
}

// Concept Map types
export interface ConceptMapResponse {
  id: string;
  filename: string;
  course_name: string;
  total_pages: number;
  concept_map_data: string;
  created_at: string;
}

/**
 * Upload a file and generate a concept map (saved to MongoDB)
 */
export async function generateConceptMapFromFile(
  file: File,
  courseName: string,
): Promise<ConceptMapResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("course_name", courseName);

  const res = await apiClient.post("/ai/files/generate-concept-map", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 minutes for file processing
  });
  return res.data;
}

/**
 * Get all saved concept maps
 */
export async function getConceptMaps(): Promise<ConceptMapResponse[]> {
  const res = await apiClient.get("/ai/files/concept-maps");
  return res.data;
}

/**
 * Get a specific concept map by ID
 */
export async function getConceptMapById(id: string): Promise<ConceptMapResponse> {
  const res = await apiClient.get(`/ai/files/concept-maps/${id}`);
  return res.data;
}

/**
 * Delete a concept map by ID
 */
export async function deleteConceptMap(id: string): Promise<void> {
  await apiClient.delete(`/ai/files/concept-maps/${id}`);
}
