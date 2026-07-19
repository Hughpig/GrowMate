"use client";

import { useState, useEffect, useMemo } from "react";

export type CourseFilterItem = {
  id: string;
  title: string;
  level: string;
  durationMin: number;
};

interface CourseFiltersProps {
  courses: CourseFilterItem[];
  onFilter: (filteredCourses: CourseFilterItem[]) => void;
}

export function CourseFilters({ courses, onFilter }: CourseFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const levels = ["beginner", "intermediate", "advanced"];
  const levelLabels: Record<string, string> = {
    beginner: "入门",
    intermediate: "进阶",
    advanced: "高级",
  };
  const durationRanges = [
    { label: "全部", value: "all", min: 0, max: Infinity },
    { label: "短时间 (≤15分钟)", value: "short", min: 0, max: 15 },
    { label: "中等 (15-45分钟)", value: "medium", min: 15, max: 45 },
    { label: "长时间 (>45分钟)", value: "long", min: 46, max: Infinity },
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.title.includes(searchTerm);

      const matchesLevel = levelFilter === "all" || course.level === levelFilter;

      let matchesDuration = true;
      if (durationFilter !== "all") {
        const range = durationRanges.find((r) => r.value === durationFilter);
        if (range) {
          matchesDuration =
            course.durationMin >= range.min && course.durationMin <= range.max;
        }
      }

      return matchesSearch && matchesLevel && matchesDuration;
    });
  }, [courses, searchTerm, levelFilter, durationFilter]);

  useEffect(() => {
    onFilter(filteredCourses);
  }, [filteredCourses, onFilter]);

  return (
    <div className="space-y-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200">
      <div>
        <label className="label mb-2">搜索课程</label>
        <input
          type="text"
          placeholder="搜索课程标题..."
          className="input w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <label className="label mb-2">课程级别</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`badge cursor-pointer ${
              levelFilter === "all" ? "badge-brand" : ""
            }`}
            onClick={() => setLevelFilter("all")}
          >
            全部
          </button>
          {levels.map((level) => (
            <button
              key={level}
              className={`badge cursor-pointer ${
                levelFilter === level ? "badge-brand" : ""
              }`}
              onClick={() => setLevelFilter(level)}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label mb-2">课程时长</label>
        <div className="flex flex-wrap gap-2">
          {durationRanges.map((range) => (
            <button
              key={range.value}
              className={`badge cursor-pointer ${
                durationFilter === range.value ? "badge-brand" : ""
              }`}
              onClick={() => setDurationFilter(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-stone-500">
        找到 {filteredCourses.length} 个课程
      </div>
    </div>
  );
}
