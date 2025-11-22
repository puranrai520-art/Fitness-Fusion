import React, { useState } from 'react';
import { LayoutDashboard, Dumbbell, Utensils, Bot, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Workout from './components/Workout';
import Nutrition from './components/Nutrition';
import AICoach from './components/AICoach';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import { ViewState, WorkoutSession, MealLog, UserProfile } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  
  // Initialize with null to simulate first-time login
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleAddWorkout = (workout: WorkoutSession) => {
    setWorkouts([workout, ...workouts]);
    setCurrentView('dashboard');
  };

  const handleUpdateWorkout = (updatedWorkout: WorkoutSession) => {
    setWorkouts(workouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w));
  };

  const handleAddMeal = (meal: MealLog) => {
    setMeals([meal, ...meals]);
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentView('dashboard');
  };

  const handleEditProfile = () => {
    setUserProfile(null);
  };

  if (!userProfile) {
    return <Onboarding onComplete={handleProfileComplete} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard workouts={workouts} meals={meals} userProfile={userProfile} />;
      case 'workout':
        return <Workout onAddWorkout={handleAddWorkout} onUpdateWorkout={handleUpdateWorkout} workouts={workouts} userProfile={userProfile} />;
      case 'nutrition':
        return <Nutrition onAddMeal={handleAddMeal} meals={meals} />;
      case 'coach':
        // Pass detailed profile and workouts for personalized coaching
        return <AICoach userProfile={userProfile} workouts={workouts} />;
      case 'profile':
        return <Profile user={userProfile} workouts={workouts} onEdit={handleEditProfile} />;
      default:
        return <Dashboard workouts={workouts} meals={meals} userProfile={userProfile} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
        currentView === view ? 'text-fusion-primary' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className={`w-6 h-6 ${currentView === view ? 'animate-bounce-small' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-fusion-dark text-fusion-text font-sans selection:bg-fusion-primary selection:text-fusion-dark">
      <main className="max-w-md mx-auto h-screen bg-fusion-dark flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {renderView()}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="h-20 bg-fusion-card/90 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 absolute bottom-0 w-full z-50 pb-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Home" />
          <NavItem view="workout" icon={Dumbbell} label="Workout" />
          <div className="relative -top-5">
             <button 
              onClick={() => setCurrentView('coach')}
              className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-lime-500/20 transition-all duration-300 ${
                currentView === 'coach' 
                ? 'bg-white text-fusion-dark scale-110' 
                : 'bg-gradient-to-br from-fusion-primary to-green-500 text-fusion-dark hover:scale-105'
              }`}
            >
              <Bot className="w-7 h-7" />
            </button>
          </div>
          <NavItem view="nutrition" icon={Utensils} label="Food" />
          <NavItem view="profile" icon={User} label="Profile" />
        </div>
      </main>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-bounce-small {
          animation: bounce-small 0.3s infinite alternate;
        }
        @keyframes bounce-small {
          from { transform: translateY(0); }
          to { transform: translateY(-2px); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom Scrollbar Hide */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;