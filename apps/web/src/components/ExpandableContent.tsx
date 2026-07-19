"use client";

import { useState } from "react";

interface ExpandableContentProps {
  content: string;
  maxLength?: number;
}

function renderFormattedContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    const sectionMatch = line.match(/^[一二三四五六七八九十]+、(.+)/);
    if (sectionMatch) {
      elements.push(
        <h4 key={key++} className="font-semibold text-stone-800 text-sm mt-3 mb-1">
          {line}
        </h4>
      );
      continue;
    }

    const itemMatch = line.match(/^(\d+\.\s*)(.+)/);
    if (itemMatch) {
      elements.push(
        <div key={key++} className="flex items-baseline gap-2 text-sm text-stone-700 ml-2">
          <span className="text-teal-600 font-medium shrink-0">{itemMatch[1]}</span>
          <span>{itemMatch[2]}</span>
        </div>
      );
      continue;
    }

    const boldMatch = line.match(/^(.+?)[：:](.+)/);
    if (boldMatch) {
      elements.push(
        <p key={key++} className="text-sm text-stone-700 leading-relaxed">
          <span className="font-medium">{boldMatch[1]}：</span>
          {boldMatch[2]}
        </p>
      );
      continue;
    }

    elements.push(
      <p key={key++} className="text-sm text-stone-700 leading-relaxed">
        {line}
      </p>
    );
  }

  return elements;
}

export function ExpandableContent({ content, maxLength = 200 }: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldExpand = content.length > maxLength;
  const displayContent = isExpanded ? content : `${content.substring(0, maxLength)}...`;

  return (
    <div className="bg-stone-50 rounded-xl p-4 mb-3">
      <div className="text-xs font-medium text-stone-500 mb-2">课程内容</div>
      <div className="text-sm text-stone-700 leading-relaxed space-y-0.5">
        {renderFormattedContent(displayContent)}
      </div>
      {shouldExpand && (
        <button
          className="mt-3 text-xs text-teal-700 hover:text-teal-800 font-medium inline-flex items-center gap-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "收起内容 ↑" : "查看完整课程内容 →"}
        </button>
      )}
    </div>
  );
}