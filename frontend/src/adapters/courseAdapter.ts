import type {
  Course,
  CourseOutlineComponent,
  CourseTopic,
  Assignment,
  Checkpoint,
  CheckpointType,
} from "@/types";
import type {
  DbCourse,
  DbCourseOutline,
  DbCourseComponent,
  DbTopicNode,
  DbAssignment,
} from "@/types/backendAcademic";

// helper: pick a consistent id scheme for frontend (string)
const cid = (code: string) => code.toLowerCase();

function mapComponents(
  components: DbCourseComponent[],
  outlineText?: string,
): CourseOutlineComponent[] {
  return components.map((c) => ({
    name: c.name,
    weight: Math.round(c.weight * 100), // frontend expects maybe %
    description: outlineText?.slice(0, 120) || "",
  }));
}

function mapTopics(topics: DbTopicNode[]): CourseTopic[] {
  // Your backend TopicNode doesn't store week/mastery yet
  // We fill reasonable defaults so UI can render.
  return topics
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((t, idx) => ({
      id: String(t.id),
      name: t.title,
      weekNumber: Math.max(1, idx + 1),
      completed: false,
      mastery: 0,
      estimatedHours: 2,
      dependencies: [],
      description: "",
    }));
}

function mapAssignments(
  courseCode: string,
  courseId: string,
  items: DbAssignment[],
): Assignment[] {
  // map backend status -> frontend SubmissionStatus
  const statusMap: Record<DbAssignment["status"], Assignment["status"]> = {
    not_started: "pending",
    in_progress: "in-progress",
    submitted: "submitted",
  };

  // choose a type/fileType default (you can improve later)
  return items.map((a) => ({
    id: String(a.id),
    courseId,
    title: a.title,
    description: a.description || "",
    dueDate: a.due_at,
    status: statusMap[a.status],
    type: "problem-set",
    fileType: "docx",
    score: undefined,
    maxScore: 100,
    weight: Math.round(a.weight * 100),
    topics: [],
  }));
}

export function buildCourseFromBackend(args: {
  course: DbCourse;
  outline: DbCourseOutline | null;
  components: DbCourseComponent[];
  topics: DbTopicNode[];
  assignments: DbAssignment[];
}): Course {
  const { course, outline, components, topics, assignments } = args;

  const courseId = cid(course.code);
  const mappedTopics = mapTopics(topics);
  const mappedAssignments = mapAssignments(course.code, courseId, assignments);

  // Minimal checkpoints derived from components (optional)
  const checkpoints = components.map((c, idx) => {
    const inferredType = c.name.toLowerCase().includes("final")
      ? ("final" as const)
      : ("assignment" as const);

    return {
      id: `${courseId}-cp-${idx}`,
      courseId,
      name: c.name,
      type: inferredType, // now "final" | "assignment" (not string)
      weekNumber: idx + 1,
      date: new Date().toISOString(),
      status: "upcoming" as const,
      maxScore: 100,
      weight: Math.round(c.weight * 100),
      topics: [],
      estimatedPrepTime: 2,
      description: "",
    };
  });

  return {
    id: courseId,
    name: course.name,
    code: course.code,
    color: "#0078d4",
    icon: "BookOpen",
    progress: 0,
    currentWeek: 1,
    totalWeeks: 13,
    grade: "B+",
    credits: 4,
    instructor: outline?.instructor || "TBA",
    topics: mappedTopics,
    checkpoints,
    assignments: mappedAssignments,
    schedule: course.term,
    status: "active",
    courseOutline: mapComponents(components, outline?.description),
  };
}
