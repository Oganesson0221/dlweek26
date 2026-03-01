import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  Code2,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Download,
  MessageSquare,
} from "lucide-react";
import { courses } from "@/data/learnLensData";
import type { Assignment, Course } from "@/types";
import {
  formatDate,
  getDaysUntil,
  getStatusColor,
  getStatusLabel,
} from "@/utils/helpers";

const fileTypeIcons: Record<string, React.ReactNode> = {
  docx: <FileText className="w-4 h-4" />,
  pptx: <FileSpreadsheet className="w-4 h-4" />,
  pdf: <FileImage className="w-4 h-4" />,
  code: <Code2 className="w-4 h-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  submitted: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  "in-progress": <Clock className="w-3.5 h-3.5 text-accent" />,
  pending: <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />,
  overdue: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
};

export const SubmissionsPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [expandedAssignment, setExpandedAssignment] = useState<string>("");

  const filteredCourses = selectedCourse
    ? courses.filter((c) => c.id === selectedCourse)
    : courses;

  const allAssignments = filteredCourses.flatMap((c) =>
    c.assignments.map((a) => ({
      ...a,
      courseName: c.name,
      courseCode: c.code,
      courseColor: c.color,
    })),
  );

  const grouped = {
    "in-progress": allAssignments.filter((a) => a.status === "in-progress"),
    pending: allAssignments.filter((a) => a.status === "pending"),
    submitted: allAssignments.filter((a) => a.status === "submitted"),
  };

  const stats = {
    total: allAssignments.length,
    submitted: allAssignments.filter((a) => a.status === "submitted").length,
    inProgress: allAssignments.filter((a) => a.status === "in-progress").length,
    pending: allAssignments.filter((a) => a.status === "pending").length,
  };

  return (
    <div className="space-y-5 max-w-[1080px] mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Submissions</h1>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Assignments, projects, and lab submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Submitted", value: stats.submitted },
          { label: "In Progress", value: stats.inProgress },
          { label: "Pending", value: stats.pending },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-neutral-200 p-3.5 text-center"
          >
            <p className="text-xl font-semibold text-neutral-800 tabular-nums">
              {s.value}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">{s.label}</p>
          </div>
        ))}
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

      {/* In Progress + Pending */}
      {(["in-progress", "pending"] as const).map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[13px] font-semibold text-neutral-800">
                {getStatusLabel(status)}
              </h2>
              <span className="text-[11px] text-neutral-400">
                ({items.length})
              </span>
            </div>
            <div className="space-y-2">
              {items.map((a) => {
                const daysLeft = getDaysUntil(a.dueDate);
                const isExpanded = expandedAssignment === a.id;
                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-colors"
                  >
                    <button
                      onClick={() =>
                        setExpandedAssignment(isExpanded ? "" : a.id)
                      }
                      className="w-full px-4 py-3.5 flex items-center gap-3.5 text-left"
                    >
                      <div className="text-neutral-400 shrink-0">
                        {fileTypeIcons[a.fileType]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-neutral-700 truncate">
                            {a.title}
                          </p>
                          <span className="text-[10px] text-neutral-400 shrink-0">
                            {a.courseCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due {formatDate(a.dueDate)}
                          </span>
                          <span
                            className={`font-medium ${
                              daysLeft <= 3
                                ? "text-red-600"
                                : daysLeft <= 7
                                  ? "text-amber-600"
                                  : "text-neutral-400"
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
                          </span>
                          <span>Weight: {a.weight}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusIcons[a.status]}
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-neutral-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3.5 border-t border-neutral-100 pt-3">
                        <p className="text-[12px] text-neutral-500 mb-3">
                          {a.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-[12px] font-medium rounded-md hover:bg-neutral-800 transition-colors">
                            <Download className="w-3 h-3" />
                            Open Template
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 text-neutral-600 text-[12px] font-medium rounded-md hover:bg-neutral-50 transition-colors">
                            <MessageSquare className="w-3 h-3" />
                            Ask Copilot
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Submitted */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[13px] font-semibold text-neutral-800">
            Submitted
          </h2>
          <span className="text-[11px] text-neutral-400">
            ({grouped.submitted.length})
          </span>
        </div>
        <div className="space-y-1.5">
          {grouped.submitted.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5 flex items-center gap-3.5"
            >
              <div className="text-neutral-400 shrink-0">
                {fileTypeIcons[a.fileType]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-neutral-600 truncate">
                    {a.title}
                  </p>
                  <span className="text-[10px] text-neutral-400">
                    {a.courseCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                  <span>Submitted {formatDate(a.dueDate)}</span>
                  <span>Weight: {a.weight}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                {a.score !== undefined && (
                  <span className="text-[13px] font-semibold text-green-700 tabular-nums">
                    {a.score}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
