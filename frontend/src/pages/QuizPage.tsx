import React, { useState, useRef } from "react";
import {
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Target,
  BookOpen,
  Sparkles,
  Trophy,
  Clock,
  Zap,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import {
  courses as mockCourses,
  quizQuestions as mockQuizQuestions,
  quizResults,
} from "@/data/learnLensData";
import { useCoursesBackend } from "@/hooks/useCoursesBackend";
import {
  generateQuizFromFile,
  gradeQuiz,
  type QuizQuestion as BackendQuizQuestion,
  type QuizResponse,
} from "@/api/quizApi";
import type { QuizQuestion } from "@/types";
import { formatDate } from "@/utils/helpers";

// Convert backend question to frontend format
function convertToFrontendQuestion(q: BackendQuizQuestion): QuizQuestion {
  const correctOption = q.options?.find((opt) => opt.is_correct);
  return {
    id: q.id,
    question: q.question,
    type:
      q.type === "mcq"
        ? "multiple-choice"
        : q.type === "true_false"
          ? "true-false"
          : "open-ended",
    options: q.options?.map((opt) => opt.text),
    correctAnswer: correctOption?.text || "",
    explanation: q.explanation || "",
    topic: q.topic || "General",
    difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
  };
}

export const QuizPage: React.FC = () => {
  // Backend courses with fallback
  const { courses: backendCourses } = useCoursesBackend();
  const courses = backendCourses.length > 0 ? backendCourses : mockCourses;

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use mock quiz questions as fallback
  const quizQuestions = mockQuizQuestions;

  const courseQuestions = selectedCourse
    ? quizQuestions.filter((q) =>
        courses
          .find((c) => c.id === selectedCourse)
          ?.topics.some((t) => t.id === q.topic),
      )
    : quizQuestions;

  const startQuiz = (qs: QuizQuestion[]) => {
    setActiveQuiz(qs);
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const finishQuiz = () => setShowResults(true);

  const getScore = () => {
    if (!activeQuiz) return 0;
    let correct = 0;
    activeQuiz.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / activeQuiz.length) * 100);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".pdf", ".pptx"];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(fileExt)) {
      setUploadError("Please upload a PDF or PowerPoint (.pptx) file");
      return;
    }

    setUploadedFile(file);
    setUploadError(null);
    setGeneratedQuiz(null);
  };

  // Clear uploaded file
  const clearFile = () => {
    setUploadedFile(null);
    setGeneratedQuiz(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate quiz from uploaded file
  const handleGenerateQuiz = async () => {
    if (!uploadedFile) return;

    setIsGeneratingQuiz(true);
    setUploadError(null);

    try {
      const quiz = await generateQuizFromFile(
        uploadedFile,
        `Quiz from ${uploadedFile.name}`,
        undefined,
        numQuestions,
      );
      setGeneratedQuiz(quiz);
    } catch (err: any) {
      setUploadError(err.message || "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Start quiz from generated questions
  const startGeneratedQuiz = () => {
    if (!generatedQuiz) return;
    const frontendQuestions = generatedQuiz.questions.map(
      convertToFrontendQuestion,
    );
    startQuiz(frontendQuestions);
  };

  // Background wrapper component
  const PageWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/quiz.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Microsoft-style gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#ff8c00]/10 via-white/90 to-[#0078d4]/10" />

      {/* Content */}
      <div className="relative z-10 py-8 px-4">{children}</div>
    </div>
  );

  // Quiz in progress
  if (activeQuiz && !showResults) {
    const q = activeQuiz[currentQ];
    return (
      <PageWrapper>
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Progress */}
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff8c00] to-[#ffb347] flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-[15px] font-semibold text-neutral-800">
                  Question {currentQ + 1} of {activeQuiz.length}
                </span>
              </div>
              <span className="text-[12px] font-medium text-[#0078d4] bg-[#0078d4]/10 px-3 py-1 rounded-full tabular-nums">
                {Object.keys(answers).length} answered
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff8c00] to-[#0078d4] rounded-full transition-all duration-500"
                style={{
                  width: `${((currentQ + 1) / activeQuiz.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                  q.difficulty === "easy"
                    ? "bg-gradient-to-r from-[#107c10] to-[#00cc6a] text-white"
                    : q.difficulty === "medium"
                      ? "bg-gradient-to-r from-[#ff8c00] to-[#ffb347] text-white"
                      : "bg-gradient-to-r from-[#d83b01] to-[#ff6f61] text-white"
                }`}
              >
                {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
              </span>
              <span className="text-[11px] text-neutral-500 font-medium">
                {q.type.replace("-", " ")}
              </span>
            </div>

            <h3 className="text-[17px] font-semibold text-neutral-800 mb-6 leading-relaxed">
              {q.question}
            </h3>

            {q.type === "open-ended" ? (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                placeholder="Type your answer..."
                rows={4}
                className="w-full px-4 py-3 bg-white/60 border border-[#0078d4]/30 rounded-xl text-[14px] text-neutral-700 placeholder-neutral-400 focus:ring-2 focus:ring-[#0078d4]/30 focus:border-[#0078d4] outline-none resize-none transition-all"
              />
            ) : (
              <div className="space-y-3">
                {q.options?.map((opt, idx) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`w-full text-left px-5 py-4 rounded-xl border text-[14px] transition-all duration-200 flex items-center gap-4 ${
                      answers[q.id] === opt
                        ? "bg-gradient-to-r from-[#0078d4]/10 to-[#50e6ff]/10 border-[#0078d4] text-[#0078d4] font-semibold shadow-md"
                        : "bg-white/60 border-neutral-200 text-neutral-700 hover:bg-white hover:border-[#0078d4]/50 hover:shadow-sm"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                        answers[q.id] === opt
                          ? "bg-gradient-to-br from-[#0078d4] to-[#50e6ff] text-white"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-5 py-2.5 backdrop-blur-md bg-white/60 text-neutral-600 text-[13px] font-medium rounded-xl hover:bg-white transition-all disabled:opacity-30 flex items-center gap-2 border border-white/50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {currentQ < activeQuiz.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white text-[13px] font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finishQuiz}
                className="px-5 py-2.5 bg-gradient-to-r from-[#107c10] to-[#00cc6a] text-white text-[13px] font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                Finish <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Show results
  if (activeQuiz && showResults) {
    const score = getScore();
    const correctCount = activeQuiz.filter(
      (q) => answers[q.id] === q.correctAnswer,
    ).length;
    return (
      <PageWrapper>
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-8 text-center">
            <div
              className={`w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg ${
                score >= 80
                  ? "bg-gradient-to-br from-[#107c10] to-[#00cc6a]"
                  : score >= 60
                    ? "bg-gradient-to-br from-[#ff8c00] to-[#ffb347]"
                    : "bg-gradient-to-br from-[#d83b01] to-[#ff6f61]"
              }`}
            >
              <span className="text-3xl font-bold text-white">{score}%</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0078d4] to-[#5c2d91] bg-clip-text text-transparent">
              Quiz Complete!
            </h2>
            <p className="text-[15px] text-neutral-600 mt-2 flex items-center justify-center gap-2">
              <Trophy
                className={`w-5 h-5 ${score >= 80 ? "text-[#107c10]" : score >= 60 ? "text-[#ff8c00]" : "text-[#d83b01]"}`}
              />
              {correctCount} / {activeQuiz.length} correct answers
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setActiveQuiz(null)}
                className="px-5 py-2.5 backdrop-blur-md bg-white/60 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-xl hover:bg-white transition-all"
              >
                Back to Quizzes
              </button>
              <button
                onClick={() => startQuiz(activeQuiz)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white text-[13px] font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Quiz
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeQuiz.map((q, i) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div
                  key={q.id}
                  className={`backdrop-blur-md rounded-xl border shadow-lg p-5 ${
                    isCorrect
                      ? "bg-[#107c10]/5 border-[#107c10]/30"
                      : "bg-[#d83b01]/5 border-[#d83b01]/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCorrect
                          ? "bg-gradient-to-br from-[#107c10] to-[#00cc6a]"
                          : "bg-gradient-to-br from-[#d83b01] to-[#ff6f61]"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-neutral-800">
                        {i + 1}. {q.question}
                      </p>
                      {!isCorrect && (
                        <p className="text-[12px] text-[#d83b01] mt-2 font-medium">
                          Your answer: {answers[q.id] || "(no answer)"}
                        </p>
                      )}
                      <p className="text-[12px] text-[#107c10] mt-1 font-medium">
                        ✓ Correct: {q.correctAnswer}
                      </p>
                      <p className="text-[12px] text-neutral-500 mt-2 italic bg-white/50 p-3 rounded-lg">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Quiz landing
  return (
    <PageWrapper>
      <div className="space-y-6 max-w-[1080px] mx-auto">
        {/* Header */}
        <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 border border-white/50 shadow-lg inline-block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff8c00] to-[#ffb347] flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff8c00] to-[#0078d4] bg-clip-text text-transparent">
                Quiz Panel
              </h1>
              <p className="text-sm text-neutral-600">
                Practice with quizzes and track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5c2d91] to-[#b4a0ff] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-semibold text-neutral-800">
              Generate Quiz from Materials
            </h2>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="border-2 border-dashed border-[#0078d4]/30 rounded-xl p-8 text-center bg-gradient-to-br from-[#0078d4]/5 to-[#50e6ff]/5 hover:border-[#0078d4]/50 transition-colors">
            {!uploadedFile ? (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0078d4]/20 to-[#50e6ff]/20 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-[#0078d4]" />
                </div>
                <p className="text-[14px] font-medium text-neutral-700">
                  Upload lecture slides, notes, or PDFs
                </p>
                <p className="text-[12px] text-neutral-500 mt-1">
                  AI will generate targeted quizzes from your materials
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-5 py-2 bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white text-[13px] font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Browse Files
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#107c10] to-[#00cc6a] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-semibold text-neutral-800">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[12px] text-neutral-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>

                {/* Number of questions selector */}
                <div className="flex items-center justify-center gap-3">
                  <label className="text-[12px] text-neutral-600 font-medium">
                    Questions:
                  </label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-[13px] text-neutral-700"
                  >
                    {[3, 5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} questions
                      </option>
                    ))}
                  </select>
                </div>

                {uploadError && (
                  <p className="text-[12px] text-red-500 font-medium">
                    {uploadError}
                  </p>
                )}

                {!generatedQuiz ? (
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#5c2d91] to-[#b4a0ff] text-white text-[13px] font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Quiz
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-white/80 rounded-xl border border-[#107c10]/30">
                      <p className="text-[14px] font-semibold text-neutral-800">
                        {generatedQuiz.title}
                      </p>
                      <p className="text-[12px] text-neutral-500 mt-1">
                        {generatedQuiz.total_questions} questions •{" "}
                        {generatedQuiz.total_marks} marks • ~
                        {generatedQuiz.estimated_duration_minutes || 10} min
                      </p>
                      {generatedQuiz.topics_covered &&
                        generatedQuiz.topics_covered.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {generatedQuiz.topics_covered
                              .slice(0, 5)
                              .map((topic, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-[#0078d4]/10 text-[#0078d4] text-[10px] font-medium rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                          </div>
                        )}
                    </div>
                    <button
                      onClick={startGeneratedQuiz}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#107c10] to-[#00cc6a] text-white text-[13px] font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                    >
                      <Play className="w-4 h-4" />
                      Start Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Course filter */}
        <div className="inline-flex items-center gap-1 backdrop-blur-md bg-white/60 rounded-xl p-1.5 border border-white/50 shadow-lg">
          <button
            onClick={() => setSelectedCourse("")}
            className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all ${
              selectedCourse === ""
                ? "bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white shadow-md"
                : "text-neutral-600 hover:bg-[#0078d4]/10 hover:text-[#0078d4]"
            }`}
          >
            All Courses
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c.id)}
              className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all ${
                selectedCourse === c.id
                  ? "bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white shadow-md"
                  : "text-neutral-600 hover:bg-[#0078d4]/10 hover:text-[#0078d4]"
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>

        {/* Quick Quiz Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-5 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#107c10] to-[#00cc6a] flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-800">
                  Quick Practice
                </h3>
                <p className="text-[12px] text-neutral-500">
                  {courseQuestions.length} questions available
                </p>
              </div>
            </div>
            <button
              onClick={() => startQuiz(courseQuestions.slice(0, 5))}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#107c10] to-[#00cc6a] text-white text-[14px] font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <Play className="w-4 h-4" /> Start 5-Question Quiz
            </button>
          </div>

          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-5 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d83b01] to-[#ff6f61] flex items-center justify-center shadow-md">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-800">
                  Weak Area Focus
                </h3>
                <p className="text-[12px] text-neutral-500">
                  Targeted practice on challenging topics
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                startQuiz(
                  courseQuestions
                    .filter(
                      (q) =>
                        q.difficulty === "hard" || q.difficulty === "medium",
                    )
                    .slice(0, 5),
                )
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#d83b01] to-[#ff6f61] text-white text-[14px] font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <Target className="w-4 h-4" /> Focus on Weak Areas
            </button>
          </div>
        </div>

        {/* Recent Results */}
        <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 shadow-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff8c00] to-[#ffb347] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[15px] font-semibold text-neutral-800">
              Recent Quiz Results
            </h2>
          </div>
          <div className="space-y-2">
            {quizResults.map((result) => {
              const course = courses.find((c) => c.id === result.courseId);
              return (
                <div
                  key={result.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/60 hover:bg-white transition-all border border-transparent hover:border-[#0078d4]/20 hover:shadow-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold text-white ${
                      result.score >= 80
                        ? "bg-gradient-to-br from-[#107c10] to-[#00cc6a]"
                        : result.score >= 60
                          ? "bg-gradient-to-br from-[#ff8c00] to-[#ffb347]"
                          : "bg-gradient-to-br from-[#d83b01] to-[#ff6f61]"
                    }`}
                  >
                    {result.score}%
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-neutral-800">
                      {course?.code} Quiz
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-neutral-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(result.date)}
                      </span>
                      <span>{result.timeSpent} min</span>
                      <span className="font-medium text-[#0078d4]">
                        {result.correctAnswers}/{result.totalQuestions} correct
                      </span>
                    </div>
                  </div>
                  <Trophy
                    className={`w-5 h-5 ${
                      result.score >= 80
                        ? "text-[#107c10]"
                        : result.score >= 60
                          ? "text-[#ff8c00]"
                          : "text-neutral-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
