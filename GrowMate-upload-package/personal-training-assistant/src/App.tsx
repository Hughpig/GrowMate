/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Dumbbell, 
  User, 
  Sparkles, 
  Mic, 
  MicOff, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  Compass, 
  Calendar, 
  Droplet, 
  AlertCircle,
  TrendingUp,
  Sliders,
  Play,
  Heart,
  Moon,
  Coffee,
  Check,
  AlertTriangle,
  Flame,
  Scale,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  BookOpen,
  Award,
  ExternalLink,
  Video
} from 'lucide-react';
import { LongTermGoal, DailyStatus, TrainingPlan, GoalType } from './types';
import AnatomicalMap from './components/AnatomicalMap';

// Custom Speech Recognition interface declaration
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const DEFAULT_GOAL: LongTermGoal = {
  type: 'fat-loss',
  targetWeightLoss: 6,
  timelineWeeks: 12,
  focusAreas: ['Core', 'Full Body'],
  uncomfortableParts: ['knee-r']
};

const DEFAULT_DAILY_STATUS: DailyStatus = {
  workload: 'moderate',
  sleepQuality: 3,
  energyLevel: 'normal',
  voiceTranscript: '',
  extraNotes: ''
};

const INITIAL_TRAINING_PLAN: TrainingPlan = {
  id: 'init-001',
  name: '低冲击活力平衡训练 (避开右膝关节高压)',
  type: '全身低抗阻与稳定性激活',
  durationMinutes: 25,
  intensity: 'moderate',
  createdAt: new Date().toISOString(),
  adjustmentReason: '根据您的长期减脂计划，结合今日反馈：工作量中等、睡眠3星（略显疲劳），以及您标记的【右膝盖关节不适】，系统为您量身定制了这套低冲击平衡训练。今日计划已完全避开深蹲、硬拉等增加膝盖剪切力的动作，改用臀桥与上肢、核心控制练习，既能保证代谢消耗，又可以促进右膝的血液循环与康复。',
  exercises: [
    {
      name: '猫牛式呼吸脊柱唤醒 (Cat-Cow Stretch)',
      sets: 1,
      duration: '2分钟',
      instruction: '跪姿，吸气抬头塌腰拉伸前侧，呼气拱背低头延展后背。缓解久坐造成的脊椎僵硬。',
      targetMuscle: '脊椎、核心稳定性'
    },
    {
      name: '仰卧单腿臀桥 (Single-Leg Glute Bridge)',
      sets: 3,
      reps: '每侧 12 次',
      rest: '休息 30秒',
      instruction: '平躺，弯曲左膝，右腿抬起悬空。呼气用臀肌和左脚后跟发力顶起胯部。此动作不给右膝增加压力。',
      targetMuscle: '臀部、后侧链肌肉'
    },
    {
      name: '抗阻弹力带划船 (Resistance Band Row)',
      sets: 3,
      reps: '15 次',
      rest: '休息 30秒',
      instruction: '坐姿，双脚自然微屈，将弹力带套在脚底，双手拉住弹力带，呼气收缩背部肌群拉向身体，吸气还原。',
      targetMuscle: '上背部、斜方肌'
    },
    {
      name: '平板支撑静力控制 (Standard Plank)',
      sets: 3,
      duration: '45秒',
      rest: '休息 45秒',
      instruction: '用前臂和脚尖支撑身体，保持头部、肩部、臀部和脚踝呈一条直线，腹肌极力收紧。',
      targetMuscle: '深层核心肌群'
    }
  ],
  wellnessTargets: {
    hydrationLiters: 2.8,
    stretchFocus: ['大腿后侧拉伸', '胸腔打开延展', '右膝周围肌肉等长激活']
  }
};

const DYNAMIC_PRESET_FEEDBACKS = [
  '我感觉右侧大腿肌肉拉伤了',
  '工作压力极大，今天非常累，想温和一点',
  '最近膝盖关节有点僵硬，不能深蹲',
  '精力充沛，今天想挑战更高负荷的训练！',
  '下背部隐隐作痛，估计是昨天久坐引起的'
];

function getExerciseCategory(name: string, categoryFromBackend?: string): 'push' | 'pull' | 'legs' | 'core' | 'stretch' | 'cardio' {
  if (categoryFromBackend) {
    const val = categoryFromBackend.toLowerCase();
    if (['push', 'pull', 'legs', 'core', 'stretch', 'cardio'].includes(val)) {
      return val as any;
    }
  }
  const str = name.toLowerCase();
  if (str.includes('push') || str.includes('俯卧撑') || str.includes('推') || str.includes('胸') || str.includes('shoulder')) return 'push';
  if (str.includes('pull') || str.includes('划船') || str.includes('引体') || str.includes('背') || str.includes('row') || str.includes('拉')) return 'pull';
  if (str.includes('squat') || str.includes('蹲') || str.includes('臀桥') || str.includes('bridge') || str.includes('膝') || str.includes('踝') || str.includes('leg') || str.includes('lunge')) return 'legs';
  if (str.includes('abs') || str.includes('腹') || str.includes('deadbug') || str.includes('平板支撑') || str.includes('plank') || str.includes('核心')) return 'core';
  if (str.includes('stretch') || str.includes('拉伸') || str.includes('伸展') || str.includes('放松') || str.includes('cat-cow') || str.includes('瑜伽') || str.includes('颈')) return 'stretch';
  return 'cardio';
}

function getTutorialUrl(name: string, videoUrl?: string): string {
  if (videoUrl && videoUrl.startsWith('http')) {
    return videoUrl;
  }
  return `https://search.bilibili.com/all?keyword=${encodeURIComponent(name + ' 健身动作演示 教学')}`;
}

function ActionCover({ name, category, videoUrl, isLarge = false }: { name: string; category?: string; videoUrl?: string; isLarge?: boolean }) {
  const cat = getExerciseCategory(name, category);
  const url = getTutorialUrl(name, videoUrl);

  const themes: Record<string, { bg: string; iconBg: string; text: string; badge: string; pattern: string }> = {
    push: {
      bg: 'from-orange-600/90 to-red-600/95',
      iconBg: 'bg-orange-500 text-white',
      text: 'text-orange-200',
      badge: '上肢推 (Push)',
      pattern: 'radial-gradient(circle at 20% 30%, rgba(249,115,22,0.15) 0%, transparent 50%)'
    },
    pull: {
      bg: 'from-sky-600/90 to-blue-700/95',
      iconBg: 'bg-sky-500 text-white',
      text: 'text-sky-200',
      badge: '上肢拉 (Pull)',
      pattern: 'radial-gradient(circle at 80% 20%, rgba(14,165,233,0.15) 0%, transparent 50%)'
    },
    legs: {
      bg: 'from-indigo-600/90 to-purple-700/95',
      iconBg: 'bg-purple-500 text-white',
      text: 'text-purple-200',
      badge: '下肢/臀腿 (Legs)',
      pattern: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.15) 0%, transparent 60%)'
    },
    core: {
      bg: 'from-teal-600/90 to-emerald-700/95',
      iconBg: 'bg-emerald-500 text-white',
      text: 'text-teal-200',
      badge: '核心稳定 (Core)',
      pattern: 'radial-gradient(circle at 30% 70%, rgba(16,185,129,0.15) 0%, transparent 50%)'
    },
    stretch: {
      bg: 'from-emerald-500/90 to-teal-600/95',
      iconBg: 'bg-teal-500 text-white',
      text: 'text-emerald-200',
      badge: '拉伸/放松 (Stretch)',
      pattern: 'radial-gradient(circle at 10% 10%, rgba(20,184,166,0.15) 0%, transparent 40%)'
    },
    cardio: {
      bg: 'from-rose-500/90 to-orange-600/95',
      iconBg: 'bg-rose-500 text-white',
      text: 'text-rose-200',
      badge: '心肺有氧 (Cardio)',
      pattern: 'radial-gradient(circle at 75% 75%, rgba(244,63,94,0.15) 0%, transparent 50%)'
    }
  };

  const theme = themes[cat] || themes.stretch;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full rounded-2xl relative overflow-hidden group/cover transition-all duration-300 border border-slate-800 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 cursor-pointer select-none ${
        isLarge ? 'h-52 sm:h-60' : 'h-32'
      }`}
      style={{
        background: `linear-gradient(135deg, #0f172a, #020617)`
      }}
    >
      {/* Decorative colored cover overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-20 group-hover/cover:opacity-30 transition-opacity duration-300`}
        style={{ backgroundImage: theme.pattern }}
      />
      
      {/* Simulated digital scanner overlay grid to emphasize biomechanics */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Interactive content */}
      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 bg-slate-950/90 text-emerald-400 rounded-lg border border-slate-800">
            {theme.badge}
          </span>
          <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-pink-400 border border-pink-900/40 font-mono font-semibold">
            <span>Bilibili 演示</span>
          </div>
        </div>

        {/* Midplay visual trigger */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover/cover:scale-110 group-hover/cover:bg-emerald-400 transition-all duration-300 shrink-0">
            <Play className="w-5 h-5 fill-slate-950 text-slate-950 translate-x-0.5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight group-hover/cover:text-emerald-300 transition-colors">
              《{name}》真人标准动作示范
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-normal mt-0.5 group-hover/cover:text-slate-300 transition-colors">
              点击观看专业教练的黄金训练标准与骨骼避险拆解
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2">
          <span>NSCA / NASM SCIENTIFIC SYSTEM</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold group-hover/cover:translate-x-0.5 transition-transform">
            VIEW VIDEO TUTORIAL <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'training' | 'goal'>('training');
  const [longTermGoal, setLongTermGoal] = useState<LongTermGoal>(DEFAULT_GOAL);
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>(DEFAULT_DAILY_STATUS);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan>(INITIAL_TRAINING_PLAN);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [showGoalSaveToast, setShowGoalSaveToast] = useState(false);

  // Live Workout Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [playerState, setPlayerState] = useState<'warmup' | 'exercise' | 'rest' | 'complete'>('warmup');
  const [playerTimer, setPlayerTimer] = useState(10); // initial warmup countdown
  const [playerTotalTimer, setPlayerTotalTimer] = useState(0); // accumulated training time
  const [playerPaused, setPlayerPaused] = useState(false);
  const [playerSet, setPlayerSet] = useState(1);

  // Audio synthesis helper for countdown cues
  const playBeep = (freq = 440, duration = 0.1) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // AudioContext fails silently if browser blocked it
    }
  };

  // HTML5 Speech Recognition setup
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'zh-CN';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const resultText = event.results[0][0].transcript;
        setDailyStatus(prev => ({
          ...prev,
          voiceTranscript: prev.voiceTranscript ? prev.voiceTranscript + ' ' + resultText : resultText
        }));
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Helper to parse seconds from string
  const parseSeconds = (str?: string, defaultSec = 45): number => {
    if (!str) return defaultSec;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return defaultSec;
    if (str.includes('分钟') || str.includes('min')) {
      return num * 60;
    }
    return num;
  };

  // Launch Workout Player
  const startWorkoutSession = () => {
    if (!trainingPlan || !trainingPlan.exercises.length) return;
    setIsPlaying(true);
    setCurrentExIndex(0);
    setPlayerSet(1);
    setPlayerState('warmup');
    setPlayerTimer(8); // 8 seconds countdown warmup
    setPlayerTotalTimer(0);
    setPlayerPaused(false);
  };

  const handlePauseToggle = () => setPlayerPaused(prev => !prev);
  
  const handleSkipExercise = () => {
    if (!trainingPlan) return;
    if (currentExIndex + 1 < trainingPlan.exercises.length) {
      const nextIdx = currentExIndex + 1;
      setCurrentExIndex(nextIdx);
      setPlayerSet(1);
      const nextEx = trainingPlan.exercises[nextIdx];
      setPlayerState('exercise');
      setPlayerTimer(parseSeconds(nextEx.duration || nextEx.reps, 45));
    } else {
      setPlayerState('complete');
      setHasCompletedToday(true);
    }
  };

  const handlePrevExercise = () => {
    if (currentExIndex > 0) {
      const prevIdx = currentExIndex - 1;
      setCurrentExIndex(prevIdx);
      setPlayerSet(1);
      const prevEx = trainingPlan!.exercises[prevIdx];
      setPlayerState('exercise');
      setPlayerTimer(parseSeconds(prevEx.duration || prevEx.reps, 45));
    }
  };

  const handlePhaseAdvance = () => {
    if (!trainingPlan) return;
    const currentEx = trainingPlan.exercises[currentExIndex];
    const maxSets = currentEx.sets || 3;

    if (playerState === 'warmup') {
      setPlayerState('exercise');
      setPlayerTimer(parseSeconds(currentEx.duration || currentEx.reps, 45));
    } else if (playerState === 'exercise') {
      setPlayerState('rest');
      setPlayerTimer(parseSeconds(currentEx.rest, 30));
    } else if (playerState === 'rest') {
      if (playerSet < maxSets) {
        setPlayerSet(prev => prev + 1);
        setPlayerState('exercise');
        setPlayerTimer(parseSeconds(currentEx.duration || currentEx.reps, 45));
      } else {
        if (currentExIndex + 1 < trainingPlan.exercises.length) {
          const nextIdx = currentExIndex + 1;
          setCurrentExIndex(nextIdx);
          setPlayerSet(1);
          setPlayerState('exercise');
          const nextEx = trainingPlan.exercises[nextIdx];
          setPlayerTimer(parseSeconds(nextEx.duration || nextEx.reps, 45));
        } else {
          setPlayerState('complete');
          setHasCompletedToday(true);
        }
      }
    }
  };

  // Player Countdown Loop
  useEffect(() => {
    if (!isPlaying || playerPaused || playerState === 'complete') return;

    const interval = setInterval(() => {
      setPlayerTotalTimer(prev => prev + 1);
      setPlayerTimer(prev => {
        const nextTime = prev - 1;

        if (nextTime <= 3 && nextTime > 0) {
          playBeep(440, 0.08); // Countdown cue
        } else if (nextTime === 0) {
          playBeep(880, 0.15); // End of state cue
        }

        if (nextTime <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            handlePhaseAdvance();
          }, 50);
          return 0;
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, playerPaused, playerState, currentExIndex, playerSet, trainingPlan]);

  const toggleRecording = () => {
    if (!recognition) {
      alert('抱歉，您的浏览器环境或当前连接不支持网页语音识别接口，建议直接点击下方快捷状态气泡。');
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSelectPreset = (preset: string) => {
    setDailyStatus(prev => ({
      ...prev,
      voiceTranscript: prev.voiceTranscript ? prev.voiceTranscript + '，' + preset : preset
    }));
  };

  const clearTranscript = () => {
    setDailyStatus(prev => ({ ...prev, voiceTranscript: '' }));
  };

  // Generate / Adjust training plan via Backend Express + Gemini
  const generateWorkoutPlan = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setHasCompletedToday(false);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          longTermGoal,
          dailyStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'MISSING_API_KEY') {
          setErrorMessage(data.message);
        } else {
          throw new Error(data.message || '生成计划失败，请重试。');
        }
      } else {
        setTrainingPlan(data);
        setActiveTab('training');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '网络请求故障，请确保后端服务正常运行。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGoalSaveToast(true);
    setTimeout(() => {
      setShowGoalSaveToast(false);
    }, 3000);
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-800 font-sans min-h-screen flex flex-col antialiased">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-10 py-5 bg-white border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase flex items-center gap-2">
              VitaFlow <span className="font-light text-slate-400">/ 智能训练助手</span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wide font-medium">专为工作人群定制的动态体能康复系统</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'training'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-500 hover:text-black hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>今日动态训练</span>
          </button>
          
          <button
            onClick={() => setActiveTab('goal')}
            className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
              activeTab === 'goal'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-500 hover:text-black hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>长期目标制定</span>
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: General Info & Summary */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold uppercase tracking-wider mb-3 inline-block">
              个人教练在线
            </span>
            <h2 className="text-xl font-bold mb-1 text-slate-900">您好，高效工作者</h2>
            <p className="text-slate-400 text-xs italic mt-1 mb-4 leading-relaxed">
              "利用短平快的科学运动打断久坐疲劳，是保护关节与精力的第一步。"
            </p>

            <div className="border-t border-slate-50 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">当前活跃目标:</span>
                <span className="font-semibold text-slate-700">
                  {longTermGoal.type === 'fat-loss' && '🔥 科学减脂控重'}
                  {longTermGoal.type === 'muscle-gain' && '💪 核心肌群增肌'}
                  {longTermGoal.type === 'recovery' && '🩹 局部痛感康复'}
                </span>
              </div>
              
              {longTermGoal.type === 'fat-loss' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">减重指标 / 周期:</span>
                  <span className="font-semibold text-slate-700">
                    减去 {longTermGoal.targetWeightLoss} kg / {longTermGoal.timelineWeeks} 周
                  </span>
                </div>
              )}

              {longTermGoal.type === 'muscle-gain' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">优先强化部位:</span>
                  <span className="font-semibold text-slate-700">
                    {longTermGoal.focusAreas?.join(', ') || '全身均衡'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">关节/肌肉防护:</span>
                <span className="font-semibold text-rose-600">
                  {longTermGoal.uncomfortableParts.length > 0 
                    ? `已标记 ${longTermGoal.uncomfortableParts.length} 处敏感部位` 
                    : '无不适 (全力挑战)'}
                </span>
              </div>
            </div>
          </div>

          {/* Setup vs Check-in Card (Dynamic guide) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-900 shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">使用指南 (免打字)</h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-white border border-slate-700 mt-0.5">1</div>
                <span>在 <b>长期目标</b> 标签中选择核心需求（减脂/增肌/康复）。若关节酸痛，点击点选不适部位。</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-white border border-slate-700 mt-0.5">2</div>
                <span>每天在今日训练页面 <b>快捷勾选</b> 您的工作疲劳度、睡眠星级和精力。</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-white border border-slate-700 mt-0.5">3</div>
                <span>使用 <b>语音输入</b> 或 <b>一键气泡</b> 描述特殊状态。点击生成，AI即时重算方案！</span>
              </li>
            </ul>
          </div>

          {/* Quick Stats Block */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">健康生态预留模块</h4>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">ARCH READY</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 opacity-60">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Coffee className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">膳食营养</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">Diet Module<br/>(Coming Soon)</span>
              </div>

              <div className="p-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 opacity-60">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">深度睡眠</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 leading-tight">Sleep Module<br/>(Coming Soon)</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              底层架构已预留标准化数据流接口，后续开启营养和睡眠模块时，训练生成器将能联动综合热量与自主神经恢复状态(HRV)。
            </p>
          </div>
        </section>

        {/* Right Side: Tab Contents */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* TAB 1: Long-Term Goal Settings */}
          {activeTab === 'goal' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">1. 长期健身/康复目标设定</h3>
                  <p className="text-xs text-slate-400 mt-1">定制您的底层锻炼大纲，以便AI匹配最优动作库</p>
                </div>
                <TrendingUp className="w-6 h-6 text-slate-400" />
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-6">
                {/* Goal Selector */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3 block">核心目标类型</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setLongTermGoal(prev => ({ ...prev, type: 'fat-loss' }))}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        longTermGoal.type === 'fat-loss'
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Flame className={`w-5 h-5 mb-2 ${longTermGoal.type === 'fat-loss' ? 'text-orange-400' : 'text-slate-500'}`} />
                      <div className="text-sm font-bold">科学减脂 (Fat Loss)</div>
                      <div className={`text-[10px] mt-1 ${longTermGoal.type === 'fat-loss' ? 'text-slate-300' : 'text-slate-400'}`}>
                        渐进式燃脂，促进基础代谢，改善心肺
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLongTermGoal(prev => ({ ...prev, type: 'muscle-gain' }))}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        longTermGoal.type === 'muscle-gain'
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Dumbbell className={`w-5 h-5 mb-2 ${longTermGoal.type === 'muscle-gain' ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="text-sm font-bold">核心增肌 (Muscle)</div>
                      <div className={`text-[10px] mt-1 ${longTermGoal.type === 'muscle-gain' ? 'text-slate-300' : 'text-slate-400'}`}>
                        肌肥大强化，紧致塑形，提高抗疲劳肌肉耐力
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLongTermGoal(prev => ({ ...prev, type: 'recovery' }))}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        longTermGoal.type === 'recovery'
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Heart className={`w-5 h-5 mb-2 ${longTermGoal.type === 'recovery' ? 'text-rose-400' : 'text-slate-500'}`} />
                      <div className="text-sm font-bold">关节康复 (Recovery)</div>
                      <div className={`text-[10px] mt-1 ${longTermGoal.type === 'recovery' ? 'text-slate-300' : 'text-slate-400'}`}>
                        消除劳损，活化受限关节，建立稳定机制
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub Goal - Weight Loss specific */}
                {longTermGoal.type === 'fat-loss' && (
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-orange-500" />
                      减脂偏好指标采集
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1.5 font-medium">您希望减掉多少体重？(kg)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={longTermGoal.targetWeightLoss || ''}
                            onChange={(e) => setLongTermGoal(prev => ({ ...prev, targetWeightLoss: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-black font-semibold"
                            placeholder="例如: 5"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">KG</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1.5 font-medium">规划完成周期 (周)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="2"
                            max="52"
                            value={longTermGoal.timelineWeeks || ''}
                            onChange={(e) => setLongTermGoal(prev => ({ ...prev, timelineWeeks: Number(e.target.value) }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:border-black font-semibold"
                            placeholder="例如: 12"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">WEEKS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Goal - Muscle Gain specific */}
                {longTermGoal.type === 'muscle-gain' && (
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">优先强化的目标肌群</h4>
                    <p className="text-[11px] text-slate-400">选择您希望着重雕刻塑形的部位：</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['Chest (胸部)', 'Back (背部)', 'Shoulders (肩部)', 'Legs (腿部)', 'Core (核心)', 'Full Body (全身均衡)'].map((area) => {
                        const areaName = area.split(' ')[0];
                        const isChecked = longTermGoal.focusAreas?.includes(areaName) || false;
                        return (
                          <button
                            type="button"
                            key={area}
                            onClick={() => {
                              const currentAreas = longTermGoal.focusAreas || [];
                              const newAreas = isChecked 
                                ? currentAreas.filter(a => a !== areaName)
                                : [...currentAreas, areaName];
                              setLongTermGoal(prev => ({ ...prev, focusAreas: newAreas }));
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                              isChecked
                                ? 'bg-black border-black text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{area}</span>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub Goal - Recovery (Anatomical selection) */}
                <div>
                  <AnatomicalMap
                    selectedParts={longTermGoal.uncomfortableParts}
                    onChange={(parts) => setLongTermGoal(prev => ({ ...prev, uncomfortableParts: parts }))}
                  />
                </div>

                {/* Additional Text Notes */}
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 block">其他特定需求 / 备注说明</label>
                  <textarea
                    rows={2}
                    value={longTermGoal.customGoalText || ''}
                    onChange={(e) => setLongTermGoal(prev => ({ ...prev, customGoalText: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-hidden focus:border-black focus:bg-white leading-relaxed"
                    placeholder="例如: 医生建议避免负重深蹲 / 希望能顺便矫正圆肩驼背..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                  >
                    保存并同步大纲数据
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('training')}
                    className="px-6 py-4 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    返回打卡页
                  </button>
                </div>

                {showGoalSaveToast && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>长期目标大纲保存成功！今日动态计划在重新计算时将融合此项配置。</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: Daily Feedback Check-in & Adjusted Workout Display */}
          {activeTab === 'training' && (
            <div className="space-y-6">
              
              {/* Check-in input section (No Typing) */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">2. 今日身体状态极速评估</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      无需打字，快速反馈工作和生活状态，AI在毫秒间重新对齐今日动作库
                    </p>
                  </div>
                  <Sliders className="w-5 h-5 text-slate-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Metric 1: Workload */}
                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2.5 block">今日工作负荷 (Workload)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDailyStatus(prev => ({ ...prev, workload: level }))}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            dailyStatus.workload === level
                              ? 'bg-black text-white shadow-xs'
                              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
                          }`}
                        >
                          {level === 'low' && '温和 (Low)'}
                          {level === 'moderate' && '适中 (Mod)'}
                          {level === 'high' && '爆表 (High)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric 2: Sleep Quality */}
                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2.5 block">昨晚睡眠评级 (Sleep Quality)</label>
                    <div className="flex items-center justify-between bg-white rounded-xl p-1.5 border border-slate-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setDailyStatus(prev => ({ ...prev, sleepQuality: star }))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                            dailyStatus.sleepQuality >= star
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric 3: Energy Level */}
                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2.5 block">即时精力状态 (Energy)</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['low', 'normal', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDailyStatus(prev => ({ ...prev, energyLevel: level }))}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            dailyStatus.energyLevel === level
                              ? 'bg-black text-white shadow-xs'
                              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
                          }`}
                        >
                          {level === 'low' && '微电🔋'}
                          {level === 'normal' && '平衡⚡'}
                          {level === 'high' && '充沛🔥'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Voice Input Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      语音状态反馈 / 伤痛自定义补充 (点按说话免打字)
                    </label>
                    {dailyStatus.voiceTranscript && (
                      <button
                        onClick={clearTranscript}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                      >
                        清空语音输入
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Voice Button */}
                    <div className="md:col-span-4">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`w-full py-5 px-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                          isRecording
                            ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                            : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100/60'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                          isRecording ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {isRecording ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-tight">
                          {isRecording ? '正在倾听中...' : '开启语音输入'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {isRecording ? '说话完毕请再次点击' : '支持普通话/英语'}
                        </span>
                      </button>
                    </div>

                    {/* Transcript Output and Note presets */}
                    <div className="md:col-span-8 flex flex-col justify-between bg-slate-50 rounded-2xl border border-slate-100 p-4">
                      <div className="min-h-12">
                        {dailyStatus.voiceTranscript ? (
                          <p className="text-xs text-slate-700 font-medium leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-100">
                            “ {dailyStatus.voiceTranscript} ”
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic leading-relaxed pt-2">
                            暂无语音录入。您可以点击左侧按钮直接说话，或直接点击下方快捷反馈气泡：
                          </p>
                        )}
                      </div>

                      {/* Preset state bubles for fast click */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {DYNAMIC_PRESET_FEEDBACKS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg text-[10px] font-medium hover:bg-slate-100 hover:border-slate-300 transition-all"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regenerate Trigger Button */}
                <div className="mt-6 border-t border-slate-50 pt-5">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={generateWorkoutPlan}
                    className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>正在融合您的每日打卡数据重算方案中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>融合反馈，动态重新生成今日训练方案</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error messages if API key missing */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex gap-4 items-start">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-800 space-y-2">
                    <span className="font-bold block">💡 接口未就绪</span>
                    <p className="text-xs leading-relaxed text-rose-700">{errorMessage}</p>
                    <div className="pt-2">
                      <span className="font-semibold text-xs block mb-1">我们已经为您在前端准备了高品质的沙盒模拟数据体验：</span>
                      <button
                        onClick={() => {
                          setErrorMessage(null);
                          setTrainingPlan(INITIAL_TRAINING_PLAN);
                        }}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
                      >
                        加载示范训练方案
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Training Plan Details Card */}
              {trainingPlan && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  {/* Plan Heading */}
                  <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          今日处方
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          于 {new Date(trainingPlan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 动态更新
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        {trainingPlan.name}
                      </h3>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center">
                        <span className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">估计用时</span>
                        <span className="text-sm font-extrabold font-mono text-slate-800">{trainingPlan.durationMinutes}分钟</span>
                      </div>
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center">
                        <span className="block text-[9px] uppercase text-slate-400 font-bold tracking-wider">今日强度</span>
                        <span className={`text-sm font-extrabold font-mono ${
                          trainingPlan.intensity === 'high' 
                            ? 'text-rose-600' 
                            : trainingPlan.intensity === 'moderate' 
                            ? 'text-amber-600' 
                            : 'text-emerald-600'
                        }`}>
                          {trainingPlan.intensity === 'high' && '偏高 (High)'}
                          {trainingPlan.intensity === 'moderate' && '中等 (Mod)'}
                          {trainingPlan.intensity === 'low' && '舒缓 (Low)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coach Comments */}
                  <div className="p-6 sm:p-8 border-b border-slate-100 bg-amber-50/30 flex gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-amber-800 font-bold mb-1">
                        智能调整报告 / Coach Report
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {trainingPlan.adjustmentReason}
                      </p>
                    </div>
                  </div>

                  {/* Exercises Checklist */}
                  <div className="p-6 sm:p-8 space-y-6">
                    <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">训练清单 (按序执行)</h4>
                    
                    <div className="space-y-4">
                      {trainingPlan.exercises.map((ex, index) => (
                        <div
                          key={ex.name + index}
                          className="flex flex-col md:flex-row items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                          <div className="text-2xl font-light text-slate-300 font-mono w-8 shrink-0">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-sm font-bold text-slate-800">{ex.name}</h5>
                                {ex.targetMuscle && (
                                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                                    {ex.targetMuscle}
                                  </span>
                                )}
                              </div>
                              <a
                                href={getTutorialUrl(ex.name, ex.videoUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-500 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-xl transition-all border border-emerald-100"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>🎥 真人动作演示</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                              {ex.instruction}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-medium">
                              {ex.sets && (
                                <span className="flex items-center gap-1">
                                  组数: <span className="text-slate-700 font-bold">{ex.sets} 组</span>
                                </span>
                              )}
                              {ex.reps && (
                                <span className="flex items-center gap-1">
                                  次数: <span className="text-slate-700 font-bold">{ex.reps}</span>
                                </span>
                              )}
                              {ex.duration && (
                                <span className="flex items-center gap-1">
                                  时长: <span className="text-slate-700 font-bold">{ex.duration}</span>
                                </span>
                              )}
                              {ex.rest && (
                                <span className="flex items-center gap-1">
                                  间歇: <span className="text-slate-700 font-bold">{ex.rest}</span>
                                </span>
                              )}
                            </div>

                            {/* Action Video Cover Entrance */}
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <ActionCover
                                name={ex.name}
                                category={ex.category}
                                videoUrl={ex.videoUrl}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stretch Focus & Hydration */}
                  <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-blue-500" />
                        本日建议水分摄入 (Hydration)
                      </span>
                      <span className="text-sm font-bold text-slate-800 block">
                        {trainingPlan.wellnessTargets.hydrationLiters} 升 (基础维持 + 运动补充)
                      </span>
                      <p className="text-[10px] text-slate-400">
                        工作期间，建议每隔 45 分钟起立饮水 150 毫升。
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        拉伸放松重点建议
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {trainingPlan.wellnessTargets.stretchFocus.map((stretch) => (
                          <span
                             key={stretch}
                             className="text-[10px] px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium"
                          >
                            🧘 {stretch}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scientific Bibliography (NSCA & NASM) */}
                  <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-600" />
                      <span className="text-xs uppercase font-extrabold tracking-widest text-slate-600">
                        NSCA / NASM 循证医学与体能标准文献背书 (Literature Evidence-Based Guidelines)
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {(trainingPlan.citations && trainingPlan.citations.length > 0 ? trainingPlan.citations : [
                        "NSCA's Essentials of Personal Training, 2nd Edition - Guidelines for dynamic adjustments and core stabilization in high-fatigue cohorts.",
                        "NASM Essentials of Personal Fitness Training, 7th Edition - Optimum Performance Training (OPT) Model Phase 1: Stabilization Endurance."
                      ]).map((citation, cIdx) => (
                        <li key={cIdx} className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-2 font-serif italic">
                          <span className="font-sans font-bold text-slate-400 shrink-0">[{cIdx + 1}]</span>
                          <span>{citation}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      * 所有的动态避险与负荷隔离算法均基于上述组织发布的运动处方与科学体能周期化体系，确保训练效果与极高安全性。
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-6 sm:p-8 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                    {hasCompletedToday ? (
                      <div className="w-full py-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>太棒了！您已成功完成今日打卡，记录已同步到您的个人历史报表。</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={startWorkoutSession}
                          className="flex-1 py-4 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 transition-transform"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>立即启动训练 (内置倒计时计时器与动图演示)</span>
                        </button>
                        
                        <button
                          onClick={() => window.print()}
                          className="px-5 py-4 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          打印/导出方案
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer / Architectural Ready Placeholders */}
      <footer className="mt-auto border-t border-slate-100 bg-white px-6 sm:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 opacity-30">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Diet Optimization (Locked)</span>
          </div>
          <div className="flex items-center gap-2 opacity-30">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Sleep Analysis (Locked)</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-300 font-mono">v1.1.2 // ARCH_EXT_CAPABLE</div>
      </footer>

      {/* Fullscreen Immersive Workout Player Overlay */}
      {isPlaying && trainingPlan && (
        <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between overflow-y-auto animate-fade-in">
          {/* Header */}
          <header className="px-6 py-4 border-b border-slate-900 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center animate-pulse">
                <Activity className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h2 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  VitaFlow · 沉浸式训练伴侣
                </h2>
                <span className="text-sm font-bold text-white block truncate max-w-56 sm:max-w-md">
                  {trainingPlan.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-[9px] uppercase text-slate-500 tracking-widest block font-mono">
                  今日配方
                </span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {trainingPlan.type}
                </span>
              </div>
              <button
                onClick={() => setIsPlaying(false)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold hover:bg-slate-800 transition-colors"
              >
                退出课 (Exit)
              </button>
            </div>
          </header>

          {/* Main Stage */}
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center">
            {playerState === 'complete' ? (
              /* Victory Card */
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md text-center space-y-6 shadow-2xl animate-scale-up my-auto">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Award className="w-10 h-10 text-slate-950" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">今日训练圆满完成！</h3>
                  <p className="text-xs text-slate-400">
                    您已成功突破久坐惰性，完成了本节科学体能/康复处方：
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono">
                      累计运动时间
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {Math.floor(playerTotalTimer / 60)} 分 {playerTotalTimer % 60} 秒
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono">
                      执行动作总量
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-400">
                      {trainingPlan.exercises.length} 个动作
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-900/40 p-4 rounded-xl text-left space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-400 font-bold block">
                    ✓ NSCA/NASM 康复与能量对齐机制
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    本套练习已按照您标记的敏感关节以及今日工作高疲劳状态进行了智能微调。在零压力、中低强度负荷下，既保留了代谢输出，又极大保护了骨骼关节。
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setHasCompletedToday(true);
                  }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all"
                >
                  保存今日训练并安全打卡
                </button>
              </div>
            ) : (
              /* Active Player Stage */
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
                
                {/* Left Side: Action Cover Entrance (Replaces Biomechanical Figure) */}
                <div className="md:col-span-6 flex flex-col items-center justify-center space-y-4">
                  <div className="w-full max-w-sm relative">
                    {playerState === 'exercise' && (
                      <span className="absolute top-4 left-4 bg-emerald-500 text-slate-950 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse z-20">
                        正在演示
                      </span>
                    )}
                    {playerState === 'rest' && (
                      <span className="absolute top-4 left-4 bg-blue-500 text-slate-950 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest z-20">
                        休息拉伸
                      </span>
                    )}
                    {playerState === 'warmup' && (
                      <span className="absolute top-4 left-4 bg-amber-500 text-slate-950 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest z-20">
                        呼吸准备
                      </span>
                    )}

                    <ActionCover
                      name={
                        playerState === 'warmup'
                          ? '全身静态呼吸拉伸'
                          : trainingPlan.exercises[currentExIndex].name
                      }
                      category={
                        playerState === 'warmup'
                          ? 'stretch'
                          : trainingPlan.exercises[currentExIndex].category
                      }
                      videoUrl={
                        playerState === 'warmup'
                          ? undefined
                          : trainingPlan.exercises[currentExIndex].videoUrl
                      }
                      isLarge={true}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 italic text-center max-w-xs leading-normal">
                    {playerState === 'exercise' 
                      ? '💡 动作存疑？直接点击上方动作封面，即可在新窗口跳转 Bilibili 观看专业教练视频，确保力学精准。'
                      : playerState === 'rest'
                      ? '间歇期间，建议站起或仰卧深长吸气，拉伸刚刚受刺激的肌肉群。'
                      : '请找个空旷地方，深吸气放松肩膀，双手自然垂下准备启动训练。'}
                  </p>
                </div>

                {/* Right Side: Active Countdown Timer & Control Dashboard */}
                <div className="md:col-span-6 space-y-6">
                  {/* Status Indicator Banner */}
                  <div className="space-y-1.5 text-center md:text-left">
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                      {playerState === 'warmup' 
                        ? '首个动作准备 (Warm-Up)' 
                        : playerState === 'rest' 
                        ? '全身间歇恢复 (Active Recovery)' 
                        : `动作 ${currentExIndex + 1} / ${trainingPlan.exercises.length} · 动作进行中`}
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {playerState === 'warmup' 
                        ? '调理呼吸，准备开启首个动作' 
                        : playerState === 'rest'
                        ? '小憩片刻：放松吸气'
                        : trainingPlan.exercises[currentExIndex].name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto md:mx-0">
                      {playerState === 'warmup'
                        ? '放松颈椎和下背部，深长地用腹部吸气和吐气，把思绪拉回到当下的身体。'
                        : playerState === 'rest'
                        ? '呼吸比运动更重要：把手放在腹部，吸气腹部隆起，吐气肋骨内收。'
                        : trainingPlan.exercises[currentExIndex].instruction}
                    </p>
                    {playerState === 'exercise' && (
                      <div className="pt-1 flex justify-center md:justify-start">
                        <a
                          href={getTutorialUrl(
                            trainingPlan.exercises[currentExIndex].name,
                            trainingPlan.exercises[currentExIndex].videoUrl
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all shadow-xl"
                        >
                          <Video className="w-4 h-4 text-emerald-400" />
                          <span>🎥 观看真人标准动作演示视频 (Bilibili)</span>
                          <ExternalLink className="w-3 h-3 text-emerald-500" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Big Circular Progression & Timer */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center md:justify-start">
                    {/* Circle Timer */}
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="64"
                          stroke="#1e293b"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="64"
                          stroke={playerState === 'rest' ? '#3b82f6' : playerState === 'warmup' ? '#f59e0b' : '#10b981'}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={402}
                          strokeDashoffset={
                            playerState === 'warmup'
                              ? 402 - (playerTimer / 8) * 402
                              : playerState === 'exercise'
                              ? 402 - (playerTimer / parseSeconds(trainingPlan.exercises[currentExIndex].duration || trainingPlan.exercises[currentExIndex].reps, 45)) * 402
                              : 402 - (playerTimer / parseSeconds(trainingPlan.exercises[currentExIndex].rest, 30)) * 402
                          }
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-3xl font-black font-mono tracking-tight block">
                          {playerTimer}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                          秒剩下 (Sec)
                        </span>
                      </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="space-y-2.5 text-center sm:text-left">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">
                            当前组数
                          </span>
                          <span className="text-sm font-bold font-mono text-white">
                            第 {playerState === 'warmup' ? '-' : playerSet} 组 / 共 {playerState === 'warmup' ? '-' : (trainingPlan.exercises[currentExIndex].sets || 3)} 组
                          </span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
                          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">
                            目标负荷
                          </span>
                          <span className="text-sm font-bold font-mono text-emerald-400">
                            {playerState === 'warmup' ? '唤醒' : (trainingPlan.exercises[currentExIndex].reps || '持续')}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center justify-between text-xs gap-3">
                        <span className="text-slate-400 font-medium">累计课时时间:</span>
                        <span className="font-mono text-emerald-400 font-extrabold text-sm">
                          {Math.floor(playerTotalTimer / 60)}分{playerTotalTimer % 60}秒
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Player Footer & Controls (Visible only during active training) */}
          {playerState !== 'complete' && (
            <footer className="px-6 py-5 border-t border-slate-900 bg-slate-900/40 backdrop-blur-md sticky bottom-0 z-10">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Back / Next labels */}
                <div className="text-slate-400 text-xs text-center sm:text-left truncate max-w-xs font-medium">
                  {currentExIndex > 0 ? (
                    <span className="block text-[10px] text-slate-500">
                      ← 上一个动作: {trainingPlan.exercises[currentExIndex - 1].name}
                    </span>
                  ) : null}
                  {currentExIndex + 1 < trainingPlan.exercises.length ? (
                    <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                      → 下一个动作: {trainingPlan.exercises[currentExIndex + 1].name}
                    </span>
                  ) : null}
                </div>

                {/* Main Controls Panel */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevExercise}
                    disabled={currentExIndex === 0}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上一个动作"
                  >
                    <SkipBack className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={handlePauseToggle}
                    className={`px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-all ${
                      playerPaused
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800'
                    }`}
                  >
                    {playerPaused ? (
                      <>
                        <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                        <span>继续运动 (Resume)</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-white" />
                        <span>暂停课时 (Pause)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSkipExercise}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
                    title="跳过/下一个动作"
                  >
                    <SkipForward className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  ELAPSED: {playerTotalTimer}S // CORE_ACTIVE
                </div>
              </div>
            </footer>
          )}
        </div>
      )}
    </div>
  );
}
