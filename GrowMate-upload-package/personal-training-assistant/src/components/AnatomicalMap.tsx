/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ANATOMICAL_PARTS, RecoveryPart } from '../types';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AnatomicalMapProps {
  selectedParts: string[];
  onChange: (parts: string[]) => void;
}

export default function AnatomicalMap({ selectedParts, onChange }: AnatomicalMapProps) {
  const togglePart = (id: string) => {
    if (selectedParts.includes(id)) {
      onChange(selectedParts.filter((p) => p !== id));
    } else {
      onChange([...selectedParts, id]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-800" />
          <h4 className="text-sm font-semibold text-slate-800">身体部位/关节痛感选择 (点击点选)</h4>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          已选 {selectedParts.length} 个不适区域
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        点击下方人体分布模块，标记您今天感到酸痛、僵硬或需要避免受压的部位。系统将自动避开相关高压动作。
      </p>

      {/* Grid selector representing anatomical parts of human body */}
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {ANATOMICAL_PARTS.map((part) => {
          const isSelected = selectedParts.includes(part.id);
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => togglePart(part.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                  : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{part.name}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  {part.category === 'joint' ? '关节 / Joint' : '肌肉 / Muscle'}
                </span>
              </div>
              {isSelected ? (
                <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse shrink-0 ml-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {selectedParts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">动态避险机制已激活：</span>
            计划将自动屏蔽包含这些关节或肌肉受力较高的训练动作，调整为低冲击、低负荷的康复拉伸方案。
          </div>
        </div>
      )}
    </div>
  );
}
