"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MODULE_META } from "@/lib/utils";

// 简化的课程数据结构
interface Course {
  id: string;
  title: string;
  summary: string;
  level: string;
  durationMin: number;
  content: string;
  order: number;
}

interface CourseModule {
  id: string;
  name: string;
  description: string;
  slug: string;
  courses: Course[];
}

export default function LearnModuleClient({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const [courseModule, setCourseModule] = useState<CourseModule | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0); // in minutes

  useEffect(() => {
    async function loadData() {
      const { module: slug } = await params;
      
      // 模拟课程数据 - 实际应用中应该从 API 获取
      const mockCourses: Course[] = [
        {
          id: "1",
          title: "Linux 基础入门",
          summary: "学习 Linux 操作系统的基本概念和常用命令",
          level: "入门",
          durationMin: 30,
          content: "Linux 是一个开源的操作系统内核，它最初由 Linus Torvalds 于 1991 年创建。Linux 系统具有稳定性高、安全性好、免费开源等优点，广泛应用于服务器、嵌入式设备和桌面系统。",
          order: 1
        },
        {
          id: "2", 
          title: "Python 编程基础",
          summary: "掌握 Python 语言的基本语法和编程思维",
          level: "入门",
          durationMin: 45,
          content: "Python 是一种高级编程语言，以其简洁的语法和强大的功能而闻名。它支持多种编程范式，包括面向对象、命令式、函数式和过程式编程。",
          order: 2
        },
        {
          id: "3",
          title: "自动化脚本开发",
          summary: "学习使用 Python 进行系统自动化和任务自动化",
          level: "进阶",
          durationMin: 60,
          content: "自动化脚本是提高工作效率的重要工具。通过编写脚本，可以自动完成重复性工作，如文件处理、系统管理、数据备份等。",
          order: 3
        }
      ];

      const mockModule: CourseModule = {
        id: "1",
        name: "技术学习",
        description: "Linux / Python / 自动化 / AI 入门",
        slug: "tech",
        courses: mockCourses
      };
      
      setCourseModule(mockModule);

      // 从本地存储加载进度
      const savedProgress = localStorage.getItem(`progress_${slug}`);
      if (savedProgress) {
        setProgressMap(JSON.parse(savedProgress));
      }
    }

    loadData();
  }, [params]);

  if (!courseModule) {
    return <div className="container py-8">加载中...</div>;
  }

  const meta = MODULE_META[courseModule.slug] || {
    name: courseModule.name,
    description: courseModule.description,
    color: "from-stone-400 to-stone-600",
  };

  const totalCourses = courseModule.courses.length;
  const completedCourses = Object.values(progressMap).filter(status => status === "completed").length;
  const progressPercentage = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  // 获取下一个推荐课程
  const getNextRecommendedCourse = () => {
    const incompleteCourses = courseModule.courses.filter(
      course => progressMap[course.id] !== "completed"
    );
    
    if (incompleteCourses.length > 0) {
      const nextCourse = incompleteCourses[0];
      return {
        title: nextCourse.title,
        reason: `这是你的下一个课程，建议完成后再继续学习其他内容。`
      };
    }
    return null;
  };

  const nextRecommendedCourse = getNextRecommendedCourse();

  // 更新课程进度
  const updateCourseProgress = (courseId: string, status: string) => {
    const newProgressMap = { ...progressMap, [courseId]: status };
    setProgressMap(newProgressMap);
    localStorage.setItem(`progress_${courseModule.slug}`, JSON.stringify(newProgressMap));
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/learn" className="text-sm text-teal-700">
          ← 返回课程模块
        </Link>
        <div className={`mt-3 h-2 w-24 rounded-full bg-gradient-to-r ${meta.color}`} />
        <h1 className="section-title mt-3">{meta.name}</h1>
        <p className="muted mt-1 text-sm">{meta.description}</p>
        
        {/* 进度统计 */}
        <div className="mt-4 rounded-xl bg-white/80 backdrop-blur-sm border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">学习进度</span>
            <span className="text-sm font-bold text-teal-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${meta.color}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-stone-500">
            已完成 {completedCourses} / {totalCourses} 课
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {courseModule.courses.map((c, idx) => {
          const status = progressMap[c.id] || "not_started";
          const isCompleted = status === "completed";
          
          return (
            <article key={c.id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-stone-400 font-medium">第 {idx + 1} 课</div>
                      <span className="badge">{c.level}</span>
                      <span className="badge">{c.durationMin} 分钟</span>
                      <span
                        className={`badge ${
                          isCompleted ? "badge-brand" : ""
                        }`}
                      >
                        {isCompleted ? "已完成" : "未开始"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg text-stone-500 hover:text-red-500 hover:bg-red-50 transition-colors" title="收藏">
                        <span className="text-lg">❤️</span>
                      </button>
                      <button className="p-2 rounded-lg text-stone-500 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="分享">
                        <span className="text-lg">🔗</span>
                      </button>
                    </div>
                  </div>
                  
                  <h2 className="text-lg font-bold mb-1">{c.title}</h2>
                  <p className="text-sm text-stone-600 mb-3">{c.summary}</p>
                  
                  {/* 课程内容预览 */}
                  <div className="bg-stone-50 rounded-xl p-4 mb-3">
                    <div className="text-xs font-medium text-stone-500 mb-2">课程内容</div>
                    <div className="text-sm text-stone-700 leading-relaxed">
                      {c.content.length > 200 
                        ? `${c.content.substring(0, 200)}...` 
                        : c.content
                      }
                    </div>
                    {c.content.length > 200 && (
                      <button className="mt-2 text-xs text-teal-700 hover:text-teal-800 font-medium">
                        查看完整内容 →
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                      onClick={() => setCurrentCourse(c)}
                    >
                      开始学习计时
                    </button>
                  </div>
                  
                  {/* 学习笔记 */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📝</span>
                      <div className="text-sm font-medium text-amber-800">学习笔记</div>
                    </div>
                    <textarea
                      placeholder="记录你的学习心得、疑问或重要知识点..."
                      className="textarea w-full text-sm"
                      rows={2}
                    />
                    <button className="btn btn-primary text-xs mt-2">添加笔记</button>
                  </div>
                </div>
                
                <button
                  className={`btn ${isCompleted ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => updateCourseProgress(c.id, isCompleted ? "not_started" : "completed")}
                  disabled={isCompleted}
                >
                  {isCompleted ? "已完成" : "标记完成"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      
      {/* 学习建议 */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-lg">💡</span>
          <div>
            <h3 className="text-lg font-bold mb-1">学习建议</h3>
            <p className="text-sm text-stone-600 mb-2">
              {progressPercentage === 0 ? "开始你的学习之旅！" : 
               progressPercentage < 50 ? "进展不错，保持动力！" :
               progressPercentage < 100 ? "即将完成，最后冲刺！" : "恭喜完成所有课程！"}
            </p>
          </div>
        </div>
        
        {nextRecommendedCourse && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">推荐下一课程</div>
            <div className="text-sm text-blue-700 font-medium">{nextRecommendedCourse.title}</div>
            <div className="text-xs text-blue-600 mt-1">{nextRecommendedCourse.reason}</div>
          </div>
        )}

        <div className="space-y-2 text-sm text-stone-600">
          <p>• 建议按照课程顺序学习，循序渐进</p>
          <p>• 每完成一课后及时标记，保持学习动力</p>
          <p>• 遇到问题可以在社区中提问交流</p>
          <p>• 结合实际项目练习，加深理解</p>
        </div>
      </div>

      {/* 学习成就 */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">🏆</span>
          <div>
            <h3 className="text-lg font-bold">学习成就</h3>
            <p className="text-sm text-stone-600">
              已获得 {completedCourses} / {totalCourses} 个成就
            </p>
          </div>
        </div>

        <div className="w-full bg-stone-200 rounded-full h-2 mb-4">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
            style={{ width: `${(completedCourses / totalCourses) * 100}%` }}
          />
        </div>

        <div className="grid gap-3">
          {[
            { id: "1", title: "初学者", description: "完成第一门课程", earned: completedCourses >= 1 },
            { id: "2", title: "坚持学习者", description: "连续学习7天", earned: totalStudyTime >= 420 },
            { id: "3", title: "课程完成者", description: "完成50%的课程", earned: completedCourses >= Math.ceil(totalCourses * 0.5) },
          ].map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
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
                <span className="text-lg">🎯</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-medium ${
                    achievement.earned ? "text-yellow-800" : "text-stone-600"
                  }`}>
                    {achievement.title}
                  </h4>
                  {achievement.earned && (
                    <span className="text-yellow-600">✓</span>
                  )}
                </div>
                <p className="text-xs text-stone-600">{achievement.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-stone-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{completedCourses}</div>
              <div className="text-xs text-stone-600">已完成课程</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{Math.round(totalStudyTime / 60)}h</div>
              <div className="text-xs text-stone-600">学习时长</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}