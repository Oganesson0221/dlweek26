import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  BarChart3,
  Target,
  Lightbulb,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import pptxgen from "pptxgenjs";
import {
  analyzeProgress,
  generateWord,
  generatePpt,
  downloadUrl,
  generateTemplateStructure,
  getTemplateProgress,
  saveTemplateProgress,
  generateEmailDraft,
  type TemplateStructure,
  type ProgressAnalysis,
  type EmailDraft,
} from "@/api/academicApi";

interface TemplateEditorProps {
  assignmentId: string;
  assignmentTitle: string;
  courseCode: string;
  description?: string;
  dueDate?: string;
  weight?: number;
  instructorName?: string;
  initialContent?: string;
  onClose: () => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  assignmentId,
  assignmentTitle,
  courseCode,
  description,
  dueDate,
  weight,
  instructorName,
  initialContent,
  onClose,
}) => {
  // State
  const [content, setContent] = useState<string>("");
  const [sectionContents, setSectionContents] = useState<
    Record<string, string>
  >({});
  const [template, setTemplate] = useState<TemplateStructure | null>(null);
  const [progress, setProgress] = useState<ProgressAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "pptx" | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showProgress, setShowProgress] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Analyze progress with AI (defined before useEffects that use it)
  const handleAnalyzeProgress = useCallback(
    async (textToAnalyze?: string) => {
      if (!textToAnalyze || textToAnalyze.length < 20) return;

      setAnalyzing(true);
      try {
        // Extract only serializable data from template
        const templateData = template
          ? {
              title: String(template.title || ""),
              sections: (template.sections || []).map((s) => ({
                name: String(s.name || ""),
                description: String(s.description || ""),
                placeholder: String(s.placeholder || ""),
              })),
              guidelines: (template.guidelines || []).map((g) => String(g)),
              checklist: (template.checklist || []).map((c) => String(c)),
            }
          : undefined;

        const analysis = await analyzeProgress(
          String(assignmentId),
          String(textToAnalyze),
          templateData,
        );
        setProgress(analysis);
      } catch (error) {
        console.error("Failed to analyze progress:", error);
        // Don't show alert for automatic analysis
      } finally {
        setAnalyzing(false);
      }
    },
    [assignmentId, template],
  );

  // Load template and saved progress
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // If initialContent is provided, use it directly
        if (initialContent) {
          setContent(initialContent);
          // Generate template structure for the content
          try {
            const templateData = await generateTemplateStructure(
              assignmentId,
              "word",
            );
            setTemplate(templateData);
          } catch {
            // Use basic template if generation fails
            setTemplate({
              title: assignmentTitle,
              sections: [
                {
                  name: "Content",
                  description: "Main content",
                  placeholder: "",
                },
              ],
              guidelines: [],
              checklist: [],
            });
          }
          // Don't auto-analyze on load - user must click Analyze
          setLoading(false);
          return;
        }

        // Try to load saved progress first
        const savedProgress = await getTemplateProgress(assignmentId);
        if (savedProgress.content) {
          setContent(savedProgress.content);
          if (savedProgress.template_structure) {
            setTemplate(savedProgress.template_structure);
          }
          if (savedProgress.progress_stats) {
            setProgress(savedProgress.progress_stats);
          }
          if (savedProgress.last_saved) {
            setLastSaved(new Date(savedProgress.last_saved));
          }
        }

        // Generate template structure if not loaded
        if (!savedProgress.template_structure) {
          const templateData = await generateTemplateStructure(
            assignmentId,
            "word",
          );
          setTemplate(templateData);

          // Initialize content with template
          const templateContent = templateData.sections
            .map((s) => `## ${s.name}\n\n${s.placeholder}\n`)
            .join("\n");
          if (!savedProgress.content) {
            setContent(templateContent);
          }
        }
      } catch (error) {
        console.error("Failed to load template:", error);
        // Use fallback template
        setTemplate({
          title: assignmentTitle,
          sections: [
            {
              name: "Introduction",
              description: "Introduce your topic",
              placeholder: "[Write your introduction here]",
            },
            {
              name: "Main Content",
              description: "Present your main arguments",
              placeholder: "[Add your main content here]",
            },
            {
              name: "Conclusion",
              description: "Summarize your findings",
              placeholder: "[Write your conclusion here]",
            },
            {
              name: "References",
              description: "List your sources",
              placeholder: "[Add references here]",
            },
          ],
          guidelines: ["Follow assignment guidelines", "Cite sources properly"],
          checklist: ["All sections completed", "Proofread"],
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, assignmentTitle, initialContent]);

  // Auto-save only (no auto-analyze - user must click Analyze button)
  useEffect(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    // Auto-save after 5 seconds of inactivity
    autoSaveTimeout.current = setTimeout(() => {
      if (content && template) {
        handleSave(false);
      }
    }, 5000);

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [content, template]);

  // Save progress
  const handleSave = async (showFeedback = true) => {
    setSaving(true);
    try {
      // Sanitize data before saving
      const sanitizedTemplate = template
        ? {
            title: String(template.title || ""),
            sections: (template.sections || []).map((s) => ({
              name: String(s.name || ""),
              description: String(s.description || ""),
              placeholder: String(s.placeholder || ""),
            })),
            guidelines: (template.guidelines || []).map((g) => String(g)),
            checklist: (template.checklist || []).map((c) => String(c)),
          }
        : undefined;

      const sanitizedProgress = progress
        ? {
            overall_progress: Number(progress.overall_progress) || 0,
            sections: (progress.sections || []).map((s) => ({
              name: String(s.name || ""),
              status: String(s.status || "not_started"),
              completion_percent: Number(s.completion_percent) || 0,
              feedback: String(s.feedback || ""),
            })),
            strengths: (progress.strengths || []).map((s) => String(s)),
            improvements: (progress.improvements || []).map((i) => String(i)),
            estimated_score: progress.estimated_score,
            rubric_breakdown: progress.rubric_breakdown,
          }
        : undefined;

      await saveTemplateProgress(String(assignmentId), {
        content: String(content || ""),
        template_structure: sanitizedTemplate,
        progress_stats: sanitizedProgress,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save:", error);
      if (showFeedback) {
        alert("Failed to save progress");
      }
    } finally {
      setSaving(false);
    }
  };

  // Download as DOCX
  const downloadAsDocx = async () => {
    setDownloading("docx");
    try {
      // Create document using docx library
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: assignmentTitle,
                heading: HeadingLevel.TITLE,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Course: ${courseCode}`, bold: true }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Due Date: ${dueDate || "N/A"}`,
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({ text: "" }),
              ...content.split("\n").map(
                (line) =>
                  new Paragraph({
                    text: line,
                    heading: line.startsWith("##")
                      ? HeadingLevel.HEADING_2
                      : undefined,
                  }),
              ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${courseCode}_${assignmentTitle.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create DOCX:", error);
      // Fallback to backend generation
      try {
        const result = await generateWord(assignmentId);
        window.open(downloadUrl(result.download_url), "_blank");
      } catch (e) {
        alert("Failed to download document");
      }
    } finally {
      setDownloading(null);
    }
  };

  // Download as PPTX
  const downloadAsPptx = async () => {
    setDownloading("pptx");
    try {
      const pptx = new pptxgen();

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText(assignmentTitle, {
        x: 0.5,
        y: 2,
        w: "90%",
        h: 1,
        fontSize: 36,
        bold: true,
        align: "center",
      });
      titleSlide.addText(`${courseCode} | Due: ${dueDate || "N/A"}`, {
        x: 0.5,
        y: 3.5,
        w: "90%",
        h: 0.5,
        fontSize: 18,
        align: "center",
        color: "666666",
      });

      // Content slides from sections
      const sections = content.split(/##\s+/).filter(Boolean);
      sections.forEach((section, idx) => {
        const lines = section.trim().split("\n");
        const title = lines[0] || `Slide ${idx + 1}`;
        const body = lines.slice(1).join("\n").trim();

        const slide = pptx.addSlide();
        slide.addText(title, {
          x: 0.5,
          y: 0.5,
          w: "90%",
          h: 1,
          fontSize: 28,
          bold: true,
        });
        slide.addText(body || "Content goes here", {
          x: 0.5,
          y: 1.5,
          w: "90%",
          h: 4,
          fontSize: 16,
          valign: "top",
        });
      });

      const blob = (await pptx.write({ outputType: "blob" })) as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${courseCode}_${assignmentTitle.replace(/\s+/g, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create PPTX:", error);
      // Fallback to backend generation
      try {
        const result = await generatePpt(assignmentId);
        window.open(downloadUrl(result.download_url), "_blank");
      } catch (e) {
        alert("Failed to download presentation");
      }
    } finally {
      setDownloading(null);
    }
  };

  // Email draft
  const handleEmailDraft = async () => {
    setShowEmailModal(true);
    setEmailLoading(true);
    try {
      const draft = await generateEmailDraft(
        assignmentId,
        "submission_confirmation",
        "Student", // Could be passed as prop
      );
      setEmailDraft(draft);
    } catch (error) {
      console.error("Failed to generate email:", error);
      setEmailDraft({
        subject: `Submission Confirmation: ${assignmentTitle} (${courseCode})`,
        body: `Dear Professor${instructorName ? ` ${instructorName}` : ""},

I am writing to confirm that I have submitted "${assignmentTitle}" for ${courseCode}.

Please let me know if you need any additional information.

Best regards,
[Your Name]`,
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const sendEmail = () => {
    if (!emailDraft) return;

    const subject = encodeURIComponent(emailDraft.subject);
    const body = encodeURIComponent(emailDraft.body.replace(/\n/g, "\r\n"));
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?subject=${subject}&body=${body}`;
    window.open(outlookUrl, "_blank");
    setShowEmailModal(false);
  };

  // Progress color helper
  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "text-green-600 bg-green-100";
    if (percent >= 50) return "text-amber-600 bg-amber-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#0078d4]" />
          <p className="text-sm text-neutral-600">Loading template editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Editor Panel */}
      <div className="relative ml-auto w-full max-w-5xl h-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-[#0078d4]/5 to-[#50e6ff]/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">
                {assignmentTitle}
              </h2>
              <p className="text-sm text-neutral-500">
                {courseCode} • Due: {dueDate || "N/A"} • Weight: {weight || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Status */}
            {lastSaved && (
              <span className="text-xs text-neutral-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}

            {/* Save Button */}
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b flex items-center gap-3 flex-wrap">
          {/* Analyze Progress */}
          <button
            onClick={handleAnalyzeProgress}
            disabled={analyzing || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#5c2d91] to-[#b4a0ff] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 shadow-md"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze Progress
          </button>

          {/* Download Options */}
          <div className="flex items-center gap-1 border-l pl-3">
            <button
              onClick={downloadAsDocx}
              disabled={downloading === "docx"}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
            >
              {downloading === "docx" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download DOCX
            </button>
            <button
              onClick={downloadAsPptx}
              disabled={downloading === "pptx"}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
            >
              {downloading === "pptx" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Download PPTX
            </button>
          </div>

          {/* Email Prof */}
          <button
            onClick={handleEmailDraft}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0078d4] hover:bg-[#0078d4]/10 rounded-lg ml-auto"
          >
            <Mail className="w-4 h-4" />
            Email Prof
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Template Guidelines */}
            {template && template.guidelines && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  Guidelines:
                </p>
                <ul className="text-xs text-blue-600 space-y-0.5">
                  {template.guidelines.map((g, i) => (
                    <li key={i}>• {g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Text Editor */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your assignment here..."
              className="w-full h-[calc(100%-120px)] p-4 text-sm text-neutral-700 leading-relaxed border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 resize-none font-mono"
            />

            {/* Checklist */}
            {template && template.checklist && (
              <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs font-semibold text-neutral-700 mb-2">
                  Submission Checklist:
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.checklist.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress Sidebar */}
          {showProgress && (
            <div className="w-80 border-l bg-neutral-50 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#5c2d91]" />
                  Progress Analysis
                </h3>
                <button
                  onClick={() => setShowProgress(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>

              {progress ? (
                <div className="space-y-4">
                  {/* Overall Progress */}
                  <div className="p-4 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-neutral-500">
                        Overall Progress
                      </span>
                      <span
                        className={`text-lg font-bold ${progress.overall_progress >= 80 ? "text-green-600" : progress.overall_progress >= 50 ? "text-amber-600" : "text-red-600"}`}
                      >
                        {progress.overall_progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progress.overall_progress >= 80 ? "bg-green-500" : progress.overall_progress >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${progress.overall_progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Estimated Score */}
                  {progress.estimated_score !== undefined && (
                    <div className="p-3 bg-gradient-to-r from-[#5c2d91]/10 to-[#b4a0ff]/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#5c2d91]" />
                        <span className="text-xs font-medium text-neutral-600">
                          Estimated Score
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-[#5c2d91] mt-1">
                        {progress.estimated_score}%
                      </p>
                    </div>
                  )}

                  {/* Sections */}
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-600 mb-2">
                      Section Progress
                    </h4>
                    <div className="space-y-2">
                      {progress.sections.map((section, i) => (
                        <div
                          key={i}
                          className="p-2 bg-white rounded-lg shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-700">
                              {section.name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                section.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : section.status === "in_progress"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              {section.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="h-1 bg-neutral-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                section.status === "completed"
                                  ? "bg-green-500"
                                  : section.status === "in_progress"
                                    ? "bg-amber-500"
                                    : "bg-neutral-300"
                              }`}
                              style={{
                                width: `${section.completion_percent}%`,
                              }}
                            />
                          </div>
                          {section.feedback && (
                            <p className="text-[10px] text-neutral-500 mt-1">
                              {section.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  {progress.strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Strengths
                      </h4>
                      <ul className="text-xs text-neutral-600 space-y-1">
                        {progress.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {progress.improvements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Areas to Improve
                      </h4>
                      <ul className="text-xs text-neutral-600 space-y-1">
                        {progress.improvements.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rubric Breakdown */}
                  {progress.rubric_breakdown &&
                    progress.rubric_breakdown.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-600 mb-2">
                          Rubric Breakdown
                        </h4>
                        <div className="space-y-2">
                          {progress.rubric_breakdown.map((r, i) => (
                            <div
                              key={i}
                              className="p-2 bg-white rounded-lg shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-700">
                                  {r.criteria}
                                </span>
                                <span className="text-xs font-bold text-[#5c2d91]">
                                  {r.estimated_points}/{r.max_points}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500 mt-0.5">
                                {r.feedback}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Refresh Analysis */}
                  <button
                    onClick={handleAnalyzeProgress}
                    disabled={analyzing}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#5c2d91] bg-[#5c2d91]/10 rounded-lg hover:bg-[#5c2d91]/20"
                  >
                    {analyzing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-3.5 h-3.5" />
                    )}
                    Refresh Analysis
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="w-8 h-8 text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-500 mb-1">
                    No analysis yet
                  </p>
                  <p className="text-xs text-neutral-400">
                    Click "Analyze Progress" to get AI feedback
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Show Progress Toggle */}
          {!showProgress && (
            <button
              onClick={() => setShowProgress(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-4 bg-[#5c2d91] text-white rounded-l-lg shadow-lg"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEmailModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0078d4]/10 to-[#50e6ff]/10 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0078d4] to-[#0052a3] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    Email Professor
                  </p>
                  <p className="text-xs text-neutral-500">
                    Confirm submission of "{assignmentTitle}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-3">
              {emailLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                  <span className="text-sm text-neutral-600">
                    Generating email with AI...
                  </span>
                </div>
              ) : emailDraft ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-neutral-500">
                      Subject
                    </label>
                    <input
                      value={emailDraft.subject}
                      onChange={(e) =>
                        setEmailDraft({
                          ...emailDraft,
                          subject: e.target.value,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500">
                      Body
                    </label>
                    <textarea
                      value={emailDraft.body}
                      onChange={(e) =>
                        setEmailDraft({ ...emailDraft, body: e.target.value })
                      }
                      rows={8}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none"
                    />
                  </div>
                </>
              ) : null}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t bg-neutral-50 flex justify-end gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailLoading || !emailDraft}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
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

export default TemplateEditor;
