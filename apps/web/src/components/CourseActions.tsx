"use client";

import { useState } from "react";
import { Heart, Share2, BookOpen } from "lucide-react";

interface CourseActionsProps {
  courseId: string;
  isCompleted: boolean;
}

export function CourseActions({ courseId, isCompleted }: CourseActionsProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // 这里可以添加实际的收藏逻辑
    console.log(`收藏课程: ${courseId}`);
  };

  const handleShare = () => {
    setIsSharing(true);
    // 这里可以添加实际的分享逻辑
    if (navigator.share) {
      navigator.share({
        title: 'GrowMate 课程分享',
        text: '来看看这个有趣的课程！',
        url: window.location.href,
      });
    }
    setTimeout(() => setIsSharing(false), 2000);
  };

  const handleAddToReadingList = () => {
    // 这里可以添加添加到阅读列表的逻辑
    console.log(`添加到阅读列表: ${courseId}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFavorite}
        className={`p-2 rounded-lg transition-colors ${
          isFavorited 
            ? "text-red-500 bg-red-50 hover:bg-red-100" 
            : "text-stone-500 hover:text-red-500 hover:bg-red-50"
        }`}
        title={isFavorited ? "取消收藏" : "收藏课程"}
      >
        <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
      </button>

      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`p-2 rounded-lg transition-colors ${
          isSharing 
            ? "text-blue-500 bg-blue-50" 
            : "text-stone-500 hover:text-blue-500 hover:bg-blue-50"
        }`}
        title="分享课程"
      >
        <Share2 className="w-4 h-4" />
      </button>

      <button
        onClick={handleAddToReadingList}
        className="p-2 rounded-lg text-stone-500 hover:text-teal-500 hover:bg-teal-50 transition-colors"
        title="加入阅读列表"
      >
        <BookOpen className="w-4 h-4" />
      </button>
    </div>
  );
}