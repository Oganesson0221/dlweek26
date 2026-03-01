import React, { useState } from "react";
import {
  FileQuestion,
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Clock,
  Target,
  Trophy,
  BookOpen,
} from "lucide-react";
import { courses, quizQuestions, quizResults } from "@/data/learnLensData";
import type { QuizQuestion } from "@/types";
import { formatDate } from "@/utils/helpers";

export const QuizPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const courseQuestions = selectedCourse
    ? quizQuestions.filter((q) =>
        courses
          .find((c) => c.id === selectedCourse)
          ?.topics.some((t) => t.id === q.topic)
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

  const finishQuiz = () => {
    setShowResults(true);
  };

  const getScore = () => {
    if (!activeQuiz) return 0;
    let correct = 0;
    activeQuiz.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / activeQuiz.length) * 100);
  };

  // Quiz in progress
  if (activeQuiz && !showResults) {
    const q = activeQuiz[currentQ];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-slate-700">
              Question {currentQ + 1} of {activeQuiz.length}
            </span>
            <span className="text-[11px] text-slate-400">
              {Object.keys(answers).length} answered
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0078d4] rounded-full transition-all duration-300"
              style={{
                width: `${((currentQ + 1) / activeQuiz.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                q.difficulty === "easy"
                  ? "bg-[#107c10]/8 text-[#107c10]"
                  : q.difficulty === "medium"
                    ? "bg-[#ffb900]/8 text-[#ffb900]"
                    : "bg-[#d83b01]/8 text-[#d83b01]"
              }`}
            >
              {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
            </span>
            <span className="text-[10px] text-slate-400">
              {q.type.replace("-", " ")}
            </span>
          </div>

          <h3 className="text-[15px] font-semibold text-slate-800 mb-5">
            {q.question}
          </h3>

          {q.type === "open-ended" ? (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]/40 outline-none resize-none"
            />
          ) : (
            <div className="space-y-2">
              {q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(q.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-[13px] transition-all ${
                    answers[q.id] === opt
                      ? "bg-[#0078d4]/8 border-[#0078d4]/30 text-[#0078d4] font-medium"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
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
            className="px-4 py-2 text-[13px] text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          {currentQ < activeQuiz.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="px-5 py-2 bg-[#0078d4] text-white text-[13px] font-medium rounded-xl hover:bg-[#0078d4]/90 transition-colors flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finishQuiz}
              className="px-5 py-2 bg-[#107c10] text-white text-[13px] font-medium rounded-xl hover:bg-[#107c10]/90 transition-colors flex items-center gap-1.5"
            >
              Finish <Trophy className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show results
  if (activeQuiz && showResults) {
    const score = getScore();
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              score >= 80
                ? "bg-[#107c10]/10"
                : score >= 60
                  ? "bg-[#ffb900]/10"
                  : "bg-[#d83b01]/10"
            }`}
          >
            <span
              className={`text-2xl font-bold ${
                score >= 80
                  ? "text-[#107c10]"
                  : score >= 60
                    ? "text-[#ffb900]"
                    : "text-[#d83b01]"
              }`}
            >
              {score}%
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Quiz Complete</h2>
          <p className="text-[13px] text-slate-500 mt-1">
            {activeQuiz.filter((q) => answers[q.id] === q.correctAnswer).length}{" "}
            / {activeQuiz.length} correct
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setActiveQuiz(null)}
              className="px-4 py-2 bg-slate-100 text-slate-600 text-[13px] font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="px-4 py-2 bg-[#0078d4] text-white text-[13px] font-medium rounded-xl hover:bg-[#0078d4]/90 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>

        {/* Review answers */}
        <div className="space-y-3">
          {activeQuiz.map((q, i) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isCorrect ? "bg-[#107c10]/10" : "bg-[#d83b01]/10"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-[#107c10]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#d83b01]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-slate-700">
                      {i + 1}. {q.question}
                    </p>
                    {!isCorrect && (
                      <p className="text-[11px] text-[#d83b01] mt-1">
                        Your answer: {answers[q.id] || "(no answer)"}
                      </p>
                    )}
                    <p className="text-[11px] text-[#107c10] mt-0.5">
                      Correct: {q.correctAnswer}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz landing
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quiz Panel</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Practice with AI-generated quizzes and track your progress
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold text-slate-700 mb-3">
          Generate Quiz from Materials
        </h2>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#0078d4]/30 transition-colors">
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-[13px] text-slate-500">
            Upload lecture slides, notes, or PDFs
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Copilot will generate targeted quizzes from your materials
          </p>
          <button
            onClick={() => setUploadedFile("lecture_notes.pdf")}
            className="mt-3 px-4 py-2 bg-slate-100 text-slate-600 text-[12px] font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Browse Files
          </button>
          {uploadedFile && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#0078d4]/6 rounded-lg">
              <BookOpen className="w-3.5 h-3.5 text-[#0078d4]" />
              <span className="text-[12px] text-[#0078d4] font-medium">
                {uploadedFile}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Course filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedCourse("")}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
            selectedCourse === ""
              ? "bg-[#0078d4] text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          All Courses
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c.id)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              selectedCourse === c.id
                ? "text-white"
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

      {/* Quick Quiz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-1">
            Quick Practice
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            {courseQuestions.length} questions available
          </p>
          <button
            onClick={() => startQuiz(courseQuestions.slice(0, 5))}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0078d4] text-white text-[13px] font-medium rounded-xl hover:bg-[#0078d4]/90 transition-colors"
          >
            <Play className="w-4 h-4" /> Start 5-Question Quiz
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-slate-700 mb-1">
            Weak Area Focus
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Targeted practice on topics needing improvement
          </p>
          <button
            onClick={() =>
              startQuiz(
                courseQuestions.filter((q) => q.difficulty === "hard" || q.difficulty === "medium").slice(0, 5)
              )
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ffb900] text-white text-[13px] font-medium rounded-xl hover:bg-[#ffb900]/90 transition-colors"
          >
            <Target className="w-4 h-4" /> Focus on Weak Areas
          </button>
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-[14px] font-semibold text-slate-700 mb-4">
          Recent Quiz Results
        </h2>
        <div className="space-y-2">
          {quizResults.map((result) => {
            const course = courses.find((c) => c.id === result.courseId);
            return (
              <div
                key={result.id}
                className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: course?.color }}
                />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-slate-700">
                    {course?.code} Quiz
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatDate(result.date)}</span>
                    <span>{result.timeSpent} min</span>
                    <span>
                      {result.correctAnswers}/{result.totalQuestions} correct
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[14px] font-bold ${
                    result.score >= 80
                      ? "text-[#107c10]"
                      : result.score >= 60
                        ? "text-[#ffb900]"
                        : "text-[#d83b01]"
                  }`}
                >
                  {result.score}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
