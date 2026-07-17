"use client";

import { useState } from "react";
import { Bell, Target, Calendar, CheckCircle } from "lucide-react";

interface LearningGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
  completed: boolean;
}

interface StudyReminderProps {
  completedCourses: number;
  totalCourses: number;
  studyTime: number;
}

export function StudyReminder({ completedCourses, totalCourses, studyTime }: StudyReminderProps) {
  const [goals, setGoals] = useState<LearningGoal[]>([
    {
      id: "1",
      title: "每日学习",
      target: 30,
      current: Math.round(studyTime / 7),
      unit: "分钟",
      deadline: "每周日",
      completed: Math.round(studyTime / 7) >= 30
    },
    {
      id: "2", 
      title: "课程完成",
      target: 3,
      current: completedCourses,
      unit: "门课程",
      deadline: "本月月底",
      completed: completedCourses >= 3
    },
    {
      id: "3",
      title: "学习时长",
      target: 300,
      current: studyTime,
      unit: "分钟",
      deadline: "本周结束",
      completed: studyTime >= 300
    }
  ]);

  const toggleGoalCompletion = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id 
        ? { ...goal, completed: !goal.completed }
        : goal
    ));
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-bold">学习目标与提醒</h3>
          <p className="text-sm text-stone-600">
            已完成 {completedGoals} / {totalGoals} 个目标
          </p>
        </div>
      </div>

      {/* 目标进度概览 */}
      <div className="mb-6">
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
            style={{ width: `${(completedGoals / totalGoals) * 100}%` }}
          />
        </div>
      </div>

      {/* 学习目标列表 */}
      <div className="space-y-4 mb-6">
        {goals.map((goal) => (
          <div 
            key={goal.id} 
            className={`p-4 rounded-lg border transition-colors ${
              goal.completed 
                ? "bg-green-50 border-green-200" 
                : "bg-white border-stone-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleGoalCompletion(goal.id)}
                  className={`p-1 rounded ${
                    goal.completed 
                      ? "text-green-600 bg-green-100" 
                      : "text-stone-400 hover:text-green-600 hover:bg-green-100"
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${goal.completed ? "fill-current" : ""}`} />
                </button>
                <h4 className={`font-medium ${
                  goal.completed ? "text-green-800 line-through" : "text-stone-800"
                }`}>
                  {goal.title}
                </h4>
              </div>
              {goal.deadline && (
                <div className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded">
                  截止: {goal.deadline}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">
                  进度: {goal.current} / {goal.target} {goal.unit}
                </span>
                <span className={`text-sm font-medium ${getProgressColor(goal.current, goal.target)}`}>
                  {getProgressPercentage(goal.current, goal.target)}%
                </span>
              </div>
              
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    goal.completed 
                      ? "bg-green-500" 
                      : getProgressColor(goal.current, goal.target).replace("text-", "bg-")
                  }`}
                  style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                />
              </div>

              {!goal.completed && goal.current < goal.target && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  还需 {goal.target - goal.current} {goal.unit} 完成目标
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 学习提醒 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          今日学习提醒
        </h4>
        <div className="space-y-1 text-sm text-blue-700">
          <p>• 建议今天学习 30-45 分钟，保持学习节奏</p>
          <p>• 可以复习昨天学习的内容，加深记忆</p>
          <p>• 遇到问题及时记录，在社区中寻求帮助</p>
          <p>• 完成学习后记得标记进度，保持动力</p>
        </div>
      </div>

      {/* 激励语句 */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-800 font-medium text-center">
          {completedGoals === totalGoals 
            ? "🎉 恭喜！你已完成所有学习目标，继续保持！" 
            : "💪 坚持就是胜利！每一步都让你更接近目标！"
          }
        </p>
      </div>
    </div>
  );
}