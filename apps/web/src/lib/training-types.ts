export type GoalType = "fat-loss" | "muscle-gain" | "recovery";
export type Workload = "low" | "moderate" | "high";
export type EnergyLevel = "low" | "normal" | "high";
export type Intensity = "low" | "moderate" | "high";

export type RecoveryPart = {
  id: string;
  name: string;
  category: "joint" | "muscle";
  side?: "left" | "right" | "both";
};

export type LongTermGoal = {
  type: GoalType;
  targetWeightLoss?: number;
  timelineWeeks?: number;
  focusAreas?: string[];
  uncomfortableParts: string[];
  customGoalText?: string;
};

export type DailyStatus = {
  workload: Workload;
  sleepQuality: number;
  energyLevel: EnergyLevel;
  voiceTranscript?: string;
  extraNotes?: string;
};

export type Exercise = {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
  instruction: string;
  targetMuscle?: string;
  category?: "push" | "pull" | "legs" | "core" | "stretch" | "cardio";
  videoUrl?: string;
};

export type TrainingPlan = {
  id: string;
  name: string;
  type: string;
  durationMinutes: number;
  intensity: Intensity;
  adjustmentReason?: string;
  exercises: Exercise[];
  wellnessTargets: { hydrationLiters: number; stretchFocus: string[] };
  createdAt: string;
  citations?: string[];
  source?: string;
};

export const ANATOMICAL_PARTS: RecoveryPart[] = [
  { id: "neck", name: "颈部", category: "joint" },
  { id: "shoulder-l", name: "左肩", category: "joint", side: "left" },
  { id: "shoulder-r", name: "右肩", category: "joint", side: "right" },
  { id: "elbow-l", name: "左肘", category: "joint", side: "left" },
  { id: "elbow-r", name: "右肘", category: "joint", side: "right" },
  { id: "wrist-l", name: "左手腕", category: "joint", side: "left" },
  { id: "wrist-r", name: "右手腕", category: "joint", side: "right" },
  { id: "chest", name: "胸肌", category: "muscle" },
  { id: "back-upper", name: "上背部", category: "muscle" },
  { id: "back-lower", name: "下背部", category: "muscle" },
  { id: "abs", name: "腹肌", category: "muscle" },
  { id: "hip-l", name: "左髋", category: "joint", side: "left" },
  { id: "hip-r", name: "右髋", category: "joint", side: "right" },
  { id: "knee-l", name: "左膝", category: "joint", side: "left" },
  { id: "knee-r", name: "右膝", category: "joint", side: "right" },
  { id: "ankle-l", name: "左踝", category: "joint", side: "left" },
  { id: "ankle-r", name: "右踝", category: "joint", side: "right" },
];

export const FOCUS_AREAS = ["胸部", "背部", "腿部", "核心", "手臂", "肩部", "全身"];

export function bilibiliSearch(name: string) {
  return "https://search.bilibili.com/all?keyword=" + encodeURIComponent(name + " 健身教学");
}
