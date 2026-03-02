import { apiClient } from "./apiClient";
import type {
  DbCourse,
  DbCourseOutline,
  DbCourseComponent,
  DbTopicNode,
  DbAssignment,
  DbReminder,
  DbWorkPlan,
} from "@/types/backendAcademic";

export async function listCourses(): Promise<DbCourse[]> {
  const res = await apiClient.get("/academic/courses");
  return res.data;
}

export async function getCourse(courseCode: string): Promise<DbCourse> {
  const res = await apiClient.get(`/academic/courses/${courseCode}`);
  return res.data;
}

export async function getCourseOutline(
  courseCode: string,
): Promise<DbCourseOutline | null> {
  const res = await apiClient.get(`/academic/courses/${courseCode}/outline`);
  const data = res.data;
  // Backend may return either:
  // 1) raw outline object
  // 2) { course_code, outline: {...} | null }
  if (data && typeof data === "object" && "outline" in data) {
    return data.outline ?? null;
  }
  return data ?? null;
}

export async function getCourseComponents(
  courseCode: string,
): Promise<DbCourseComponent[]> {
  const res = await apiClient.get(`/academic/courses/${courseCode}/components`);
  const data = res.data;
  // Backend may return either:
  // 1) raw component array
  // 2) { course_code, components: [...] }
  if (data && typeof data === "object" && "components" in data) {
    return data.components ?? [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getCourseTopics(
  courseCode: string,
): Promise<DbTopicNode[]> {
  const res = await apiClient.get(`/academic/courses/${courseCode}/topics`);
  return res.data;
}

export async function listAssignments(
  courseCode: string,
): Promise<DbAssignment[]> {
  const res = await apiClient.get(
    `/academic/submissions/courses/${courseCode}/assignments`,
  );
  return res.data.assignments ?? res.data;
}

export async function getAssignmentReminders(
  assignmentId: number,
): Promise<DbReminder[]> {
  const res = await apiClient.get(
    `/academic/submissions/assignments/${assignmentId}/reminders`,
  );
  return res.data.reminders ?? [];
}

export async function getAssignmentWorkplan(
  assignmentId: number,
): Promise<DbWorkPlan | null> {
  const res = await apiClient.get(
    `/academic/submissions/assignments/${assignmentId}/workplan`,
  );
  return res.data.workplan ?? null;
}

export async function createAssignment(
  courseCode: string,
  body: {
    title: string;
    description?: string;
    due_at: string;
    weight: number;
  },
) {
  const res = await apiClient.post(
    `/academic/submissions/courses/${courseCode}/assignments`,
    body,
  );
  return res.data;
}

export async function updateAssignmentStatus(
  assignmentId: number,
  status: string,
) {
  const res = await apiClient.patch(
    `/academic/submissions/assignments/${assignmentId}/status`,
    { status },
  );
  return res.data;
}

export async function uploadCourseOutline(body: {
  code: string;
  name: string;
  file: File;
  term?: string;
}) {
  const form = new FormData();
  form.append("code", body.code);
  form.append("name", body.name);
  form.append("term", body.term ?? "Y2S2");
  form.append("file", body.file);

  const res = await apiClient.post("/academic/courses/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 minutes for file upload + AI processing
  });
  return res.data;
}

export async function generateWord(assignmentId: number) {
  const res = await apiClient.post(`/academic/templates/word`, {
    assignment_id: assignmentId,
  });
  return res.data;
}

export async function generatePpt(assignmentId: number) {
  const res = await apiClient.post(`/academic/templates/ppt`, {
    assignment_id: assignmentId,
  });
  return res.data;
}

export function downloadUrl(downloadPath: string) {
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
  return `${base}${downloadPath}`;
}

// ============ PROGRESS ENDPOINTS ============

export async function getProgressOverview() {
  const res = await apiClient.get("/academic/progress/overview");
  return res.data;
}

export async function getCourseProgress(courseId: string) {
  const res = await apiClient.get(`/academic/progress/courses/${courseId}`);
  return res.data;
}

export async function getProgressTimeline() {
  const res = await apiClient.get("/academic/progress/timeline");
  return res.data;
}

export async function getProgressTraffic() {
  const res = await apiClient.get("/academic/progress/traffic");
  return res.data;
}

export async function getProgressReroute() {
  const res = await apiClient.get("/academic/progress/reroute");
  return res.data;
}

// ============ DEADLINE ENDPOINTS ============

export async function checkDeadlineConflicts(assignmentIds: string[]) {
  const res = await apiClient.post("/academic/deadlines/conflicts", {
    assignment_ids: assignmentIds,
  });
  return res.data;
}

export async function suggestStartDate(
  assignmentId: string,
  plannedHours: number = 6,
  difficulty: string = "medium",
) {
  const res = await apiClient.post("/academic/deadlines/suggest_start", {
    assignment_id: assignmentId,
    planned_hours: plannedHours,
    difficulty,
  });
  return res.data;
}

export async function getDueReminders() {
  const res = await apiClient.get("/academic/deadlines/reminders/due");
  return res.data;
}

// ============ COPILOT HOOKS ============

export async function draftAssignment(body: {
  course_code: string;
  assignment_title: string;
  description?: string;
  due_at?: string;
  weight?: number;
}) {
  const res = await apiClient.post("/academic/copilot/draft_assignment", body);
  return res.data;
}

export async function getAssignmentSuggestions(
  courseCode: string,
  context?: string,
) {
  const res = await apiClient.post(
    `/academic/copilot/assignment_suggestions/${courseCode}`,
    { context },
  );
  return res.data;
}

// ============ COURSE CREATION ============

export async function createCourse(body: {
  code: string;
  name: string;
  term?: string;
}) {
  const res = await apiClient.post("/academic/courses", body);
  return res.data;
}

export async function updateCourseOutline(
  courseCode: string,
  body: { description: string; instructor: string },
) {
  const res = await apiClient.put(
    `/academic/courses/${courseCode}/outline`,
    body,
  );
  return res.data;
}

export async function updateCourseComponents(
  courseCode: string,
  components: Array<{ name: string; weight: number }>,
) {
  const res = await apiClient.put(
    `/academic/courses/${courseCode}/components`,
    components,
  );
  return res.data;
}

export async function addCourseTopic(
  courseCode: string,
  body: { parent_id?: string; title: string; order_index: number },
) {
  const res = await apiClient.post(
    `/academic/courses/${courseCode}/topics`,
    body,
  );
  return res.data;
}
