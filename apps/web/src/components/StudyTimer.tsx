"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface StudyTimerProps {
  courseId: string;
  courseTitle: string;
  onTimeUpdate?: (timeInSeconds: number) => void;
  onSessionEnd?: (timeInSeconds: number) => void;
}

export function StudyTimer({ courseId, courseTitle, onTimeUpdate, onSessionEnd }: StudyTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTime((time) => {
          const newTime = time + 1;
          if (onTimeUpdate) {
            onTimeUpdate(newTime);
          }
          return newTime;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, onTimeUpdate]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTime(0);
    if (time > 0) {
      setSessionCount(sessionCount + 1);
      onSessionEnd?.(time);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStudyMessage = () => {
    if (time === 0) return "准备开始学习";
    if (time < 300) return "刚开始学习，保持专注";
    if (time < 900) return "学习状态良好";
    if (time < 1800) return "已经学习一段时间了";
    return "学习时间较长，适当休息一下";
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-medium text-teal-700">学习计时器</div>
          <div className="text-sm font-medium text-teal-800">{courseTitle}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal-700">{formatTime(time)}</div>
          <div className="text-xs text-teal-600">{getStudyMessage()}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="btn btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            开始学习
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="btn btn-secondary flex items-center gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  继续
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  暂停
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="btn btn-ghost flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              结束
            </button>
          </>
        )}
      </div>

      {sessionCount > 0 && (
        <div className="mt-3 text-xs text-teal-600">
          本课程已完成 {sessionCount} 个学习 session
        </div>
      )}
    </div>
  );
}