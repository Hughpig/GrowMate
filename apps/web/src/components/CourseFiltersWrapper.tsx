"use client";

import { useState } from "react";
import { CourseFilters, type CourseFilterItem } from "@/components/CourseFilters";

interface CourseFiltersWrapperProps {
  courses: CourseFilterItem[];
  children: (filteredCourses: CourseFilterItem[]) => React.ReactNode;
}

export function CourseFiltersWrapper({ courses, children }: CourseFiltersWrapperProps) {
  const [filteredCourses, setFilteredCourses] = useState(courses);

  return (
    <div className="space-y-6">
      <CourseFilters
        courses={courses}
        onFilter={setFilteredCourses}
      />
      {children(filteredCourses)}
    </div>
  );
}
