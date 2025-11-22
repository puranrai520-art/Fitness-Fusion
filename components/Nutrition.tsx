import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, Loader2, Utensils } from 'lucide-react';
import { MealLog, MacroNutrients } from '../types';
import { analyzeFoodImage } from '../services/geminiService';

interface NutritionProps {
  onAddMeal: (meal: MealLog) => void;
  meals: MealLog[];
}

const Nutrition: React.FC<NutritionProps> = ({ onAddMeal, meals }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ name: string; macros: MacroNutrients; description: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      setAnalysisResult(null);
      setIsAnalyzing(true);

      try {
        // Remove data URL prefix for API
        const base64Data = base64String.split(',')[1];
        const result = await analyzeFoodImage(base64Data, file.type);
        setAnalysisResult(result);
      } catch (error) {
        alert("Failed to analyze image. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMeal = () => {
    if (analysisResult && preview) {
      const newMeal: MealLog = {
        id: Date.now().toString(),
        name: analysisResult.name,
        timestamp: Date.now(),
        macros: analysisResult.macros,
        imageUrl: preview,
      };
      onAddMeal(newMeal);
      setPreview(null);
      setAnalysisResult(null);
    }
  };

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-white">Smart Nutrition</h1>
        <p className="text-fusion-muted text-sm">Snap a pic, track your macros.</p>
      </header>

      {/* AI Scanner Card */}
      <div className="bg-fusion-card rounded-3xl p-6 shadow-lg border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fusion-primary to-fusion-accent"></div>
        
        {!preview ? (
          <div className="text-center py-8">
            <div className="mx-auto h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-600">
              <Camera className="w-8 h-8 text-fusion-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Scan Your Meal</h3>
            <p className="text-fusion-muted text-sm mb-6">Use AI to instantly estimate calories and macros from a photo.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-fusion-primary text-fusion-dark font-bold py-3 px-8 rounded-full hover:bg-lime-400 transition-colors flex items-center justify-center mx-auto gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden h-48 bg-black">
              <img src={preview} alt="Meal preview" className="w-full h-full object-cover opacity-80" />
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-fusion-primary animate-spin mb-2" />
                  <p className="text-white font-medium animate-pulse">Analyzing...</p>
                </div>
              )}
            </div>

            {analysisResult && (
              <div className="animate-slide-up">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{analysisResult.name}</h3>
                  <span className="bg-fusion-primary text-fusion-dark text-xs font-bold px-2 py-1 rounded-md">
                    {analysisResult.macros.calories} kcal
                  </span>
                </div>
                <p className="text-sm text-fusion-muted mb-4">{analysisResult.description}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-800 p-2 rounded-lg text-center">
                    <p className="text-xs text-fusion-muted">Protein</p>
                    <p className="text-fusion-accent font-bold">{analysisResult.macros.protein}g</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-lg text-center">
                    <p className="text-xs text-fusion-muted">Carbs</p>
                    <p className="text-fusion-accent font-bold">{analysisResult.macros.carbs}g</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-lg text-center">
                    <p className="text-xs text-fusion-muted">Fat</p>
                    <p className="text-fusion-accent font-bold">{analysisResult.macros.fat}g</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setPreview(null)} 
                    className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition"
                  >
                    Retake
                  </button>
                  <button 
                    onClick={handleSaveMeal}
                    className="flex-[2] py-3 rounded-xl bg-fusion-primary text-fusion-dark font-bold hover:bg-lime-400 transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Log Meal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily Log */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Today's Intake</h3>
        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center p-3 bg-fusion-card rounded-xl border border-slate-800">
              <div className="h-12 w-12 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                {meal.imageUrl ? (
                  <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h4 className="text-white font-medium">{meal.name}</h4>
                  <span className="text-fusion-primary font-bold text-sm">{meal.macros.calories} kcal</span>
                </div>
                <p className="text-xs text-fusion-muted">
                  P: {meal.macros.protein}g • C: {meal.macros.carbs}g • F: {meal.macros.fat}g
                </p>
              </div>
            </div>
          ))}
          {meals.length === 0 && (
            <p className="text-fusion-muted text-sm text-center py-4">No meals logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
