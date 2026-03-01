import { Course, SemesterInfo } from "@/types";

export function getWeekProgress(currentWeek: number, totalWeeks: number): number {
  return Math.round((currentWeek / totalWeeks) * 100);
}

export function getEstimatedTimeRemaining(course: Course): number {
  return course.topics
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + t.estimatedHours, 0);
}

export function getNextCheckpoint(course: Course) {
  return course.checkpoints.find(
    (cp) => cp.status === "upcoming" || cp.status === "in-progress"
  );
}

export function getCompletedTopicsCount(course: Course): number {
  return course.topics.filter((t) => t.completed).length;
}

export function getCourseAverage(course: Course): number {
  const scored = course.checkpoints.filter((cp) => cp.score !== undefined);
  if (scored.length === 0) return 0;
  return Math.round(
    scored.reduce((sum, cp) => sum + (cp.score ?? 0), 0) / scored.length
  );
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getDaysUntil(dateStr: string): number {
  const now = new Date("2026-03-01");
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getOverallGPA(courses: Course[]): number {
  const totalPoints = courses.reduce((sum, c) => {
    const gradePoints: Record<string, number> = {
      "A+": 4.0, "A": 4.0, "A-": 3.7,
      "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7,
    };
    return sum + (gradePoints[c.grade] || 0) * c.credits;
  }, 0);
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
    case "submitted":
      return "#107c10";
    case "in-progress":
      return "#0078d4";
    case "upcoming":
      return "#ffb900";
    case "pending":
      return "#8661c5";
    case "locked":
      return "#a0aec0";
    case "overdue":
      return "#d83b01";
    default:
      return "#64748b";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "completed": return "Completed";
    case "submitted": return "Submitted";
    case "in-progress": return "In Progress";
    case "upcoming": return "Upcoming";
    case "pending": return "Pending";
    case "locked": return "Locked";
    case "overdue": return "Overdue";
    default: return status;
  }
}

export function getMasteryColor(mastery: number): string {
  if (mastery >= 80) return "#107c10";
  if (mastery >= 60) return "#0078d4";
  if (mastery >= 40) return "#ffb900";
  if (mastery >= 20) return "#d83b01";
  return "#a0aec0";
}
