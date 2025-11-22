import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChatMessage, MacroNutrients, UserProfile, WorkoutSession, MealLog } from "../types";

// Initialize Gemini Client
// NOTE: API Key is expected to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFoodImage = async (base64Image: string, mimeType: string): Promise<{ name: string; macros: MacroNutrients; description: string }> => {
  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Name of the food item or meal" },
        calories: { type: Type.NUMBER, description: "Estimated total calories" },
        protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
        carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
        fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
        description: { type: Type.STRING, description: "Brief nutritional summary regarding healthiness" },
      },
      required: ["name", "calories", "protein", "carbs", "fat", "description"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this food image. Estimate the macronutrients and provide a summary.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are an expert nutritionist AI. Analyze food images with high accuracy.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    return {
      name: data.name,
      macros: {
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
      },
      description: data.description,
    };
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

export const getFitnessCoaching = async (history: ChatMessage[], userContext: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are 'Fuse', an elite personal fitness coach and motivator.
        
        User Profile & Context:
        ${userContext}
        
        Instructions:
        1. Use the user's name, age, goals, and recent workouts to personalize your advice.
        2. If recent workouts are missing, gently encourage them to start.
        3. If they are active, challenge them to beat their personal bests.
        4. Keep responses concise, motivating, and actionable.
        5. Use emojis sparingly but effectively to maintain high energy.`,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage.role !== 'user') return "";

    const result = await chat.sendMessage({ message: lastUserMessage.text });
    return result.text || "Keep pushing! I'm analyzing your request.";
  } catch (error) {
    console.error("Error in coaching chat:", error);
    return "I'm having trouble connecting to the fitness server. Let's focus on your breathing for a moment.";
  }
};

export const generateDashboardInsight = async (
  user: UserProfile, 
  stats: { caloriesBurned: number; caloriesConsumed: number; steps: number }
): Promise<string> => {
  try {
    const prompt = `
      Analyze this daily snapshot for a user named ${user.name}.
      Goal: ${user.goal}.
      Stats Today: 
      - Burned: ${stats.caloriesBurned} kcal
      - Consumed: ${stats.caloriesConsumed} kcal
      - Steps: ${stats.steps}
      
      Provide a 1-sentence, high-impact specific observation or tip to help them reach their goal today. 
      Be direct and motivating.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text || "Stay consistent to see results!";
  } catch (error) {
    console.error("Insight error", error);
    return "Great job logging in today. Let's crush some goals!";
  }
};

export interface AIWorkoutPlan {
  workoutName: string;
  strategy: string;
  exercises: {
    name: string;
    sets: number;
    reps: number;
    weightSuggestion: number; // Use 0 for bodyweight
  }[];
}

export const generateWorkoutPlan = async (user: UserProfile, recentWorkouts: WorkoutSession[]): Promise<AIWorkoutPlan> => {
  try {
    // Construct history context
    const historySummary = recentWorkouts.slice(0, 3).map(w => 
      `${w.date.split('T')[0]}: ${w.name} (${w.exercises.length} exercises)`
    ).join('; ');

    const prompt = `
      Design a workout session for:
      Name: ${user.name}, Goal: ${user.goal}, Level: ${user.activityLevel}.
      Recent History: ${historySummary || "None"}.
      
      Create a balanced workout that fits their goal and doesn't overtrain recently used muscle groups.
      If they have no history, suggest a "Full Body Foundation" workout.
      Weight suggestions should be estimated in kg based on level (e.g. 0 for bodyweight, reasonable start for beginners).
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        workoutName: { type: Type.STRING, description: "A catchy name for the session" },
        strategy: { type: Type.STRING, description: "One sentence explaining why this workout was chosen" },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.INTEGER },
              reps: { type: Type.INTEGER },
              weightSuggestion: { type: Type.INTEGER, description: "Weight in kg, 0 for bodyweight" }
            },
            required: ["name", "sets", "reps", "weightSuggestion"]
          }
        }
      },
      required: ["workoutName", "strategy", "exercises"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No plan generated");
    
    return JSON.parse(text) as AIWorkoutPlan;

  } catch (error) {
    console.error("Workout plan generation error:", error);
    // Fallback plan
    return {
      workoutName: "Quick HIIT Blast",
      strategy: "Fallback routine to keep you moving.",
      exercises: [
        { name: "Jumping Jacks", sets: 3, reps: 30, weightSuggestion: 0 },
        { name: "Pushups", sets: 3, reps: 10, weightSuggestion: 0 },
        { name: "Squats", sets: 3, reps: 15, weightSuggestion: 0 },
      ]
    };
  }
};