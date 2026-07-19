"use client";

import { useState, useEffect } from "react";


interface Course {
  id: string;
  title: string;
  level: string;
  durationMin: number;
}

interface CourseFiltersProps {
  courses: Course[];
  onFilter: (filteredCourses: Course[]) => void;
}

export function CourseFilters({ courses, onFilter }: CourseFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const levels = ["入门", "进阶", "高级"];
  const durationRanges = [
    { label: "全部", value: "all", max: Infinity },
    { label: "短时间 (≤15分钟)", value: "short", max: 15 },
    { label: "中等 (15-45分钟)", value: "medium", min: 15, max: 45 },
    { label: "长时间 (>45分钟)", value: "long", min: 46 },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.includes(searchTerm);
    
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    
    let matchesDuration = true;
    if (durationFilter !== "all") {
      const range = durationRanges.find(r => r.value === durationFilter);
      if (range) {
        if (range.min) {
          matchesDuration = course.durationMin >= range.min;
        }
        if (range.max) {
          matchesDuration = course.durationMin <= range.max;
        }
      }
    }

    return matchesSearch && matchesLevel && matchesDuration;
  });

  useEffect(() => {
    onFilter(filteredCourses);
  }, [filteredCourses, onFilter]);

  return (
    <div className="space-y-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200">
      {/* 搜索框 */}
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

      {/* 级别筛选 */}
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
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* 时长筛选 */}
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

      {/* 结果统计 */}
      <div className="text-sm text-stone-500">
        找到 {filteredCourses.length} 个课程
      </div>
    </div>
  );
}