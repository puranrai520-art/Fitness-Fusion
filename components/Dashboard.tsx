import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Flame, Footprints, Timer, Share2, Bluetooth, RefreshCw, Sparkles, Heart } from 'lucide-react';
import { WorkoutSession, MealLog, UserProfile, ActivityLevel } from '../types';
import { generateDashboardInsight } from '../services/geminiService';

interface DashboardProps {
  workouts: WorkoutSession[];
  meals: MealLog[];
  userProfile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ workouts, meals, userProfile }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceSteps, setDeviceSteps] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [aiInsight, setAiInsight] = useState<string>("Analyzing your activity patterns...");
  const [isAiLoading, setIsAiLoading] = useState(true);

  // --- Calorie Calculation Logic ---
  // BMR Calculation (Mifflin-St Jeor)
  // Men: 10W + 6.25H - 5A + 5
  // Women: 10W + 6.25H - 5A - 161
  const calculateTargets = () => {
    let bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age);
    bmr += userProfile.gender === 'Male' ? 5 : -161;

    // Activity Multiplier
    const multipliers: Record<ActivityLevel, number> = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.VERY]: 1.725,
    };
    const tdee = bmr * multipliers[userProfile.activityLevel];

    // Goal Adjustment
    let dailyCalorieGoal = tdee;
    if (userProfile.goal === 'Lose Weight') dailyCalorieGoal -= 500;
    if (userProfile.goal === 'Build Muscle') dailyCalorieGoal += 300;

    return {
      calorieGoal: Math.round(dailyCalorieGoal),
      stepGoal: 10000 // Default standard
    };
  };

  const targets = calculateTargets();
  
  // Aggregates
  const totalCaloriesBurned = workouts.reduce((acc, w) => acc + w.caloriesBurned, 0);
  const totalCaloriesConsumed = meals.reduce((acc, m) => acc + m.macros.calories, 0);
  const activeMinutes = workouts.reduce((acc, w) => acc + w.durationMinutes, 0);
  const totalSteps = deviceSteps || 2450; // Fallback if no device

  useEffect(() => {
    // Fetch AI Insight on mount
    const fetchInsight = async () => {
      try {
        const insight = await generateDashboardInsight(userProfile, {
          caloriesBurned: totalCaloriesBurned,
          caloriesConsumed: totalCaloriesConsumed,
          steps: totalSteps
        });
        setAiInsight(insight);
      } catch (e) {
        setAiInsight("Focus on hitting your protein goals today!");
      } finally {
        setIsAiLoading(false);
      }
    };
    fetchInsight();
  }, [workouts, meals, deviceSteps, userProfile, totalCaloriesBurned, totalCaloriesConsumed, totalSteps]);

  const handleBluetoothSync = () => {
    if (isConnected) {
      // If already connected, just sync/refresh data
      setIsScanning(true);
      setTimeout(() => {
        setDeviceSteps(prev => prev + Math.floor(Math.random() * 500));
        setHeartRate(60 + Math.floor(Math.random() * 40));
        setIsScanning(false);
      }, 1500);
      return;
    }

    // Simulate connection process
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsConnected(true);
      setDeviceSteps(5432); // Simulated data
      setHeartRate(78);
    }, 2500);
  };

  // Visual helpers
  const caloriesProgress = Math.min(100, (totalCaloriesConsumed / targets.calorieGoal) * 100);
  const stepsProgress = Math.min(100, (totalSteps / targets.stepGoal) * 100);

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      {/* Header Section */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Hi, {userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-fusion-muted text-sm mt-1 flex items-center gap-2">
            Goal: <span className="text-fusion-primary font-medium">{userProfile.goal}</span>
          </p>
        </div>
        <button 
          onClick={handleBluetoothSync}
          className={`p-3 rounded-xl transition-all duration-300 border ${
            isConnected 
            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {isScanning ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Bluetooth className={`w-5 h-5 ${isConnected ? 'fill-current' : ''}`} />
          )}
        </button>
      </header>

      {/* AI Insight Card */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-1 rounded-3xl shadow-xl">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-fusion-primary via-cyan-500 to-purple-600 opacity-30 blur-md rounded-3xl"></div>
        <div className="relative bg-slate-900/90 backdrop-blur-xl p-5 rounded-[22px] border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-fusion-primary animate-pulse" />
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-fusion-primary to-cyan-400 uppercase tracking-wider">
              Fuse AI Analysis
            </span>
          </div>
          {isAiLoading ? (
            <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse"></div>
          ) : (
            <p className="text-white font-medium text-sm leading-relaxed">
              "{aiInsight}"
            </p>
          )}
        </div>
      </div>

      {/* Main Stats Circles */}
      <div className="grid grid-cols-2 gap-4">
        {/* Calorie Ring */}
        <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
            <Flame className="w-16 h-16 text-orange-500" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-xs font-bold uppercase">Intake</span>
              <span className="text-orange-400 text-xs">{Math.round(caloriesProgress)}%</span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold text-white">{totalCaloriesConsumed}</span>
              <span className="text-xs text-slate-400 mb-1.5">/ {targets.calorieGoal}</span>
            </div>
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000"
                style={{ width: `${caloriesProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Target calculated from TDEE</p>
          </div>
        </div>

        {/* Steps Ring (Simulated Bluetooth Data) */}
        <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
            <Footprints className="w-16 h-16 text-cyan-500" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-xs font-bold uppercase">Steps</span>
              {isConnected && <Bluetooth className="w-3 h-3 text-blue-400" />}
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold text-white">{totalSteps.toLocaleString()}</span>
            </div>
             <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${stepsProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {isConnected ? 'Synced via FusionBand' : 'Phone Motion Sensor'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center gap-1">
          <Activity className="w-5 h-5 text-fusion-primary" />
          <span className="text-lg font-bold text-white">{totalCaloriesBurned}</span>
          <span className="text-[10px] text-slate-400">Burned</span>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center gap-1">
          <Timer className="w-5 h-5 text-purple-400" />
          <span className="text-lg font-bold text-white">{activeMinutes}m</span>
          <span className="text-[10px] text-slate-400">Active</span>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
          {isConnected && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
          <Heart className={`w-5 h-5 ${isConnected ? 'text-red-500' : 'text-slate-600'}`} />
          <span className="text-lg font-bold text-white">{isConnected ? heartRate : '--'}</span>
          <span className="text-[10px] text-slate-400">BPM</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-800/30 p-5 rounded-[2rem] border border-slate-700/50 shadow-lg">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-fusion-primary" />
          Activity Trends
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { name: 'M', val: 400 },
              { name: 'T', val: 300 },
              { name: 'W', val: 600 },
              { name: 'T', val: 450 },
              { name: 'F', val: 700 },
              { name: 'S', val: 500 },
              { name: 'S', val: totalCaloriesBurned || 100 },
            ]}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} 
                itemStyle={{ color: '#84cc16' }}
                cursor={{ stroke: '#334155', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="val" stroke="#84cc16" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;