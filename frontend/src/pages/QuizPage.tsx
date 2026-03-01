import React, { useState } from "react";
import {
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Target,
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

  // Quiz in progress
  if (activeQuiz && !showResults) {
    const q = activeQuiz[currentQ];
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Progress */}
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-medium text-neutral-700">
              Question {currentQ + 1} of {activeQuiz.length}
            </span>
            <span className="text-[11px] text-neutral-400 tabular-nums">
              {Object.keys(answers).length} answered
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{
                width: `${((currentQ + 1) / activeQuiz.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                q.difficulty === "easy"
                  ? "bg-green-50 text-green-700"
                  : q.difficulty === "medium"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
            </span>
            <span className="text-[10px] text-neutral-400">
              {q.type.replace("-", " ")}
            </span>
          </div>

          <h3 className="text-[15px] font-semibold text-neutral-800 mb-5">
            {q.question}
          </h3>

          {q.type === "open-ended" ? (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
              rows={4}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] text-neutral-700 placeholder-neutral-400 focus:ring-2 focus:ring-accent/20 focus:border-accent/40 outline-none resize-none"
            />
          ) : (
            <div className="space-y-2">
              {q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(q.id, opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-[13px] transition-colors ${
                    answers[q.id] === opt
                      ? "bg-accent/5 border-accent/30 text-accent font-medium"
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300"
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
            className="px-4 py-2 text-[13px] text-neutral-500 hover:text-neutral-700 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          {currentQ < activeQuiz.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={finishQuiz}
              className="px-4 py-2 bg-green-700 text-white text-[13px] font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1.5"
            >
              Finish <CheckCircle2 className="w-3.5 h-3.5" />
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
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-neutral-100">
            <span className="text-xl font-semibold text-neutral-800">
              {score}%
            </span>
          </div>
          <h2 className="text-lg font-semibold text-neutral-800">
            Quiz Complete
          </h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            {activeQuiz.filter((q) => answers[q.id] === q.correctAnswer).length}{" "}
            / {activeQuiz.length} correct
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => setActiveQuiz(null)}
              className="px-4 py-2 bg-neutral-100 text-neutral-600 text-[13px] font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="px-4 py-2 bg-neutral-900 text-white text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {activeQuiz.map((q, i) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            return (
              <div
                key={q.id}
                className="bg-white rounded-lg border border-neutral-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-neutral-700">
                      {i + 1}. {q.question}
                    </p>
                    {!isCorrect && (
                      <p className="text-[11px] text-red-600 mt-1">
                        Your answer: {answers[q.id] || "(no answer)"}
                      </p>
                    )}
                    <p className="text-[11px] text-green-600 mt-0.5">
                      Correct: {q.correctAnswer}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1 italic">
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
    <div className="space-y-5 max-w-[1080px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Quiz Panel</h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Practice with quizzes and track your progress
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <h2 className="text-[13px] font-semibold text-neutral-800 mb-3">
          Generate Quiz from Materials
        </h2>
        <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
          <Upload className="w-6 h-6 text-neutral-300 mx-auto mb-2" />
          <p className="text-[13px] text-neutral-500">
            Upload lecture slides, notes, or PDFs
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Copilot will generate targeted quizzes from your materials
          </p>
          <button
            onClick={() => setUploadedFile("lecture_notes.pdf")}
            className="mt-3 px-3 py-1.5 bg-neutral-100 text-neutral-600 text-[12px] font-medium rounded-md hover:bg-neutral-200 transition-colors"
          >
            Browse Files
          </button>
          {uploadedFile && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md">
              <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[12px] text-neutral-600 font-medium">
                {uploadedFile}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Course filter */}
      <div className="flex items-center gap-1 border-b border-neutral-200">
        <button
          onClick={() => setSelectedCourse("")}
          className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
            selectedCourse === ""
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          All
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c.id)}
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

      {/* Quick Quiz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="text-[13px] font-semibold text-neutral-800 mb-1">
            Quick Practice
          </h3>
          <p className="text-[11px] text-neutral-400 mb-4">
            {courseQuestions.length} questions available
          </p>
          <button
            onClick={() => startQuiz(courseQuestions.slice(0, 5))}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-[13px] font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Start 5-Question Quiz
          </button>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="text-[13px] font-semibold text-neutral-800 mb-1">
            Weak Area Focus
          </h3>
          <p className="text-[11px] text-neutral-400 mb-4">
            Targeted practice on topics needing improvement
          </p>
          <button
            onClick={() =>
              startQuiz(
                courseQuestions
                  .filter(
                    (q) => q.difficulty === "hard" || q.difficulty === "medium",
                  )
                  .slice(0, 5),
              )
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Target className="w-3.5 h-3.5" /> Focus on Weak Areas
          </button>
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5">
        <h2 className="text-[13px] font-semibold text-neutral-800 mb-4">
          Recent Quiz Results
        </h2>
        <div className="space-y-1.5">
          {quizResults.map((result) => {
            const course = courses.find((c) => c.id === result.courseId);
            return (
              <div
                key={result.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-neutral-700">
                    {course?.code} Quiz
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span>{formatDate(result.date)}</span>
                    <span>{result.timeSpent} min</span>
                    <span>
                      {result.correctAnswers}/{result.totalQuestions} correct
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[13px] font-semibold tabular-nums ${
                    result.score >= 80
                      ? "text-green-700"
                      : result.score >= 60
                        ? "text-amber-600"
                        : "text-red-600"
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
