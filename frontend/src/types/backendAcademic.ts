export type DbCourse = {
  id: number;
  code: string;
  name: string;
  term: string;
  created_at?: string;
};

export type DbCourseOutline = {
  id: number;
  course_id: number;
  description: string;
  instructor: string;
  last_updated_at?: string;
};

export type DbCourseComponent = {
  id: number;
  course_id: number;
  name: string;
  weight: number; // 0..1
};

export type DbTopicNode = {
  id: number;
  course_id: number;
  parent_id?: number | null;
  title: string;
  order_index: number;
  created_at?: string;
};

export type DbAssignment = {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  due_at: string; // ISO
  weight: number; // 0..1
  status: "not_started" | "in_progress" | "submitted";
  created_at?: string;
};

export type DbReminder = {
  id: number;
  assignment_id: number;
  remind_at: string;
  channel: string;
  message: string;
  status: "scheduled" | "sent" | "cancelled";
};

export type DbWorkPlan = {
  id: number;
  assignment_id: number;
  suggested_start_at: string;
  planned_hours: number;
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
};
