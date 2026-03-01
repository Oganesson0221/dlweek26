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
  Sparkles,
} from "lucide-react";
import { courses } from "@/data/learnLensData";
import type { Assignment, Course } from "@/types";
import { formatDate, getDaysUntil, getStatusColor, getStatusLabel } from "@/utils/helpers";

const fileTypeIcons: Record<string, React.ReactNode> = {
  docx: <FileText className="w-5 h-5" />,
  pptx: <FileSpreadsheet className="w-5 h-5" />,
  pdf: <FileImage className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  submitted: <CheckCircle2 className="w-4 h-4 text-[#107c10]" />,
  "in-progress": <Clock className="w-4 h-4 text-[#0078d4]" />,
  pending: <AlertCircle className="w-4 h-4 text-[#8661c5]" />,
  overdue: <AlertTriangle className="w-4 h-4 text-[#d83b01]" />,
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
    }))
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Submissions</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Assignments, projects, and lab submissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "#64748b" },
          { label: "Submitted", value: stats.submitted, color: "#107c10" },
          { label: "In Progress", value: stats.inProgress, color: "#0078d4" },
          { label: "Pending", value: stats.pending, color: "#8661c5" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center"
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course filter */}
      <div className="flex items-center gap-2 flex-wrap">
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

      {/* In Progress + Pending */}
      {(["in-progress", "pending"] as const).map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(status) }}
              />
              <h2 className="text-[14px] font-semibold text-slate-700">
                {getStatusLabel(status)}
              </h2>
              <span className="text-[11px] text-slate-400">
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
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() =>
                        setExpandedAssignment(isExpanded ? "" : a.id)
                      }
                      className="w-full px-5 py-4 flex items-center gap-4 text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${a.courseColor}10` }}
                      >
                        <span style={{ color: a.courseColor }}>
                          {fileTypeIcons[a.fileType]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-slate-700 truncate">
                            {a.title}
                          </p>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0"
                            style={{
                              color: a.courseColor,
                              backgroundColor: `${a.courseColor}10`,
                            }}
                          >
                            {a.courseCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due {formatDate(a.dueDate)}
                          </span>
                          <span
                            className={`font-medium ${
                              daysLeft <= 3
                                ? "text-[#d83b01]"
                                : daysLeft <= 7
                                  ? "text-[#ffb900]"
                                  : "text-slate-400"
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
                          </span>
                          <span>Weight: {a.weight}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusIcons[a.status]}
                        <ChevronRight
                          className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                        <p className="text-[12px] text-slate-500 mb-3">
                          {a.description}
                        </p>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0078d4] text-white text-[12px] font-medium rounded-lg hover:bg-[#0078d4]/90 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            Open {a.fileType.toUpperCase()} Template
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-[12px] font-medium rounded-lg hover:bg-slate-200 transition-colors">
                            <Sparkles className="w-3.5 h-3.5" />
                            Get Copilot Help
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
          <div className="w-2 h-2 rounded-full bg-[#107c10]" />
          <h2 className="text-[14px] font-semibold text-slate-700">
            Submitted
          </h2>
          <span className="text-[11px] text-slate-400">
            ({grouped.submitted.length})
          </span>
        </div>
        <div className="space-y-2">
          {grouped.submitted.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${a.courseColor}10` }}
              >
                <span style={{ color: a.courseColor }}>
                  {fileTypeIcons[a.fileType]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-slate-600 truncate">
                    {a.title}
                  </p>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                    style={{
                      color: a.courseColor,
                      backgroundColor: `${a.courseColor}10`,
                    }}
                  >
                    {a.courseCode}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                  <span>Submitted {formatDate(a.dueDate)}</span>
                  <span>Weight: {a.weight}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#107c10]" />
                {a.score !== undefined && (
                  <span className="text-[14px] font-bold text-[#107c10]">
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
