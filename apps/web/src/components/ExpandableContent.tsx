"use client";

import { useState } from "react";

interface ExpandableContentProps {
  content: string;
  maxLength?: number;
}

export function ExpandableContent({ content, maxLength = 200 }: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldExpand = content.length > maxLength;
  const displayContent = isExpanded ? content : `${content.substring(0, maxLength)}...`;

  return (
    <div className="bg-stone-50 rounded-xl p-4 mb-3">
      <div className="text-xs font-medium text-stone-500 mb-2">课程内容</div>
      <div className="text-sm text-stone-700 leading-relaxed">
        {displayContent}
      </div>
      {shouldExpand && (
        <button
          className="mt-2 text-xs text-teal-700 hover:text-teal-800 font-medium"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "收起内容" : "查看完整内容 →"}
        </button>
      )}
    </div>
  );
}