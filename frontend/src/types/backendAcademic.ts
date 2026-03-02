export type DbCourse = {
  id: string;
  code: string;
  name: string;
  term: string;
  created_at?: string;
  // Progress fields (optional, from progress endpoint)
  total_assignments?: number;
  completed_assignments?: number;
  progress?: number;
};

export type DbCourseOutline = {
  id: string;
  course_code: string;
  description: string;
  instructor: string;
  last_updated_at?: string;
};

export type DbCourseComponent = {
  id: string;
  course_code: string;
  name: string;
  weight: number; // 0..1
};

export type DbTopicNode = {
  id: string;
  course_code: string;
  parent_id?: string | null;
  title: string;
  order_index: number;
  created_at?: string;
};

export type DbAssignment = {
  id: string;
  course_code: string;
  title: string;
  description?: string;
  due_at: string; // ISO
  weight: number; // 0..1
  status: "not_started" | "in_progress" | "submitted";
  created_at?: string;
};

export type DbReminder = {
  id: string;
  assignment_id: string;
  remind_at: string;
  channel: string;
  message: string;
  status: "scheduled" | "sent" | "cancelled";
};

export type DbWorkPlan = {
  id: string;
  assignment_id: string;
  suggested_start_at: string;
  planned_hours: number;
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
};

// Progress types
export type ProgressOverview = {
  total_courses: number;
  total_assignments: number;
  completed_assignments: number;
  in_progress_assignments: number;
  completion_percentage: number;
  due_soon: DueSoonItem[];
  courses: DbCourse[];
};

export type DueSoonItem = {
  id: string;
  title: string;
  course_code: string;
  due_at: string;
  days_until: number;
};

export type TrafficItem = {
  id: string;
  title: string;
  course_code: string;
  status: "green" | "yellow" | "red" | "gray";
  due_at: string;
  assignment_status: string;
};

export type RerouteSuggestion = {
  id: string;
  title: string;
  course_code: string;
  severity: "critical" | "high" | "medium";
  message: string;
  action: string;
};
