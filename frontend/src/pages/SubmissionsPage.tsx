import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
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
  Mail,
  FileDown,
  X,
  Send,
  Loader2,
  ChevronDown,
  Upload,
  File,
  Plus,
  Trash2,
  BookOpen,
  ClipboardList,
  FileCheck,
  ExternalLink,
  Globe,
  Check,
  RefreshCcw,
} from "lucide-react";
import { courses as mockCourses } from "@/data/learnLensData";
import { useCoursesBackend } from "@/hooks/useCoursesBackend";
import type { Assignment } from "@/types";
import {
  formatDate,
  getDaysUntil,
  getStatusColor,
  getStatusLabel,
} from "@/utils/helpers";
import { renderMarkdownBold } from "@/utils/markdownHelpers";
import { ClippyAssistant } from "@/components/ClippyAssistant";
import {
  generateAssignmentTemplateWithOpenAI,
  generateSubmissionGuidelinesWithOpenAI,
  generateEmailWithOpenAI,
} from "@/utils/openaiHelpers";
import {
  uploadCourseOutline,
  generateWord,
  generatePpt,
  downloadUrl,
  listCourses,
  getCourseOutline,
  getCourseComponents,
  updateAssignmentStatus,
} from "@/api/academicApi";

/* ── Template types ── */
type TemplateType = "docx" | "pptx" | "lab-report" | "assignment";

const templateOptions: { type: TemplateType; label: string; desc: string }[] = [
  { type: "docx", label: "Word Document", desc: "Essay / written assignment" },
  { type: "pptx", label: "PowerPoint", desc: "Presentation slides" },
  { type: "lab-report", label: "Lab Report", desc: "Formatted lab template" },
  {
    type: "assignment",
    label: "Assignment with Rubric",
    desc: "Based on course outline",
  },
];

/* ── Course Outline Types ── */
interface RubricCriteria {
  criteria: string;
  points: number;
  description: string;
  excellent?: string;
  good?: string;
  fair?: string;
  poor?: string;
}

interface CourseComponent {
  name: string;
  type: "assignment" | "quiz" | "project" | "presentation" | "lab" | "exam";
  weight: number;
  dueDate?: string;
  rubric?: RubricCriteria[];
  submissionGuidelines: string[];
  description?: string;
  learningObjectives?: string[];
  resources?: string[];
}

interface CourseOutline {
  courseName: string;
  courseCode: string;
  instructor: string;
  instructorEmail?: string;
  semester?: string;
  description?: string;
  components: CourseComponent[];
  gradingPolicy?: string;
  latePolicy?: string;
}

interface UploadedOutline {
  id: string;
  fileName: string;
  courseName: string;
  courseCode: string;
  uploadDate: string;
  outline: CourseOutline;
}

/* ── Icons ── */
const fileTypeIcons: Record<string, React.ReactNode> = {
  docx: <FileText className="w-4 h-4" />,
  pptx: <FileSpreadsheet className="w-4 h-4" />,
  pdf: <FileImage className="w-4 h-4" />,
  code: <Code2 className="w-4 h-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  submitted: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  "in-progress": <Clock className="w-3.5 h-3.5 text-amber-600" />,
  pending: <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />,
  overdue: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
};

/* ── Template generation with proper formatting ── */

// Generate a Google Docs URL for templates
const generateGoogleDocsUrl = (title: string, content: string): string => {
  const encodedContent = encodeURIComponent(content);
  return `https://docs.google.com/document/u/0/?action=create&title=${encodeURIComponent(title)}&content=${encodedContent}`;
};

// Generate a Google Slides URL for presentations
const generateGoogleSlidesUrl = (title: string, content: string): string => {
  const encodedContent = encodeURIComponent(content);
  return `https://docs.google.com/presentation/u/0/?action=create&title=${encodeURIComponent(title)}&content=${encodedContent}`;
};

// Fallback template generator
const generateFallbackTemplate = (
  title: string,
  type: TemplateType,
  component?: CourseComponent,
): string => {
  const baseTemplate = `# ${title}

## Student Information
**Name:** _________________________
**Student ID:** ___________________
**Date:** ________________________
**Course:** ______________________

## Assignment Overview
${component?.description || "Complete the following assignment according to the guidelines."}

${
  component?.rubric
    ? `
## Grading Rubric
${component.rubric
  .map(
    (r) => `### ${r.criteria} (${r.points} points)
${r.description}

| Level | Points | Description |
|-------|--------|-------------|
| Excellent | ${Math.round(r.points * 0.9)}-${r.points} | ${r.excellent || "Exceeds expectations"} |
| Good | ${Math.round(r.points * 0.8)}-${Math.round(r.points * 0.9 - 1)} | ${r.good || "Meets expectations"} |
| Fair | ${Math.round(r.points * 0.7)}-${Math.round(r.points * 0.8 - 1)} | ${r.fair || "Partially meets expectations"} |
| Poor | 0-${Math.round(r.points * 0.7 - 1)} | ${r.poor || "Does not meet expectations"} |
`,
  )
  .join("\n")}
`
    : ""
}

## Submission Requirements
${
  component?.submissionGuidelines?.map((g) => `- ${g}`).join("\n") ||
  `- Submit by the deadline
- Follow formatting guidelines
- Include all required components`
}

## Checklist
- [ ] I have reviewed the rubric
- [ ] My submission meets all requirements
- [ ] I have proofread my work
- [ ] All files are properly named
- [ ] Submitted before deadline

---

*Generated by LearnLens Template Assistant*`;

  return baseTemplate;
};

/* ── Component ── */
export const SubmissionsPage: React.FC = () => {
  // Use backend courses with fallback
  const { courses: backendCourses, refetch: refetchCourses } =
    useCoursesBackend();
  const courses = backendCourses.length > 0 ? backendCourses : mockCourses;

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [expandedAssignment, setExpandedAssignment] = useState<string>("");
  const [emailModalAssignment, setEmailModalAssignment] = useState<
    string | null
  >(null);
  const [emailData, setEmailData] = useState<{ subject: string; body: string }>(
    { subject: "", body: "" },
  );
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState<Set<string>>(new Set());
  const [templateDropdown, setTemplateDropdown] = useState<string | null>(null);
  const [clippyDismissed, setClippyDismissed] = useState(false);
  const [clippyMinimized, setClippyMinimized] = useState(false);
  const [clippyTip, setClippyTip] = useState(0);
  const [clippyMessages, setClippyMessages] = useState<string[]>([]);
  const [clippyListening, setClippyListening] = useState(false);

  /* ── Course Outline State ── */
  const [uploadedOutlines, setUploadedOutlines] = useState<UploadedOutline[]>(
    [],
  );
  const [showOutlineUploader, setShowOutlineUploader] = useState(false);
  const [uploadingOutline, setUploadingOutline] = useState(false);
  const [selectedOutline, setSelectedOutline] = useState<string | null>(null);
  const [generatingGuidelines, setGeneratingGuidelines] = useState(false);
  const [guidelines, setGuidelines] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCourseCode, setUploadCourseCode] = useState("");
  const [uploadCourseName, setUploadCourseName] = useState("");
  const [templateLoading, setTemplateLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load outlines from backend on mount
  useEffect(() => {
    const loadOutlines = async () => {
      try {
        const dbCourses = await listCourses();
        const outlinesPromises = dbCourses.map(async (course: any) => {
          const [outline, components] = await Promise.all([
            getCourseOutline(course.code).catch(() => null),
            getCourseComponents(course.code).catch(() => []),
          ]);
          
          return {
            id: course.id || course.code,
            fileName: `${course.code}_outline.pdf`,
            courseName: course.name,
            courseCode: course.code,
            uploadDate: course.created_at || new Date().toISOString(),
            outline: {
              courseName: course.name,
              courseCode: course.code,
              instructor: outline?.instructor || "",
              semester: course.term || "Y2S2",
              description: outline?.description || "",
              components: (components || []).map((c: any) => ({
                name: c.name,
                type: "assignment" as const,
                weight: Math.round((Number(c.weight) || 0) * 100),
                submissionGuidelines: [],
                rubric: [],
              })),
            },
          };
        });
        
        const loadedOutlines = await Promise.all(outlinesPromises);
        setUploadedOutlines(loadedOutlines.filter(o => o.outline.components.length > 0));
      } catch (error) {
        console.error("Failed to load outlines from backend:", error);
      }
    };
    
    loadOutlines();
  }, []);

  const filteredCourses = selectedCourse
    ? courses.filter((c) => c.id === selectedCourse)
    : courses;

  const allAssignments = filteredCourses.flatMap((c) =>
    c.assignments.map((a) => ({
      ...a,
      courseName: c.name,
      courseCode: c.code,
      courseColor: c.color,
      instructor: c.instructor,
    })),
  );

  const grouped = {
    "in-progress": allAssignments.filter((a) => a.status === "in-progress"),
    pending: allAssignments.filter((a) => a.status === "pending"),
    submitted: allAssignments.filter((a) => a.status === "submitted"),
  };

  const stats = useMemo(
    () => ({
      total: allAssignments.length,
      submitted: allAssignments.filter((a) => a.status === "submitted").length,
      inProgress: allAssignments.filter((a) => a.status === "in-progress")
        .length,
      pending: allAssignments.filter((a) => a.status === "pending").length,
    }),
    [allAssignments],
  );

  /* ── Upcoming deadlines for Clippy ── */
  const urgentDeadlines = useMemo(
    () =>
      allAssignments
        .filter((a) => a.status === "in-progress" || a.status === "pending")
        .map((a) => ({ ...a, daysLeft: getDaysUntil(a.dueDate) }))
        .filter((a) => a.daysLeft > 0 && a.daysLeft <= 14)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5),
    [allAssignments],
  );

  // Add Clippy messages based on context - only run once on mount
  useEffect(() => {
    const messages: string[] = [];
    const deadlineCount = urgentDeadlines.length;
    const firstDeadline = urgentDeadlines[0];

    if (deadlineCount > 0 && firstDeadline) {
      messages.push(
        `URGENT: You have ${deadlineCount} deadline${deadlineCount > 1 ? "s" : ""} coming up! "${firstDeadline.title}" is due in ${firstDeadline.daysLeft} days.`,
      );
    }

    if (uploadedOutlines.length === 0) {
      messages.push(
        `Tip: Upload your course outlines to get AI-generated templates with rubrics automatically! Click "Upload Course Outline" above.`,
      );
    }

    if (stats.inProgress > 0) {
      messages.push(
        `You have ${stats.inProgress} assignment${stats.inProgress > 1 ? "s" : ""} in progress. Need help? I can generate templates for you!`,
      );
    }

    if (stats.submitted > 0 && emailSent.size === 0) {
      messages.push(
        `Don't forget to email your professors to confirm submissions. I can help draft professional emails!`,
      );
    }

    setClippyMessages(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clippyTips = [
    ...urgentDeadlines.map((d) => `"${d.title}" due in ${d.daysLeft} days!`),
    "Upload course outlines for automatic rubric extraction",
    "Use the email feature to confirm submissions with professors",
    "Track your progress across all courses",
    "Generate templates that open directly in Google Docs",
    "Save time with pre-formatted templates based on your rubrics",
  ];

  /* ── Email flow with Outlook integration ── */
  const openEmailModal = useCallback(async (a: (typeof allAssignments)[0]) => {
    setEmailModalAssignment(a.id);
    setEmailLoading(true);
    try {
      const email = await generateEmailWithOpenAI(a, a.instructor);
      setEmailData(email);
    } catch (error) {
      console.error("Failed to generate email:", error);
      setEmailData({
        subject: `Submission Confirmation: ${a.title} (${a.courseCode})`,
        body: `Dear Professor ${a.instructor},\n\nI am writing to confirm that I have submitted "${a.title}" for ${a.courseCode}.\n\nPlease let me know if you need any additional information.\n\nThank you,\n[Your Name]`,
      });
    } finally {
      setEmailLoading(false);
    }
  }, []);

  const sendEmail = useCallback(() => {
    if (!emailModalAssignment) return;

    const assignment = allAssignments.find(
      (a) => a.id === emailModalAssignment,
    );
    if (assignment) {
      const subject = encodeURIComponent(emailData.subject);
      const body = encodeURIComponent(emailData.body.replace(/\n/g, "\r\n"));

      // Open in Outlook Web
      const outlookWebUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(assignment.instructor)}&subject=${subject}&body=${body}`;
      window.open(outlookWebUrl, "_blank");

      setEmailSent((prev) => new Set([...prev, emailModalAssignment]));
    }

    setEmailModalAssignment(null);
    setEmailData({ subject: "", body: "" });
  }, [emailModalAssignment, emailData, allAssignments]);

  /* ── Status toggle handler ── */
  const handleStatusToggle = useCallback(async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "submitted" ? "in_progress" : "submitted";
    try {
      await updateAssignmentStatus(assignmentId as unknown as number, newStatus);
      // Refetch courses to update UI
      refetchCourses();
      setClippyMessages((prev) => [
        `Assignment marked as ${newStatus === "submitted" ? "submitted" : "in progress"}!`,
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update assignment status");
    }
  }, [refetchCourses]);

  /* ── Template generation with Google Docs links ── */
  const handleTemplateGeneration = async (
    assignmentTitle: string,
    type: TemplateType,
    outlineComponent?: CourseComponent,
  ) => {
    setTemplateLoading(assignmentTitle);
    try {
      const courseInfo = selectedOutlineData
        ? {
            name: selectedOutlineData.courseName,
            code: selectedOutlineData.courseCode,
            instructor: selectedOutlineData.outline.instructor,
          }
        : undefined;

      if (type === "assignment" && outlineComponent && courseInfo) {
        // Generate template with OpenAI
        const template = await generateAssignmentTemplateWithOpenAI(
          outlineComponent,
          courseInfo,
        );

        // Open in Google Docs
        const url = generateGoogleDocsUrl(
          `${courseInfo.code}_${outlineComponent.name}`,
          template,
        );
        window.open(url, "_blank");

        setClippyMessages((prev) => [
          `Template for "${outlineComponent.name}" opened in Google Docs!`,
          ...prev.slice(0, 4),
        ]);
      } else {
        // Use fallback template
        const template = generateFallbackTemplate(
          assignmentTitle,
          type,
          outlineComponent,
        );
        const url =
          type === "pptx"
            ? generateGoogleSlidesUrl(assignmentTitle, template)
            : generateGoogleDocsUrl(assignmentTitle, template);
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Template generation failed:", error);
      alert("Failed to generate template. Opening fallback template...");

      // Fallback to basic template
      const template = generateFallbackTemplate(
        assignmentTitle,
        type,
        outlineComponent,
      );
      const url =
        type === "pptx"
          ? generateGoogleSlidesUrl(assignmentTitle, template)
          : generateGoogleDocsUrl(assignmentTitle, template);
      window.open(url, "_blank");
    } finally {
      setTemplateLoading(null);
      setTemplateDropdown(null);
    }
  };

  /* ── Course Outline Upload with Backend API ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate course code and name
    if (!uploadCourseCode.trim() || !uploadCourseName.trim()) {
      alert("Please enter course code and course name before uploading.");
      e.target.value = "";
      return;
    }

    setUploadingOutline(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await uploadCourseOutline({
        code: uploadCourseCode.trim(),
        name: uploadCourseName.trim(),
        term: "Y2S2",
        file,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const course = response?.course;
      const ingest = response?.ingest;
      const components = Array.isArray(ingest?.components_extracted)
        ? ingest.components_extracted
        : [];
      const instructor = ingest?.instructor ?? "";
      const outlineDescription = ingest?.outline_preview ?? "";

      const newOutline: UploadedOutline = {
        id: Date.now().toString(),
        fileName: file.name,
        courseName: course?.name ?? uploadCourseName.trim(),
        courseCode: course?.code ?? uploadCourseCode.trim(),
        uploadDate: new Date().toISOString(),
        outline: {
          courseName: course?.name ?? uploadCourseName.trim(),
          courseCode: course?.code ?? uploadCourseCode.trim(),
          instructor,
          semester: course?.term ?? "Y2S2",
          description: outlineDescription,
          components: components.map((component: any) => ({
            name: component?.name ?? "Untitled Component",
            type: "assignment" as const,
            weight: Math.round((Number(component?.weight) || 0) * 100),
            submissionGuidelines: [],
            rubric: [],
          })),
        },
      };

      setUploadedOutlines((prev) => [newOutline, ...prev]);
      setSelectedOutline(newOutline.id);
      setShowOutlineUploader(false);
      setUploadCourseCode("");
      setUploadCourseName("");
      e.target.value = "";

      // Refetch courses from backend
      refetchCourses();

      setClippyMessages((prev) => [
        `Uploaded "${newOutline.courseCode}" and extracted ${newOutline.outline.components.length} components.`,
        ...prev.slice(0, 4),
      ]);
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Failed to upload course outline:", error);
      alert(
        error.message || "Failed to upload course outline. Please try again.",
      );
    } finally {
      setUploadingOutline(false);
      setUploadProgress(0);
    }
  };

  /* ── Generate Submission Guidelines ── */
  const handleGenerateGuidelines = async () => {
    if (!selectedOutline) return;

    const outline = uploadedOutlines.find((o) => o.id === selectedOutline);
    if (!outline) return;

    setGeneratingGuidelines(true);
    try {
      const guidelinesText = await generateSubmissionGuidelinesWithOpenAI(
        outline.outline,
      );
      setGuidelines(guidelinesText);

      // Open in Google Docs
      const url = generateGoogleDocsUrl(
        `${outline.courseCode}_Submission_Guidelines`,
        guidelinesText,
      );
      window.open(url, "_blank");

      setClippyMessages((prev) => [
        `Submission guidelines generated for ${outline.courseCode}!`,
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error("Failed to generate guidelines:", error);
      alert("Failed to generate guidelines. Please try again.");
    } finally {
      setGeneratingGuidelines(false);
    }
  };

  const currentEmailAssignment = allAssignments.find(
    (a) => a.id === emailModalAssignment,
  );
  const selectedOutlineData = uploadedOutlines.find(
    (o) => o.id === selectedOutline,
  );

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Gradient Overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/submissions.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Microsoft-style gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0078d4]/10 via-white/90 to-[#50e6ff]/10" />

      {/* Content container */}
      <div className="relative z-10 space-y-5 max-w-[1080px] mx-auto py-8 px-4">
        {/* Header with Microsoft branding */}
        <div className="flex items-start justify-between mb-2">
          <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 border border-white/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0078d4] to-[#106ebe] bg-clip-text text-transparent">
                  Submissions
                </h1>
                <p className="text-sm text-neutral-600">
                  Track assignments, generate templates, and manage deadlines
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowOutlineUploader(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white text-[13px] font-semibold rounded-lg hover:from-[#106ebe] hover:to-[#005a9e] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Upload className="w-4 h-4" />
            Upload Course Outline
          </button>
        </div>

        {/* Stats with Microsoft Fluent Design */}
        <div className="grid grid-cols-4 gap-4 mb-2">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "from-[#0078d4] to-[#50e6ff]",
              icon: FileText,
            },
            {
              label: "Submitted",
              value: stats.submitted,
              color: "from-[#107c10] to-[#00cc6a]",
              icon: CheckCircle2,
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              color: "from-[#ff8c00] to-[#ffb900]",
              icon: Clock,
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "from-[#5c2d91] to-[#b4a0ff]",
              icon: AlertCircle,
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group backdrop-blur-md bg-white/70 rounded-xl border border-white/50 p-5 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-default"
              >
                <div
                  className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-neutral-800 tabular-nums">
                  {s.value}
                </p>
                <p className="text-[12px] text-neutral-500 mt-1 font-medium uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Course Outlines Section */}
        {uploadedOutlines.length > 0 && (
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-neutral-200/50 flex items-center justify-between bg-gradient-to-r from-[#0078d4]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-neutral-800">
                  Uploaded Course Outlines
                </h2>
              </div>
              <button
                onClick={() => setShowOutlineUploader(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#0078d4] hover:bg-[#0078d4]/10 font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add More
              </button>
            </div>
            <div className="divide-y divide-neutral-200/50">
              {uploadedOutlines.map((outline) => (
                <div
                  key={outline.id}
                  className={`px-5 py-3 hover:bg-[#0078d4]/5 cursor-pointer transition-all ${
                    selectedOutline === outline.id
                      ? "bg-[#0078d4]/10 border-l-3 border-l-[#0078d4]"
                      : ""
                  }`}
                  onClick={() => setSelectedOutline(outline.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-neutral-900">
                        {outline.courseName}{" "}
                        <span className="text-[#0078d4]">
                          ({outline.courseCode})
                        </span>
                      </p>
                      <p className="text-[12px] text-neutral-500 mt-1">
                        {outline.fileName} •{" "}
                        {new Date(outline.uploadDate).toLocaleDateString()} •{" "}
                        {outline.outline.components.length} components
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedOutlines((prev) =>
                          prev.filter((o) => o.id !== outline.id),
                        );
                        if (selectedOutline === outline.id)
                          setSelectedOutline(null);
                      }}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Outline Components */}
        {selectedOutlineData && (
          <div className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-neutral-200/50 flex items-center justify-between bg-gradient-to-r from-[#5c2d91]/5 to-transparent">
              <div>
                <h2 className="text-sm font-semibold text-neutral-800">
                  Course Components - {selectedOutlineData.courseCode}
                </h2>
                <p className="text-[12px] text-neutral-500 mt-1">
                  Instructor: {selectedOutlineData.outline.instructor} •{" "}
                  {selectedOutlineData.outline.components.length} components
                </p>
              </div>
              <button
                onClick={handleGenerateGuidelines}
                disabled={generatingGuidelines}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#5c2d91] to-[#b4a0ff] text-white text-[11px] font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-40 shadow-md"
              >
                {generatingGuidelines ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ClipboardList className="w-3 h-3" />
                )}
                Generate Guidelines
              </button>
            </div>
            <div className="divide-y divide-neutral-100/50 max-h-[400px] overflow-y-auto">
              {selectedOutlineData.outline.components.map((component, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 hover:bg-[#5c2d91]/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-neutral-800">
                          {component.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded-full capitalize">
                          {component.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-neutral-400">
                          Weight: {component.weight}%
                        </span>
                        {component.dueDate && (
                          <span className="text-[11px] text-neutral-400">
                            Due: {component.dueDate}
                          </span>
                        )}
                      </div>
                      {component.description && (
                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                          {component.description}
                        </p>
                      )}
                      {component.rubric && component.rubric.length > 0 && (
                        <div className="mt-2 bg-neutral-50 p-2 rounded-md">
                          <p className="text-[10px] font-medium text-neutral-600 mb-1">
                            Rubric:
                          </p>
                          <div className="space-y-1">
                            {component.rubric.slice(0, 2).map((r, i) => (
                              <div
                                key={i}
                                className="text-[10px] text-neutral-500 flex items-start gap-1"
                              >
                                <span className="font-medium text-neutral-600 min-w-[60px]">
                                  {r.criteria}:
                                </span>
                                <span>{r.points}pts</span>
                              </div>
                            ))}
                            {component.rubric.length > 2 && (
                              <p className="text-[9px] text-neutral-400">
                                +{component.rubric.length - 2} more criteria
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleTemplateGeneration(
                          component.name,
                          "assignment",
                          component,
                        )
                      }
                      disabled={templateLoading === component.name}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-white bg-neutral-800 hover:bg-neutral-700 rounded-md ml-2 shrink-0 disabled:opacity-50"
                    >
                      {templateLoading === component.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Globe className="w-3 h-3" />
                      )}
                      {templateLoading === component.name
                        ? "Opening..."
                        : "Open Template"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {guidelines && (
              <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50">
                <p className="text-[12px] font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Guidelines Generated
                </p>
                <button
                  onClick={() => {
                    const url = generateGoogleDocsUrl(
                      `${selectedOutlineData.courseCode}_Guidelines`,
                      guidelines,
                    );
                    window.open(url, "_blank");
                  }}
                  className="text-[12px] text-neutral-700 hover:text-neutral-900 font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Docs
                </button>
              </div>
            )}
          </div>
        )}

        {/* Course filter */}
        {/* Course filter with Microsoft tab style */}
        <div className="flex items-center gap-1 backdrop-blur-md bg-white/60 rounded-xl p-1.5 border border-white/50 shadow-lg">
          <button
            onClick={() => setSelectedCourse("")}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
              selectedCourse === ""
                ? "bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white shadow-md"
                : "text-neutral-600 hover:bg-[#0078d4]/10 hover:text-[#0078d4]"
            }`}
          >
            All Courses
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c.id)}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
                selectedCourse === c.id
                  ? "bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white shadow-md"
                  : "text-neutral-600 hover:bg-[#0078d4]/10 hover:text-[#0078d4]"
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>

        {/* Main content + Clippy sidebar */}
        <div className="flex gap-5">
          {/* Assignments list */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* In Progress + Pending */}
            {(["in-progress", "pending"] as const).map((status) => {
              const items = grouped[status];
              if (items.length === 0) return null;
              const statusColors = {
                "in-progress": {
                  bg: "from-[#ff8c00]/10 to-transparent",
                  border: "border-l-[#ff8c00]",
                  text: "text-[#ff8c00]",
                },
                pending: {
                  bg: "from-[#5c2d91]/10 to-transparent",
                  border: "border-l-[#5c2d91]",
                  text: "text-[#5c2d91]",
                },
              };
              const colors = statusColors[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${status === "in-progress" ? "from-[#ff8c00] to-[#ffb900]" : "from-[#5c2d91] to-[#b4a0ff]"}`}
                    />
                    <h2 className="text-sm font-bold text-neutral-800">
                      {getStatusLabel(status)}
                    </h2>
                    <span
                      className={`text-[11px] ${colors.text} font-semibold px-2 py-0.5 rounded-full bg-current/10`}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((a) => {
                      const daysLeft = getDaysUntil(a.dueDate);
                      const isExpanded = expandedAssignment === a.id;
                      const outlineComponent =
                        selectedOutlineData?.outline.components.find(
                          (c) =>
                            c.name
                              .toLowerCase()
                              .includes(a.title.toLowerCase()) ||
                            a.title
                              .toLowerCase()
                              .includes(c.name.toLowerCase()),
                        );

                      return (
                        <div
                          key={a.id}
                          className={`backdrop-blur-md bg-white/80 rounded-xl border border-white/50 overflow-hidden hover:shadow-xl transition-all shadow-lg border-l-3 ${colors.border}`}
                        >
                          <button
                            onClick={() =>
                              setExpandedAssignment(isExpanded ? "" : a.id)
                            }
                            className="w-full px-5 py-4 flex items-center gap-4 text-left"
                          >
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${status === "in-progress" ? "from-[#ff8c00] to-[#ffb900]" : "from-[#5c2d91] to-[#b4a0ff]"} flex items-center justify-center shadow-md`}
                            >
                              <span className="text-white">
                                {fileTypeIcons[a.fileType]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-neutral-800 truncate">
                                  {a.title}
                                </p>
                                <span className="text-[11px] text-neutral-500 shrink-0 font-medium">
                                  {a.courseCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-[12px] text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
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
                                  {daysLeft > 0
                                    ? `${daysLeft}d left`
                                    : "Overdue"}
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
                              {outlineComponent && (
                                <div className="mb-3 p-2 bg-blue-50 rounded-md">
                                  <p className="text-[11px] font-medium text-blue-700 mb-1">
                                    Rubric Available:
                                  </p>
                                  <div className="space-y-1">
                                    {outlineComponent.rubric?.map((r, i) => (
                                      <div
                                        key={i}
                                        className="text-[10px] text-blue-600"
                                      >
                                        • {r.criteria}: {r.points}pts -{" "}
                                        {r.description}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Template dropdown */}
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setTemplateDropdown(
                                        templateDropdown === a.id ? null : a.id,
                                      )
                                    }
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-[12px] font-medium rounded-md hover:bg-neutral-800 transition-colors"
                                  >
                                    <FileDown className="w-3 h-3" />
                                    Generate Template
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  {templateDropdown === a.id && (
                                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1">
                                      {templateOptions.map((t) => (
                                        <button
                                          key={t.type}
                                          onClick={() => {
                                            if (
                                              t.type === "assignment" &&
                                              outlineComponent
                                            ) {
                                              handleTemplateGeneration(
                                                a.title,
                                                t.type,
                                                outlineComponent,
                                              );
                                            } else {
                                              handleTemplateGeneration(
                                                a.title,
                                                t.type,
                                              );
                                            }
                                          }}
                                          disabled={templateLoading === a.title}
                                          className="w-full text-left px-3 py-2 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                        >
                                          <p className="text-[12px] font-medium text-neutral-700 flex items-center gap-1">
                                            {t.label}
                                            {t.type === "assignment" &&
                                              outlineComponent && (
                                                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                                  AI
                                                </span>
                                              )}
                                          </p>
                                          <p className="text-[10px] text-neutral-400">
                                            {t.desc}
                                          </p>
                                          {t.type === "assignment" &&
                                            outlineComponent && (
                                              <p className="text-[9px] text-green-600 mt-1">
                                                Opens in Google Docs with rubric
                                              </p>
                                            )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() =>
                                    handleTemplateGeneration(a.title, "docx")
                                  }
                                  disabled={templateLoading === a.title}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 text-neutral-600 text-[12px] font-medium rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                >
                                  {templateLoading === a.title ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Globe className="w-3 h-3" />
                                  )}
                                  Open in Docs
                                </button>

                                <button
                                  onClick={() =>
                                    handleTemplateGeneration(a.title, "pptx")
                                  }
                                  disabled={templateLoading === a.title}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 text-neutral-600 text-[12px] font-medium rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                >
                                  {templateLoading === a.title ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Globe className="w-3 h-3" />
                                  )}
                                  Open in Slides
                                </button>

                                <button
                                  onClick={() => handleStatusToggle(a.id, a.status)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#107c10] to-[#00cc6a] text-white text-[12px] font-medium rounded-md hover:opacity-90 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark Submitted
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#107c10] to-[#00cc6a]" />
                <h2 className="text-sm font-bold text-neutral-800">
                  Submitted
                </h2>
                <span className="text-[11px] text-[#107c10] font-semibold px-2 py-0.5 rounded-full bg-[#107c10]/10">
                  {grouped.submitted.length}
                </span>
              </div>
              <div className="space-y-3">
                {grouped.submitted.map((a) => (
                  <div
                    key={a.id}
                    className="backdrop-blur-md bg-white/80 rounded-xl border border-white/50 border-l-3 border-l-[#107c10] px-5 py-4 flex items-center gap-4 group shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#107c10] to-[#00cc6a] flex items-center justify-center shadow-md">
                      <span className="text-white">
                        {fileTypeIcons[a.fileType]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-neutral-700 truncate">
                          {a.title}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 bg-[#0078d4]/10 text-[#0078d4] rounded-full font-medium">
                          {a.courseCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
                        <span>Submitted {formatDate(a.dueDate)}</span>
                        <span>Weight: {a.weight}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {emailSent.has(a.id) ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-[#107c10] font-medium px-2 py-1 bg-[#107c10]/10 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Emailed
                        </span>
                      ) : (
                        <button
                          onClick={() => openEmailModal(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#0078d4] hover:bg-[#0078d4]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-[#0078d4]/30"
                          title="Email professor to confirm submission"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email Prof</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusToggle(a.id, a.status)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-amber-600 hover:bg-amber-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-amber-300"
                        title="Mark as incomplete"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Undo</span>
                      </button>
                      <div className="flex items-center gap-2 px-2 py-1 bg-[#107c10]/10 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-[#107c10]" />
                        {a.score !== undefined && (
                          <span className="text-[13px] font-bold text-[#107c10] tabular-nums">
                            {a.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clippy sidebar */}
          <ClippyAssistant
            dismissed={clippyDismissed}
            onDismiss={() => setClippyDismissed(true)}
            minimized={clippyMinimized}
            onToggleMinimize={() => setClippyMinimized(!clippyMinimized)}
            messages={clippyMessages}
            tips={clippyTips}
            currentTip={clippyTip}
            onTipChange={setClippyTip}
            listening={clippyListening}
            onToggleListening={() => setClippyListening(!clippyListening)}
            urgentDeadlines={urgentDeadlines}
            stats={stats}
            onUploadOutline={() => setShowOutlineUploader(true)}
            onNewDoc={() =>
              window.open("https://docs.google.com/document/create", "_blank")
            }
          />
        </div>
      </div>

      {/* Course Outline Upload Modal */}
      {showOutlineUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowOutlineUploader(false)}
          />
          <div className="relative w-full max-w-md backdrop-blur-xl bg-white/95 rounded-2xl border border-white/50 shadow-2xl overflow-hidden mx-4">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0078d4]/10 to-[#50e6ff]/10 border-b border-neutral-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center shadow-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-neutral-800">
                    Upload Course Outline
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    PDF, DOCX, or TXT with assignments and rubrics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOutlineUploader(false)}
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-6">
              {/* Course Code and Name inputs */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={uploadCourseCode}
                    onChange={(e) =>
                      setUploadCourseCode(e.target.value.toUpperCase())
                    }
                    placeholder="e.g. SC2006"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[12px] text-neutral-700 focus:outline-none focus:border-neutral-300"
                    disabled={uploadingOutline}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={uploadCourseName}
                    onChange={(e) => setUploadCourseName(e.target.value)}
                    placeholder="e.g. Software Engineering"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[12px] text-neutral-700 focus:outline-none focus:border-neutral-300"
                    disabled={uploadingOutline}
                  />
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-neutral-400 cursor-pointer transition-colors bg-neutral-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingOutline}
                />
                <File className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-[12px] text-neutral-700 mb-1 font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-[10px] text-neutral-500">
                  PDF, DOCX, or TXT (max 10MB)
                </p>
              </div>

              {uploadingOutline && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                    <span className="text-[12px] text-neutral-700">
                      Processing with AI OCR...
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 text-center">
                    Extracting course structure and rubrics
                  </p>
                </div>
              )}

              <p className="text-[10px] text-neutral-400 mt-4 text-center">
                Term is auto-set to Y2S2. Components and rubrics will be
                extracted automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal with Outlook integration */}
      {emailModalAssignment && currentEmailAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setEmailModalAssignment(null);
              setEmailData({ subject: "", body: "" });
            }}
          />
          <div className="relative w-full max-w-lg backdrop-blur-xl bg-white/95 rounded-2xl border border-white/50 shadow-2xl overflow-hidden mx-4">
            {/* Modal header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0078d4]/10 to-[#50e6ff]/10 border-b border-neutral-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078d4] to-[#0052a3] flex items-center justify-center shadow-lg">
                  <img
                    src="/outlook.png"
                    alt="Outlook"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-neutral-800">
                    Email Professor via Outlook
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Confirm submission of "{currentEmailAssignment.title}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEmailModalAssignment(null);
                  setEmailData({ subject: "", body: "" });
                }}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email form */}
            <div className="px-5 py-4 space-y-3">
              {/* To field */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-400 w-8 shrink-0">
                  To
                </span>
                <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-[12px] text-neutral-600">
                  {currentEmailAssignment.instructor}
                </div>
              </div>

              {/* Subject */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-400 w-8 shrink-0">
                  Subject
                </span>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) =>
                    setEmailData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-md text-[12px] text-neutral-700 focus:outline-none focus:border-neutral-300"
                />
              </div>

              {/* Body */}
              <div>
                {emailLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                    <span className="text-[12px] text-neutral-600">
                      Generating email with AI...
                    </span>
                  </div>
                ) : (
                  <textarea
                    value={emailData.body}
                    onChange={(e) =>
                      setEmailData((prev) => ({
                        ...prev,
                        body: e.target.value,
                      }))
                    }
                    rows={8}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-md text-[12px] text-neutral-700 leading-relaxed placeholder-neutral-400 focus:outline-none focus:border-neutral-300 resize-none"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-neutral-400">
                  AI-generated — review before sending
                </p>
                <button
                  onClick={() => {
                    if (currentEmailAssignment) {
                      setEmailLoading(true);
                      generateEmailWithOpenAI(
                        currentEmailAssignment,
                        currentEmailAssignment.instructor,
                      )
                        .then((email) => {
                          setEmailData(email);
                          setEmailLoading(false);
                        })
                        .catch(() => setEmailLoading(false));
                    }
                  }}
                  className="text-[10px] text-[#0078d4] hover:text-[#005a9e] font-medium"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {/* Modal actions */}
            <div className="px-5 py-4 border-t border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEmailModalAssignment(null);
                  setEmailData({ subject: "", body: "" });
                }}
                className="px-4 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailLoading || !emailData.body.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white text-[12px] font-semibold rounded-lg hover:from-[#106ebe] hover:to-[#005a9e] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Open in Outlook
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
