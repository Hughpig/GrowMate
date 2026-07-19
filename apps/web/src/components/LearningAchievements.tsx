"use client";

import { Award, Star, Trophy, Target, Clock, Flame } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earned: boolean;
  progress?: number;
  max?: number;
}

interface LearningAchievementsProps {
  completedCourses: number;
  totalCourses: number;
  studyTime: number; // in minutes
}

export function LearningAchievements({ 
  completedCourses, 
  totalCourses, 
  studyTime 
}: LearningAchievementsProps) {
  const achievements: Achievement[] = [
    {
      id: "first-course",
      title: "初学者",
      description: "完成第一门课程",
      icon: Star,
      earned: completedCourses >= 1,
    },
    {
      id: "consistent-learner",
      title: "坚持学习者",
      description: "连续学习7天",
      icon: Target,
      earned: studyTime >= 420, // 7 hours
    },
    {
      id: "course-completion",
      title: "课程完成者",
      description: "完成50%的课程",
      icon: Trophy,
      earned: totalCourses > 0 && completedCourses >= Math.ceil(totalCourses * 0.5),
    },
    {
      id: "master-learner",
      title: "学习大师",
      description: "完成所有课程",
      icon: Award,
      earned: completedCourses >= totalCourses && totalCourses > 0,
    },
    {
      id: "time-warrior",
      title: "时间战士",
      description: "累计学习时间达到10小时",
      icon: Clock,
      earned: studyTime >= 600,
      progress: studyTime,
      max: 600,
    },
    {
      id: "week-streak",
      title: "周度达人",
      description: "一周内完成3门课程",
      icon: Flame,
      earned: completedCourses >= 3,
    },
  ];

  const earnedCount = achievements.filter(a => a.earned).length;
  const progressPercentage = (earnedCount / achievements.length) * 100;

  const getProgressColor = (progress: number, max: number) => {
    const percentage = (progress / max) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    if (percentage >= 25) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <div>
          <h3 className="text-lg font-bold">学习成就</h3>
          <p className="text-sm text-stone-600">
            已获得 {earnedCount} / {achievements.length} 个成就
          </p>
        </div>
      </div>

      {/* 成就进度条 */}
      <div className="mb-4">
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {achievements.map((achievement) => {
          const IconComponent = achievement.icon;
          return (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                achievement.earned 
                  ? "bg-yellow-50 border-yellow-200" 
                  : "bg-stone-50 border-stone-200 opacity-60"
              }`}
            >
              <div className={`p-2 rounded-lg ${
                achievement.earned 
                  ? "bg-yellow-100 text-yellow-600" 
                  : "bg-stone-100 text-stone-400"
              }`}>
                <IconComponent className="w-4 h-4" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-medium ${
                    achievement.earned ? "text-yellow-800" : "text-stone-600"
                  }`}>
                    {achievement.title}
                  </h4>
                  {achievement.earned && (
                    <Award className="w-3 h-3 text-yellow-600" />
                  )}
                </div>
                <p className="text-xs text-stone-600">{achievement.description}</p>
                
                {achievement.progress !== undefined && achievement.max !== undefined && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-stone-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            getProgressColor(achievement.progress, achievement.max)
                          }`}
                          style={{ 
                            width: `${Math.min(100, (achievement.progress / achievement.max) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-stone-500">
                        {achievement.progress}/{achievement.max}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 成就统计 */}
      <div className="mt-4 pt-4 border-t border-stone-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-yellow-600">{completedCourses}</div>
            <div className="text-xs text-stone-600">已完成课程</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{Math.round(studyTime / 60)}h</div>
            <div className="text-xs text-stone-600">学习时长</div>
          </div>
        </div>
      </div>
    </div>
  );
}