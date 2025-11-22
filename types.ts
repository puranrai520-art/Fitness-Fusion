
export enum ActivityLevel {
  SEDENTARY = 'Sedentary',
  LIGHT = 'Lightly Active',
  MODERATE = 'Moderately Active',
  VERY = 'Very Active',
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface UserProfile {
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  weight: number; // kg
  height: number; // cm
  goal: string;
  activityLevel: ActivityLevel;
  weightHistory: WeightEntry[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  durationMinutes: number;
  caloriesBurned: number;
  goal?: string;
  goalAchieved?: boolean;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  name: string;
  timestamp: number;
  macros: MacroNutrients;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ViewState = 'dashboard' | 'workout' | 'nutrition' | 'coach' | 'profile';
