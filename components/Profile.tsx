import React from 'react';
import { UserProfile, WeightEntry, WorkoutSession } from '../types';
import { Edit2, Ruler, Weight, Activity, Target, Award, TrendingUp, Medal, Flame, Trophy, Zap, Lock, Dumbbell, Crown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileProps {
  user: UserProfile;
  workouts: WorkoutSession[];
  onEdit: () => void;
}

// Achievement Configuration
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  condition: (user: UserProfile, workouts: WorkoutSession[]) => boolean;
}

const BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Log your first workout',
    icon: Zap,
    color: 'text-yellow-400',
    condition: (u, w) => w.length >= 1,
  },
  {
    id: 'consistency_3',
    name: 'On Fire',
    description: '3-day workout streak',
    icon: Flame,
    color: 'text-orange-500',
    condition: (u, w) => calculateStreak(w) >= 3,
  },
  {
    id: 'transformation_10',
    name: 'New You',
    description: 'Lost 10kg of weight',
    icon: Activity,
    color: 'text-blue-400',
    condition: (u, w) => {
      if (!u.weightHistory || u.weightHistory.length === 0) return false;
      const startWeight = u.weightHistory[0].weight; // Assuming index 0 is oldest
      return (startWeight - u.weight) >= 10;
    },
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: '30-day workout streak',
    icon: Crown,
    color: 'text-purple-400',
    condition: (u, w) => calculateStreak(w) >= 30,
  },
  {
    id: 'club_10',
    name: 'Club 10',
    description: 'Complete 10 workouts',
    icon: Dumbbell,
    color: 'text-green-400',
    condition: (u, w) => w.length >= 10,
  },
  {
    id: 'volume_master',
    name: 'Heavy Lifter',
    description: 'Lift 5000kg+ in one session',
    icon: Trophy,
    color: 'text-red-400',
    condition: (u, w) => w.some(session => {
      const totalVolume = session.exercises.reduce((acc, ex) => acc + (ex.weight * ex.reps * ex.sets), 0);
      return totalVolume >= 5000;
    }),
  }
];

// Helper to calculate current streak
const calculateStreak = (workouts: WorkoutSession[]): number => {
  if (!workouts.length) return 0;
  
  // Get unique dates, sorted descending
  const dates = [...new Set(workouts.map(w => w.date.split('T')[0]))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if streak is alive (last workout was today or yesterday)
  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  // Count consecutive days
  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i]);
    const expected = new Date(dates[0]);
    expected.setDate(expected.getDate() - i);
    
    if (current.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const Profile: React.FC<ProfileProps> = ({ user, workouts, onEdit }) => {
  // Calculate BMI
  const heightInMeters = user.height / 100;
  const bmi = (user.weight / (heightInMeters * heightInMeters)).toFixed(1);
  const bmiValue = parseFloat(bmi);

  let bmiCategory = '';
  let bmiColor = '';

  if (bmiValue < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-blue-400';
  } else if (bmiValue >= 18.5 && bmiValue < 25) {
    bmiCategory = 'Healthy';
    bmiColor = 'text-green-400';
  } else if (bmiValue >= 25 && bmiValue < 30) {
    bmiCategory = 'Overweight';
    bmiColor = 'text-orange-400';
  } else {
    bmiCategory = 'Obese';
    bmiColor = 'text-red-400';
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Prepare data for chart
  const getChartData = () => {
    if (user.weightHistory && user.weightHistory.length > 1) {
      return user.weightHistory;
    }
    
    // Generate mock historical data ending at current weight for visualization
    const mockData: WeightEntry[] = [];
    const currentWeight = user.weight;
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const variance = (Math.random() * 4) - 2; 
      const weight = parseFloat((currentWeight + (i * 0.5) + variance).toFixed(1));
      
      mockData.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        weight: i === 0 ? currentWeight : weight
      });
    }
    return mockData;
  };

  const chartData = getChartData();

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="relative pt-4 pb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fusion-primary to-emerald-600 flex items-center justify-center shadow-2xl shadow-lime-900/50 mb-4 text-fusion-dark font-bold text-3xl relative">
          {getInitials(user.name)}
          <div className="absolute bottom-0 right-0 bg-slate-800 rounded-full p-1.5 border border-slate-700">
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-fusion-primary border border-slate-700">
            {user.gender} • {user.age} yo
          </span>
        </div>
        <button 
          onClick={onEdit}
          className="absolute top-4 right-0 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-fusion-card p-4 rounded-2xl border border-slate-700 shadow-sm flex flex-col items-center justify-center">
          <div className="p-2 bg-blue-500/10 rounded-full mb-2">
             <Weight className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-2xl font-bold text-white">{user.weight} <span className="text-xs text-slate-500 font-normal">kg</span></span>
          <span className="text-xs text-slate-400 mt-1">Weight</span>
        </div>
        <div className="bg-fusion-card p-4 rounded-2xl border border-slate-700 shadow-sm flex flex-col items-center justify-center">
          <div className="p-2 bg-purple-500/10 rounded-full mb-2">
             <Ruler className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-2xl font-bold text-white">{user.height} <span className="text-xs text-slate-500 font-normal">cm</span></span>
          <span className="text-xs text-slate-400 mt-1">Height</span>
        </div>
      </div>

      {/* BMI Card */}
      <div className="bg-fusion-card p-6 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              BMI Score
              <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 cursor-help" title="Body Mass Index">?</div>
            </h3>
            <p className={`text-2xl font-bold ${bmiColor}`}>{bmi}</p>
            <p className={`text-sm font-medium ${bmiColor}`}>{bmiCategory}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl">
            <Activity className={`w-6 h-6 ${bmiColor}`} />
          </div>
        </div>
        
        {/* Custom BMI Gauge */}
        <div className="relative h-3 bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-1/4 bg-blue-400/50"></div>
          <div className="absolute top-0 left-1/4 h-full w-1/4 bg-green-400/50"></div>
          <div className="absolute top-0 left-2/4 h-full w-1/4 bg-orange-400/50"></div>
          <div className="absolute top-0 left-3/4 h-full w-1/4 bg-red-400/50"></div>
          <div 
            className="absolute top-0 w-1 h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000 ease-out"
            style={{ left: `${Math.min(Math.max((bmiValue / 40) * 100, 0), 100)}%` }} 
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
      </div>

      {/* Weight Progress Chart */}
      <div className="bg-fusion-card p-6 rounded-3xl border border-slate-700 shadow-lg">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-fusion-accent/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-fusion-accent" />
          </div>
          <h3 className="text-lg font-bold text-white">Weight Progress</h3>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ dy: 10 }}
              />
              <YAxis 
                hide={false} 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
                width={30}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#06b6d4' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#06b6d4" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#1e293b' }}
                activeDot={{ r: 6, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-400" />
            Achievements
          </h3>
          <span className="text-xs text-fusion-muted bg-slate-800 px-2 py-1 rounded-md">
            {BADGES.filter(b => b.condition(user, workouts)).length} / {BADGES.length} Unlocked
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const isUnlocked = badge.condition(user, workouts);
            return (
              <div 
                key={badge.id} 
                className={`relative p-3 rounded-2xl border flex flex-col items-center text-center transition-all duration-500 ${
                  isUnlocked 
                    ? 'bg-slate-800 border-slate-600 shadow-lg shadow-black/20' 
                    : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale'
                }`}
              >
                <div className={`p-3 rounded-full mb-2 ${isUnlocked ? 'bg-slate-700' : 'bg-slate-800'}`}>
                  <badge.icon className={`w-6 h-6 ${isUnlocked ? badge.color : 'text-slate-500'}`} />
                </div>
                <h4 className={`text-xs font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                  {badge.name}
                </h4>
                <p className="text-[9px] text-slate-400 leading-tight">
                  {badge.description}
                </p>
                
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-2xl backdrop-blur-[1px]">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal & Activity Info */}
      <div className="space-y-4">
        <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center space-x-4 border border-slate-700">
          <div className="p-3 bg-fusion-primary/10 rounded-xl">
            <Target className="w-6 h-6 text-fusion-primary" />
          </div>
          <div>
            <p className="text-xs text-fusion-muted uppercase tracking-wide">Current Goal</p>
            <p className="text-white font-semibold">{user.goal}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center space-x-4 border border-slate-700">
          <div className="p-3 bg-fusion-accent/10 rounded-xl">
            <Award className="w-6 h-6 text-fusion-accent" />
          </div>
          <div>
            <p className="text-xs text-fusion-muted uppercase tracking-wide">Activity Level</p>
            <p className="text-white font-semibold">{user.activityLevel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;