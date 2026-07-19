"use client";

import { useState } from "react";
import { TrendingUp, Clock, Target, Lightbulb } from "lucide-react";

interface LearningRecommendationProps {
  completedCourses: number;
  totalCourses: number;
  nextRecommendedCourse?: {
    title: string;
    reason: string;
  };
}

export function LearningRecommendation({ 
  completedCourses, 
  totalCourses, 
  nextRecommendedCourse 
}: LearningRecommendationProps) {
  const [showDetails, setShowDetails] = useState(false);

  const progress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  
  const getProgressMessage = () => {
    if (progress === 0) return "开始你的学习之旅！";
    if (progress < 25) return "良好的开始，继续加油！";
    if (progress < 50) return "进展不错，保持动力！";
    if (progress < 75) return "已经过半，即将完成！";
    if (progress < 100) return "即将完成，最后冲刺！";
    return "恭喜完成所有课程！";
  };

  const getRecommendation = () => {
    if (progress === 0) {
      return {
        icon: Target,
        title: "建议从基础开始",
        description: "建议先完成入门课程，为后续学习打下坚实基础。",
        tips: ["每天坚持学习30分钟", "做好笔记和总结", "遇到问题及时提问"]
      };
    }
    
    if (progress < 50) {
      return {
        icon: Lightbulb,
        title: "加强实践练习",
        description: "理论学习后，建议多动手实践，加深理解。",
        tips: ["尝试自己实现项目", "参与开源项目", "多做练习题"]
      };
    }
    
    if (progress < 100) {
      return {
        icon: Clock,
        title: "保持学习节奏",
        description: "已经完成大部分课程，保持当前的学习节奏。",
        tips: ["定期复习已学内容", "尝试更高级的挑战", "分享学习心得"]
      };
    }
    
    return {
      icon: TrendingUp,
      title: "继续深入学习",
      description: "恭喜完成当前模块，可以考虑学习更高级的内容。",
      tips: ["探索相关领域", "参与技术社区", "尝试实际项目应用"]
    };
  };

  const recommendation = getRecommendation();
  const IconComponent = recommendation.icon;

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-4">
        <IconComponent className="w-5 h-5 text-teal-600 mt-0.5" />
        <div>
          <h3 className="text-lg font-bold mb-1">学习建议</h3>
          <p className="text-sm text-stone-600 mb-2">{getProgressMessage()}</p>
        </div>
      </div>

      {nextRecommendedCourse && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-800 mb-1">推荐下一课程</div>
          <div className="text-sm text-blue-700 font-medium">{nextRecommendedCourse.title}</div>
          <div className="text-xs text-blue-600 mt-1">{nextRecommendedCourse.reason}</div>
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-teal-700 hover:text-teal-800 font-medium mb-3"
      >
        {showDetails ? "收起建议" : "查看详细建议 →"}
      </button>

      {showDetails && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">{recommendation.description}</p>
          <div>
            <div className="text-sm font-medium text-stone-700 mb-2">学习小贴士：</div>
            <ul className="space-y-1">
              {recommendation.tips.map((tip, index) => (
                <li key={index} className="text-sm text-stone-600 flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}