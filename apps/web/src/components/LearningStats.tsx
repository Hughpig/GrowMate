"use client";

import { TrendingUp, Clock, Target, BookOpen } from "lucide-react";

interface LearningStatsProps {
  completedCourses: number;
  totalCourses: number;
  studyTime: number; // in minutes
  courseDistribution: Array<{
    level: string;
    count: number;
  }>;
}

export function LearningStats({ 
  completedCourses, 
  totalCourses, 
  studyTime, 
  courseDistribution 
}: LearningStatsProps) {
  const progress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  
  const studyHours = Math.floor(studyTime / 60);
  const studyMinutes = studyTime % 60;
  
  const stats = [
    {
      icon: BookOpen,
      title: "课程完成",
      value: `${completedCourses}/${totalCourses}`,
      subtitle: `${progress}%`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      progress: progress
    },
    {
      icon: Clock,
      title: "学习时长",
      value: `${studyHours}h ${studyMinutes}m`,
      subtitle: "本周总计",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Target,
      title: "日均学习",
      value: `${Math.round(studyTime / 7)}m`,
      subtitle: "每天平均",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: TrendingUp,
      title: "学习效率",
      value: `${Math.round(completedCourses / (studyTime / 60) * 10)}/10h`,
      subtitle: "每小时课程",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const maxLevelCount = Math.max(...courseDistribution.map(item => item.count), 1);

  return (
    <div className="card p-5">
      <h3 className="text-lg font-bold mb-4">学习数据分析</h3>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`p-3 rounded-lg ${stat.bgColor} border`}>
              <div className="flex items-center gap-2 mb-1">
                <IconComponent className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-medium text-stone-600">{stat.title}</span>
              </div>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-stone-500">{stat.subtitle}</div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 课程级别分布 */}
        <div>
          <h4 className="text-sm font-medium text-stone-700 mb-3">课程级别分布</h4>
          <div className="space-y-3">
            {courseDistribution.map((item) => {
              const percentage = (item.count / maxLevelCount) * 100;
              const levelColors = {
                "入门": "bg-green-500",
                "进阶": "bg-blue-500", 
                "高级": "bg-purple-500"
              };
              
              return (
                <div key={item.level} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600">{item.level}</span>
                    <span className="text-stone-500">{item.count} 课</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${levelColors[item.level as keyof typeof levelColors] || "bg-gray-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 每周学习时间 */}
        <div>
          <h4 className="text-sm font-medium text-stone-700 mb-3">每周学习时间（分钟）</h4>
          <div className="space-y-3">
            {[
              { day: "周一", time: 45 },
              { day: "周二", time: 30 },
              { day: "周三", time: 60 },
              { day: "周四", time: 25 },
              { day: "周五", time: 90 },
              { day: "周六", time: 120 },
              { day: "周日", time: 75 },
            ].map((item, index) => {
              const maxTime = 120;
              const percentage = (item.time / maxTime) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-600">{item.day}</span>
                    <span className="text-stone-500">{item.time}m</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-teal-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 学习洞察 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
        <h4 className="text-sm font-medium text-teal-800 mb-2">学习洞察</h4>
        <div className="space-y-1 text-xs text-teal-700">
          <p>• 本周学习时间总计 {studyHours}小时{studyMinutes}分钟</p>
          <p>• 周六是你的学习高峰期，学习时间最长</p>
          <p>• 入门课程完成度 {progress}%，表现优秀</p>
          <p>• 平均每天学习 {Math.round(studyTime / 7)} 分钟，建议保持</p>
        </div>
      </div>
    </div>
  );
}