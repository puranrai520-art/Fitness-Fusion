import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, UserProfile, WorkoutSession } from '../types';
import { getFitnessCoaching } from '../services/geminiService';

interface AICoachProps {
  userProfile: UserProfile;
  workouts: WorkoutSession[];
}

const AICoach: React.FC<AICoachProps> = ({ userProfile, workouts }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Hey ${userProfile.name.split(' ')[0]}! I'm Fuse, your AI performance coach. I've analyzed your profile and recent activity. Ready to level up? Ask me for a workout plan, nutrition advice, or just some motivation!`,
      timestamp: Date.now(),
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Construct a rich context string for the AI
  const userContext = useMemo(() => {
    const recentWorkouts = workouts.slice(0, 5).map(w => 
      `- ${w.name} (${new Date(w.date).toLocaleDateString()}): ${w.durationMinutes} min, ${w.caloriesBurned} kcal`
    ).join('\n');

    return `
      User Name: ${userProfile.name}
      Age: ${userProfile.age}
      Gender: ${userProfile.gender}
      Height: ${userProfile.height}cm
      Weight: ${userProfile.weight}kg
      Primary Goal: ${userProfile.goal}
      Activity Level: ${userProfile.activityLevel}
      
      Recent Workouts (Last 5):
      ${recentWorkouts || "No recent workouts recorded."}
    `.trim();
  }, [userProfile, workouts]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getFitnessCoaching([...messages, userMsg], userContext);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in">
      <header className="mb-4 flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-fusion-primary to-green-400 rounded-xl shadow-lg shadow-lime-900/20">
          <Bot className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Coach Fuse</h1>
          <p className="text-fusion-muted text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-fusion-primary text-fusion-dark rounded-tr-sm' 
                : 'bg-fusion-card text-slate-200 border border-slate-700 rounded-tl-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-fusion-card p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-fusion-primary animate-spin" />
              <span className="text-xs text-slate-400">Fuse is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Fuse anything..."
          className="w-full bg-slate-800 text-white pl-4 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-fusion-primary/50 border border-slate-700 placeholder-slate-500"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 bottom-2 p-2 bg-fusion-primary rounded-lg text-fusion-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400 transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AICoach;