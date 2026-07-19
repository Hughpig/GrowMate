"use client";

import { useState } from "react";
import { CourseFilters } from "@/components/CourseFilters";

interface CourseFiltersWrapperProps {
  courses: Array<{
    id: string;
    title: string;
    level: string;
    durationMin: number;
  }>;
  children: (filteredCourses: typeof courses) => React.ReactNode;
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