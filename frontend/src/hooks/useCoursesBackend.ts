import { useEffect, useState, useCallback } from "react";
import type { Course } from "@/types";
import { buildCourseFromBackend } from "@/adapters/courseAdapter";
import {
  listCourses,
  getCourse,
  getCourseOutline,
  getCourseComponents,
  getCourseTopics,
  listAssignments,
} from "@/api/academicApi";

function computeSemesterInfo(startDateISO?: string) {
  const totalWeeks = 13;
  const startDate = startDateISO ? new Date(startDateISO) : new Date();
  const now = new Date();

  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(diffDays / 7) + 1));

  return { startDate, totalWeeks, currentWeek };
}

export function useCoursesBackend() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // optional env override
  const semesterStart = import.meta.env.VITE_SEMESTER_START_DATE as string | undefined;
  const semesterInfo = computeSemesterInfo(semesterStart);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dbCourses = await listCourses();

      const built = await Promise.all(
        dbCourses.map(async (dc) => {
          const code = dc.code;

          const [c, o, comps, topics, assigns] = await Promise.all([
            getCourse(code),
            getCourseOutline(code),
            getCourseComponents(code),
            getCourseTopics(code),
            listAssignments(code),
          ]);

          return buildCourseFromBackend({
            course: c,
            outline: o,
            components: comps,
            topics,
            assignments: assigns,
          });
        }),
      );

      setCourses(built);
    } catch (e: any) {
      setError(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { courses, semesterInfo, loading, error, refetch: fetchAll };
}