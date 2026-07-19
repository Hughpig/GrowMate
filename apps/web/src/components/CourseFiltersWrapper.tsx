"use client";

import { useState } from "react";
import { CourseFilters } from "@/components/CourseFilters";

interface Course {
  id: string;
  title: string;
  level: string;
  durationMin: number;
}

interface CourseFiltersWrapperProps {
  courses: Course[];
  children: (filteredCourses: Course[]) => React.ReactNode;
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