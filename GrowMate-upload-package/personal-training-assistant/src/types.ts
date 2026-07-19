/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GoalType = 'fat-loss' | 'muscle-gain' | 'recovery';

export interface RecoveryPart {
  id: string;
  name: string;
  category: 'joint' | 'muscle';
  side?: 'left' | 'right' | 'both';
}

export interface LongTermGoal {
  type: GoalType;
  // Weight loss specific
  targetWeightLoss?: number; // kg
  timelineWeeks?: number;
  // Muscle gain specific
  focusAreas?: string[]; // Chest, Back, Legs, Core, Arms, Shoulders, Full Body
  // Recovery specific
  uncomfortableParts: string[]; // List of part IDs from the anatomical selector
  customGoalText?: string;
}

export interface DailyStatus {
  workload: 'low' | 'moderate' | 'high';
  sleepQuality: number; // 1-5 scale
  energyLevel: 'low' | 'normal' | 'high';
  voiceTranscript?: string;
  extraNotes?: string;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
  instruction: string;
  targetMuscle?: string;
  category?: 'push' | 'pull' | 'legs' | 'core' | 'stretch' | 'cardio';
  videoUrl?: string;
}

export interface WellnessTargets {
  hydrationLiters: number;
  stretchFocus: string[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  type: string;
  durationMinutes: number;
  intensity: 'low' | 'moderate' | 'high';
  adjustmentReason?: string;
  exercises: Exercise[];
  wellnessTargets: WellnessTargets;
  createdAt: string;
  citations?: string[];
}

export const ANATOMICAL_PARTS: RecoveryPart[] = [
  { id: 'neck', name: '颈部 (Neck)', category: 'joint' },
  { id: 'shoulder-l', name: '左肩 (L Shoulder)', category: 'joint', side: 'left' },
  { id: 'shoulder-r', name: '右肩 (R Shoulder)', category: 'joint', side: 'right' },
  { id: 'elbow-l', name: '左肘 (L Elbow)', category: 'joint', side: 'left' },
  { id: 'elbow-r', name: '右肘 (R Elbow)', category: 'joint', side: 'right' },
  { id: 'wrist-l', name: '左手腕 (L Wrist)', category: 'joint', side: 'left' },
  { id: 'wrist-r', name: '右手腕 (R Wrist)', category: 'joint', side: 'right' },
  { id: 'chest', name: '胸肌 (Chest)', category: 'muscle' },
  { id: 'back-upper', name: '上背部 (Upper Back)', category: 'muscle' },
  { id: 'back-lower', name: '下背部 (Lower Back)', category: 'muscle' },
  { id: 'abs', name: '腹肌 (Abs)', category: 'muscle' },
  { id: 'hip-l', name: '左髋关节 (L Hip)', category: 'joint', side: 'left' },
  { id: 'hip-r', name: '右髋关节 (R Hip)', category: 'joint', side: 'right' },
  { id: 'knee-l', name: '左膝盖 (L Knee)', category: 'joint', side: 'left' },
  { id: 'knee-r', name: '右膝盖 (R Knee)', category: 'joint', side: 'right' },
  { id: 'ankle-l', name: '左脚踝 (L Ankle)', category: 'joint', side: 'left' },
  { id: 'ankle-r', name: '右脚踝 (R Ankle)', category: 'joint', side: 'right' },
];
