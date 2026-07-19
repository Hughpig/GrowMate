"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MODULE_META } from "@/lib/utils";
import { StudyTimer } from "@/components/StudyTimer";
import { CourseActions } from "@/components/CourseActions";
import { ExpandableContent } from "@/components/ExpandableContent";

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
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

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
          content: `一、Linux 系统概述
Linux 是一个开源的操作系统内核，由 Linus Torvalds 于 1991 年创建。Linux 系统具有稳定性高、安全性好、免费开源等优点，广泛应用于服务器、嵌入式设备和桌面系统。常见的 Linux 发行版包括 Ubuntu、CentOS、Debian 等。

二、基础命令操作
1. 文件管理：ls（列出目录）、cd（切换目录）、cp（复制）、mv（移动）、rm（删除）
2. 文本编辑：vim、nano 等编辑器基本使用
3. 权限管理：chmod（修改权限）、chown（修改所有者）
4. 进程管理：ps（查看进程）、top（系统监控）、kill（终止进程）

三、实用技巧
1. 使用 Tab 键自动补全命令和路径
2. 使用 Ctrl+C 终止当前命令，Ctrl+Z 暂停命令
3. 使用 man 命令查看帮助文档
4. 管道符 | 和重定向 >、>> 的高效使用`,
          order: 1
        },
        {
          id: "2", 
          title: "Python 编程基础",
          summary: "掌握 Python 语言的基本语法和编程思维",
          level: "入门",
          durationMin: 45,
          content: `一、Python 语言简介
Python 是一种高级编程语言，以其简洁的语法和强大的功能而闻名。它支持多种编程范式，包括面向对象、命令式、函数式和过程式编程。Python 拥有丰富的标准库和第三方库，广泛应用于 Web 开发、数据分析、人工智能等领域。

二、核心语法
1. 变量与数据类型：整数（int）、浮点数（float）、字符串（str）、列表（list）、字典（dict）
2. 控制流程：if-elif-else 条件判断、for/while 循环
3. 函数定义：使用 def 关键字，支持默认参数和返回值
4. 面向对象：class 定义类、继承、封装、多态

三、实践练习
1. 编写一个简单的计算器程序
2. 实现一个学生成绩管理系统
3. 使用 requests 库爬取网页数据
4. 利用 pandas 进行数据分析入门`,
          order: 2
        },
        {
          id: "3",
          title: "自动化脚本开发",
          summary: "学习使用 Python 进行系统自动化和任务自动化",
          level: "进阶",
          durationMin: 60,
          content: `一、自动化脚本基础
自动化脚本是提高工作效率的重要工具。通过编写脚本，可以自动完成重复性工作，如文件处理、系统管理、数据备份等。Python 凭借其丰富的库生态，成为自动化脚本开发的首选语言。

二、常用自动化库
1. os 和 shutil：文件和目录操作（批量重命名、文件移动、目录遍历）
2. subprocess：执行系统命令和外部程序
3. schedule：定时任务调度，支持按秒/分/时/天执行
4. watchdog：文件系统监控，检测文件变化事件

三、实战项目
1. 批量文件重命名工具：按规则整理文件夹中的文件
2. 定时数据备份脚本：自动备份数据库和重要文件
3. 日志分析工具：从日志文件中提取关键信息并生成报告
4. 邮件通知系统：监控系统状态并通过邮件发送告警`,
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

      // 从本地存储加载笔记
      const savedNotes = localStorage.getItem(`notes_${slug}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
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
        id: nextCourse.id,
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

  // 添加笔记
  const addNote = (courseId: string) => {
    const text = noteInputs[courseId]?.trim();
    if (!text) return;
    const courseNotes = notes[courseId] || "";
    const newNotes = { ...notes, [courseId]: courseNotes + (courseNotes ? "\n---\n" : "") + `[${new Date().toLocaleString("zh-CN")}] ${text}` };
    setNotes(newNotes);
    localStorage.setItem(`notes_${courseModule.slug}`, JSON.stringify(newNotes));
    setNoteInputs({ ...noteInputs, [courseId]: "" });
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-700">学习进度</span>
            <span className="text-sm font-bold text-teal-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${meta.color} transition-all duration-500`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
            <span>已完成 {completedCourses} / {totalCourses} 课</span>
            {completedCourses === totalCourses && totalCourses > 0 && (
              <span className="text-teal-600 font-medium">🎉 全部完成！</span>
            )}
          </div>
          {/* 每课进度点 */}
          <div className="mt-3 flex items-center gap-2">
            {courseModule.courses.map((course, i) => {
              const done = progressMap[course.id] === "completed";
              return (
                <a
                  key={course.id}
                  href={`#course-${course.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`course-${course.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-1.5 group"
                  title={course.title}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      done
                        ? "bg-teal-500 shadow-sm shadow-teal-200"
                        : "bg-stone-300 group-hover:bg-stone-400"
                    }`}
                  />
                  <span className={`text-xs ${done ? "text-teal-600" : "text-stone-400"} hidden sm:inline`}>
                    {i + 1}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {courseModule.courses.map((c, idx) => {
          const status = progressMap[c.id] || "not_started";
          const isCompleted = status === "completed";
          
          return (
            <article key={c.id} id={`course-${c.id}`} className="card p-5 hover:shadow-lg transition-shadow scroll-mt-4">
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
                    
                    <CourseActions courseId={c.id} isCompleted={isCompleted} />
                  </div>
                  
                  <h2 className="text-lg font-bold mb-1">{c.title}</h2>
                  <p className="text-sm text-stone-600 mb-3">{c.summary}</p>
                  
                  {/* 课程内容预览 */}
                  <ExpandableContent content={c.content} />
                  
                  {/* 学习计时器 */}
                  {currentCourse?.id === c.id ? (
                    <div className="relative mb-3">
                      <button
                        onClick={() => setCurrentCourse(null)}
                        className="absolute top-2 right-2 text-stone-400 hover:text-stone-600 z-10 text-sm"
                      >
                        ✕
                      </button>
                      <StudyTimer
                        courseId={c.id}
                        courseTitle={c.title}
                        onSessionEnd={(seconds) => setTotalStudyTime(prev => prev + seconds)}
                      />
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        className="btn btn-sm"
                        onClick={() => setCurrentCourse(c)}
                      >
                        开始学习计时
                      </button>
                    </div>
                  )}
                  
                  {/* 学习笔记 */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📝</span>
                      <div className="text-sm font-medium text-amber-800">学习笔记</div>
                    </div>
                    {notes[c.id] && (
                      <div className="mb-2 p-2 bg-white rounded text-xs text-stone-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {notes[c.id]}
                      </div>
                    )}
                    <textarea
                      placeholder="记录你的学习心得、疑问或重要知识点..."
                      className="textarea w-full text-sm"
                      rows={2}
                      value={noteInputs[c.id] || ""}
                      onChange={(e) => setNoteInputs({ ...noteInputs, [c.id]: e.target.value })}
                    />
                    <button
                      className="btn btn-primary text-xs mt-2"
                      onClick={() => addNote(c.id)}
                    >
                      添加笔记
                    </button>
                  </div>
                </div>
                
                <button
                  className={`btn ${isCompleted ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => updateCourseProgress(c.id, isCompleted ? "not_started" : "completed")}
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
            <a
              href={`#course-${nextRecommendedCourse.id}`}
              className="text-sm text-blue-700 font-medium hover:text-blue-900 underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`course-${nextRecommendedCourse.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {nextRecommendedCourse.title}
            </a>
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
            { id: "2", title: "坚持学习者", description: "累计学习30分钟", earned: totalStudyTime >= 1800 },
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
              <div className="text-lg font-bold text-green-600">{Math.round(totalStudyTime / 60)}m</div>
              <div className="text-xs text-stone-600">学习时长</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}