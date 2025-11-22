
import React, { useState } from 'react';
import { UserProfile, ActivityLevel } from '../types';
import { ChevronRight, Activity, User, Ruler, Weight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: 'Male',
    activityLevel: ActivityLevel.MODERATE,
    goal: 'Build Muscle'
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    if (formData.name && formData.age && formData.weight && formData.height) {
      const profile: UserProfile = {
        ...formData as UserProfile,
        weightHistory: [
          { date: new Date().toISOString().split('T')[0], weight: formData.weight! }
        ]
      };
      onComplete(profile);
    }
  };

  return (
    <div className="h-screen w-full bg-fusion-dark flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-fusion-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-fusion-accent/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Fitness Fusion</h1>
          <p className="text-fusion-muted">Let's personalize your experience.</p>
          
          {/* Progress Bar */}
          <div className="flex gap-2 justify-center mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-fusion-primary' : 'w-2 bg-slate-700'}`} />
            ))}
          </div>
        </div>

        <div className="bg-fusion-card p-6 rounded-3xl border border-slate-800 shadow-2xl">
          
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-4">Who are you?</h2>
              
              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Name</label>
                <div className="flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus-within:border-fusion-primary transition">
                  <User className="w-5 h-5 text-slate-500 mr-3" />
                  <input 
                    type="text" 
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your Name"
                    className="bg-transparent w-full text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleChange('gender', g)}
                      className={`py-3 rounded-xl text-sm font-medium transition ${
                        formData.gender === g 
                        ? 'bg-fusion-primary text-fusion-dark' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Age</label>
                <input 
                  type="number" 
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', parseInt(e.target.value))}
                  placeholder="Years"
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus:border-fusion-primary outline-none text-white"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-4">Body Metrics</h2>
              
              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Height (cm)</label>
                <div className="flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus-within:border-fusion-primary transition">
                  <Ruler className="w-5 h-5 text-slate-500 mr-3" />
                  <input 
                    type="number" 
                    value={formData.height || ''}
                    onChange={(e) => handleChange('height', parseInt(e.target.value))}
                    placeholder="175"
                    className="bg-transparent w-full text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Weight (kg)</label>
                <div className="flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 focus-within:border-fusion-primary transition">
                  <Weight className="w-5 h-5 text-slate-500 mr-3" />
                  <input 
                    type="number" 
                    value={formData.weight || ''}
                    onChange={(e) => handleChange('weight', parseInt(e.target.value))}
                    placeholder="70"
                    className="bg-transparent w-full text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-4">Goals & Activity</h2>
              
              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Primary Goal</label>
                <select 
                  value={formData.goal}
                  onChange={(e) => handleChange('goal', e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-fusion-primary outline-none appearance-none"
                >
                  <option>Lose Weight</option>
                  <option>Build Muscle</option>
                  <option>Improve Stamina</option>
                  <option>Keep Fit</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-fusion-muted uppercase font-bold tracking-wider">Activity Level</label>
                <div className="space-y-2">
                  {Object.values(ActivityLevel).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleChange('activityLevel', level)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition flex items-center justify-between ${
                        formData.activityLevel === level 
                        ? 'bg-fusion-primary/20 border border-fusion-primary text-white' 
                        : 'bg-slate-800 border border-transparent text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {level}
                      {formData.activityLevel === level && <Activity className="w-4 h-4 text-fusion-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={handleNext}
            disabled={
              (step === 1 && (!formData.name || !formData.age)) ||
              (step === 2 && (!formData.height || !formData.weight))
            }
            className="w-full mt-8 bg-fusion-primary text-fusion-dark font-bold py-4 rounded-xl hover:bg-lime-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {step === 3 ? 'Start Journey' : 'Next'}
            {step !== 3 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
