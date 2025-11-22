import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Dumbbell, Share2, Target, Trophy, Play, Pause, Timer as TimerIcon, Sparkles, Loader2 } from 'lucide-react';
import { WorkoutSession, Exercise, UserProfile } from '../types';
import { generateWorkoutPlan } from '../services/geminiService';

interface WorkoutProps {
  onAddWorkout: (workout: WorkoutSession) => void;
  onUpdateWorkout: (workout: WorkoutSession) => void;
  workouts: WorkoutSession[];
  userProfile: UserProfile;
}

const Workout: React.FC<WorkoutProps> = ({ onAddWorkout, onUpdateWorkout, workouts, userProfile }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [currentSessionName, setCurrentSessionName] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  const [goalAchieved, setGoalAchieved] = useState(false);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);
  
  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Form state for new exercise
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exWeight, setExWeight] = useState('');

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && isLogging) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isLogging]);

  const startLogging = () => {
    setIsLogging(true);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setCurrentSessionName('');
    setCurrentGoal('');
    setGoalAchieved(false);
    setCurrentExercises([]);
    setAiStrategy(null);
  };

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateWorkoutPlan(userProfile, workouts);
      
      startLogging(); // Switch to view
      
      setCurrentSessionName(plan.workoutName);
      setAiStrategy(plan.strategy);
      
      // Map AI exercises to App Exercise type
      const mappedExercises: Exercise[] = plan.exercises.map((ex) => ({
        id: Date.now().toString() + Math.random().toString(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weightSuggestion,
        completed: false
      }));
      
      setCurrentExercises(mappedExercises);
    } catch (error) {
      console.error("Failed to generate plan", error);
      alert("Could not generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelLogging = () => {
    setIsLogging(false);
    setIsTimerRunning(false);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addExercise = () => {
    if (!exName || !exSets || !exReps) return;
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exName,
      sets: parseInt(exSets),
      reps: parseInt(exReps),
      weight: parseInt(exWeight) || 0,
      completed: false
    };

    setCurrentExercises([...currentExercises, newExercise]);
    setExName('');
    setExSets('');
    setExReps('');
    setExWeight('');
  };

  const finishSession = () => {
    if (!currentSessionName || currentExercises.length === 0) return;

    // Calculate actual duration, minimum 1 minute
    const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    // Simple mock calorie calculation based on duration and intensity (exercises count)
    const calculatedCalories = Math.floor(durationMinutes * 5 + (currentExercises.length * 20));

    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name: currentSessionName,
      exercises: currentExercises,
      durationMinutes: durationMinutes,
      caloriesBurned: calculatedCalories,
      goal: currentGoal,
      goalAchieved: goalAchieved
    };

    onAddWorkout(newSession);
    setIsLogging(false);
    setIsTimerRunning(false);
    setCurrentSessionName('');
    setCurrentGoal('');
    setGoalAchieved(false);
    setCurrentExercises([]);
    setAiStrategy(null);
  };

  const toggleExerciseComplete = (id: string) => {
    setCurrentExercises(currentExercises.map(e => 
      e.id === id ? { ...e, completed: !e.completed } : e
    ));
  };

  const toggleGoalAchieved = (w: WorkoutSession) => {
    onUpdateWorkout({ ...w, goalAchieved: !w.goalAchieved });
  };

  const handleShareWorkout = async (w: WorkoutSession) => {
    let shareText = `🚀 I just completed a workout on Fitness Fusion!\n\n🏋️ ${w.name}\n⏱️ ${w.durationMinutes} minutes\n🔥 ${w.caloriesBurned} kcal burned`;
    
    if (w.goal) {
      shareText += `\n🎯 Goal: ${w.goal} ${w.goalAchieved ? '✅ (ACHIEVED!)' : ''}`;
    }
    
    shareText += `\n\nCan you beat my score? #FitnessFusion`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Workout Complete!',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Workout summary copied to clipboard!');
      }
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  if (isLogging) {
    return (
      <div className="pb-24 h-full flex flex-col animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={cancelLogging}
            className="text-fusion-muted text-sm hover:text-white"
          >
            Cancel
          </button>
          
          {/* Live Timer */}
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="font-mono text-xl font-bold text-white tracking-widest">
              {formatTime(elapsedSeconds)}
            </span>
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="ml-1 text-fusion-primary hover:text-lime-400"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          <button 
            onClick={finishSession}
            className="text-fusion-primary font-bold text-sm disabled:opacity-50"
            disabled={!currentSessionName || currentExercises.length === 0}
          >
            Finish
          </button>
        </div>

        {/* AI Strategy Banner */}
        {aiStrategy && (
          <div className="bg-gradient-to-r from-purple-900/50 to-slate-800 mb-4 p-3 rounded-xl border border-purple-500/30 flex items-start gap-2 animate-slide-up">
            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase mb-1">AI Strategy</p>
              <p className="text-xs text-slate-200 italic">"{aiStrategy}"</p>
            </div>
          </div>
        )}

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <input 
              type="text" 
              placeholder="Workout Name (e.g., Leg Day)"
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 border-none focus:ring-0 p-0 mb-2"
              value={currentSessionName}
              onChange={(e) => setCurrentSessionName(e.target.value)}
            />
            <div className="flex items-center space-x-2 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 focus-within:border-fusion-primary/50 transition-colors">
              <Target className="w-4 h-4 text-fusion-muted" />
              <input 
                type="text" 
                placeholder="Set a goal (e.g. Squat 100kg)"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 border-none focus:ring-0 p-0"
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {currentExercises.map((ex) => (
              <div key={ex.id} className="bg-fusion-card p-4 rounded-xl flex items-center justify-between border border-slate-800">
                <div onClick={() => toggleExerciseComplete(ex.id)} className="cursor-pointer flex items-center space-x-3">
                  {ex.completed ? <CheckCircle className="text-fusion-primary w-6 h-6" /> : <Circle className="text-slate-600 w-6 h-6" />}
                  <div>
                    <p className={`font-semibold ${ex.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{ex.name}</p>
                    <p className="text-xs text-fusion-muted">{ex.sets} sets x {ex.reps} reps {ex.weight > 0 && `@ ${ex.weight}kg`}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {currentExercises.length === 0 && (
              <div className="text-center py-8 text-slate-600 italic text-sm">
                No exercises added yet. Let's get moving!
              </div>
            )}
          </div>

          {/* Add Exercise Form */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mt-4">
            <p className="text-sm text-white font-semibold mb-3">Add Exercise</p>
            <div className="grid grid-cols-1 gap-3 mb-3">
              <input 
                className="bg-slate-900 rounded-lg p-3 text-white text-sm border border-slate-700 focus:border-fusion-primary outline-none" 
                placeholder="Exercise Name"
                value={exName}
                onChange={(e) => setExName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <input 
                type="number" 
                className="bg-slate-900 rounded-lg p-3 text-white text-sm border border-slate-700 focus:border-fusion-primary outline-none" 
                placeholder="Sets"
                value={exSets}
                onChange={(e) => setExSets(e.target.value)}
              />
              <input 
                type="number" 
                className="bg-slate-900 rounded-lg p-3 text-white text-sm border border-slate-700 focus:border-fusion-primary outline-none" 
                placeholder="Reps"
                value={exReps}
                onChange={(e) => setExReps(e.target.value)}
              />
              <input 
                type="number" 
                className="bg-slate-900 rounded-lg p-3 text-white text-sm border border-slate-700 focus:border-fusion-primary outline-none" 
                placeholder="kg"
                value={exWeight}
                onChange={(e) => setExWeight(e.target.value)}
              />
            </div>
            <button 
              onClick={addExercise}
              className="w-full py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add to Session
            </button>
          </div>
          
          {currentGoal && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-xl flex items-center justify-between border border-slate-700">
               <span className="text-sm text-slate-300 flex items-center gap-2">
                 <Target className="w-4 h-4 text-fusion-primary" />
                 Goal: {currentGoal}
               </span>
               <label className="flex items-center gap-2 cursor-pointer">
                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${goalAchieved ? 'bg-fusion-primary border-fusion-primary' : 'border-slate-500'}`}>
                   {goalAchieved && <CheckCircle className="w-4 h-4 text-fusion-dark" />}
                 </div>
                 <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={goalAchieved} 
                    onChange={() => setGoalAchieved(!goalAchieved)}
                 />
                 <span className="text-xs text-white font-medium">Achieved?</span>
               </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
       <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Workouts</h1>
          <p className="text-fusion-muted text-sm">Track your gains.</p>
        </div>
        <button 
          onClick={startLogging}
          className="bg-fusion-primary text-fusion-dark p-3 rounded-full shadow-lg shadow-lime-900/20 hover:bg-lime-400 transition"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* AI Workout Generator Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-0.5 rounded-2xl shadow-xl">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-[14px] p-5 text-center">
          <div className="w-12 h-12 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">Not sure what to do?</h3>
          <p className="text-slate-400 text-xs mb-4 px-4">
            Let Fuse analyze your recovery and goals to build the perfect workout for today.
          </p>
          <button 
            onClick={handleGenerateWorkout}
            disabled={isGenerating}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Designing Plan...
              </>
            ) : (
              <>
                Generate AI Workout
              </>
            )}
          </button>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center p-6 border-2 border-dashed border-slate-800 rounded-3xl">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
            <Dumbbell className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-fusion-muted text-sm">Log your first session manually or use AI above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => (
            <div key={w.id} className="bg-fusion-card p-5 rounded-2xl border border-slate-700 shadow-sm group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{w.name}</h3>
                  <p className="text-xs text-fusion-muted">{new Date(w.date).toLocaleDateString()} • {w.durationMinutes} min</p>
                </div>
                <div className="bg-fusion-primary/10 px-3 py-1 rounded-full">
                  <span className="text-fusion-primary text-xs font-bold">{w.caloriesBurned} kcal</span>
                </div>
              </div>

              {/* Goal Section */}
              {w.goal && (
                <div className={`mb-4 p-2.5 rounded-xl flex items-center justify-between border ${w.goalAchieved ? 'bg-fusion-primary/10 border-fusion-primary/20' : 'bg-slate-800/50 border-slate-700'}`}>
                   <span className="text-sm text-slate-300 flex items-center gap-2">
                     <Target className="w-4 h-4 text-fusion-primary" />
                     Goal: {w.goal}
                   </span>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       toggleGoalAchieved(w);
                     }}
                     className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-bold border ${w.goalAchieved ? 'bg-fusion-primary text-fusion-dark border-fusion-primary' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
                   >
                     {w.goalAchieved ? 'Done' : 'Mark Done'}
                   </button>
                </div>
              )}
              
              {/* Exercises Summary (just first 3) */}
               <div className="space-y-2 mb-4">
                 {w.exercises.slice(0, 3).map((e) => (
                   <div key={e.id} className="flex justify-between text-sm text-slate-400 border-b border-slate-800/50 pb-1 last:border-0">
                      <span>{e.sets}x {e.name}</span>
                      <span>{e.weight > 0 ? `${e.weight}kg` : 'BW'}</span>
                   </div>
                 ))}
                 {w.exercises.length > 3 && (
                   <div className="text-xs text-fusion-muted pt-1">+{w.exercises.length - 3} more exercises</div>
                 )}
              </div>

               <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-800">
                 <button onClick={() => handleShareWorkout(w)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition border border-slate-700">
                    <Share2 className="w-4 h-4" /> Share
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workout;