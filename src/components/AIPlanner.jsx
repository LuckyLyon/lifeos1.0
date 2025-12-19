import React, { useState } from 'react';
import useEnergy from '../contexts/useEnergy';
import { Sparkles, X, Check } from 'lucide-react';

const AIPlanner = ({ isOpen, onClose }) => {
  const { apiKey, energyProfile, incrementRefreshTrigger } = useEnergy();
  const [goal, setGoal] = useState('');
  const [parsedPlan, setParsedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleApplyToCalendar = () => {
    if (!parsedPlan) return;
    
    // Save roadmap to localStorage if it exists
    if (parsedPlan.roadmap) {
      localStorage.setItem('lifeos-current-roadmap', parsedPlan.roadmap);
    }
    
    // Calculate dates starting from today
    const today = new Date();
    
    parsedPlan.tasks.forEach((dayPlan, index) => {
      // Calculate the date for this plan day
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + index);
      const dateKey = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const storageKey = `lifeos-tasks-day-${dateKey}`;
      
      // Read existing tasks
      const existingTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Convert AI tasks to standard format with unique IDs (no prefix)
      const newTasks = dayPlan.tasks.map((task) => ({
        id: Date.now() + Math.random(), // Unique ID
        time: task.time,
        text: task.text, // Just the task text without prefix
        done: false,
        duration: 60 // Default duration of 1 hour
      }));
      
      // Merge tasks (existing + new)
      const combinedTasks = [...existingTasks, ...newTasks];
      
      // Sort tasks by time string (e.g., "09:00" before "10:00")
      combinedTasks.sort((a, b) => a.time.localeCompare(b.time));
      
      // Save combined tasks to localStorage
      localStorage.setItem(storageKey, JSON.stringify(combinedTasks));
    });
    
    // Show success message
    setSuccess(true);
    
    // Close modal after a short delay
    setTimeout(() => {
      onClose();
      incrementRefreshTrigger(); // Trigger refresh to show new tasks
    }, 1500);
  };

  const handleGeneratePlan = async () => {
    if (!goal.trim() || !apiKey || !energyProfile) return;

    setIsLoading(true);
    try {
      // Log masked API key for debugging
      const maskedApiKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'No API key';
      console.log('🔑 API Key (masked):', maskedApiKey);
      console.log('Current API Key used:', apiKey ? 'Detected' : 'Empty');

      // Check and log energyProfile
      console.log('📅 Energy Profile:', energyProfile);

      const weeklyRhythm = Object.entries(energyProfile).map(([dayIndex, mode]) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${days[parseInt(dayIndex)]}: ${mode}`;
      }).join('\n');

      const prompt = `You are the LifeOS Strategist. Your goal is to break down a big goal into a personalized plan.

Green Day (Growth): Assign challenging, high-energy tasks (Deep Work, Learning new concepts).
Blue Day (Flow): Assign restorative, low-energy tasks (Reviewing, Organizing, Maintenance).

For vague user inputs, automatically infer the 4-Dimensional Default Context:
1. Goal: User's stated goal
2. Duration: Default to 7 days if not specified
3. Level: Default to "Beginner" if skill level is unclear
4. Expectation: Default to "Basic Introduction" if expectation is unclear

If Duration/Level/Expectation are missing in user input, DEFAULT to: Duration=1 Week, Level=Beginner, Expectation=Basic Introduction.
Ensure the tone is encouraging for beginners.

Analyze the user's goal duration:
- If Long-Term (> 2 weeks): Provide a 'roadmap' summary of milestones (Quarter/Month breakdown) AND detailed 'tasks' for the FIRST 7 DAYS only.
- If Short-Term or Unspecified: 'roadmap' is null, provide detailed 'tasks' for 7 days.

The user's weekly energy profile is provided. You MUST match tasks to the day's mode.

All task descriptions and responses MUST be in Chinese (简体中文).

User's Weekly Rhythm:
${weeklyRhythm}

User's Goal: ${goal}

Output JSON Format: You MUST return a JSON object with two fields:
1. "roadmap": A string summarizing the long-term phases (e.g., "Phase 1 (Week 1): Foundation... Phase 2: ..."). If short-term, this is null.
2. "tasks": A JSON array of 7 days (Day 0-6), each containing an array of 2-4 tasks with 'time', 'text', and 'type' (green/blue).

Example Long-Term JSON Structure:
{
  "roadmap": "Phase 1 (Week 1): 建立基础理论知识并完成环境搭建。Phase 2 (Weeks 2-3): 学习核心编程概念和实践练习。Phase 3 (Week 4): 完成项目开发和总结回顾。",
  "tasks": [
    {
      "day": 0,
      "dayName": "Sunday",
      "mode": "green",
      "tasks": [
        {"time": "09:00", "text": "阅读书籍的前三章", "type": "green"},
        {"time": "14:00", "text": "创建学习笔记", "type": "green"},
        {"time": "19:00", "text": "复习关键概念", "type": "green"}
      ]
    },
    {
      "day": 1,
      "dayName": "Monday",
      "mode": "blue",
      "tasks": [
        {"time": "10:00", "text": "整理工作区", "type": "blue"},
        {"time": "15:00", "text": "回顾前一天的进度", "type": "blue"}
      ]
    }
  ]
}

Example Short-Term JSON Structure:
{
  "roadmap": null,
  "tasks": [
    {
      "day": 0,
      "dayName": "Sunday",
      "mode": "green",
      "tasks": [
        {"time": "09:00", "text": "完成项目的第一部分", "type": "green"},
        {"time": "14:00", "text": "进行代码审查", "type": "green"}
      ]
    }
  ]
}

Please ensure your response contains ONLY the valid JSON structure, no additional text.`;

      // Log constructed prompt
      console.log('💬 Constructed Prompt:', prompt);

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3',
          messages: [
            { role: 'system', content: 'You are the LifeOS Strategist. Your goal is to break down a big goal into a personalized plan with flexible duration up to 30 days.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      console.log('📡 API Response Status:', response.status);

      if (!response.ok) {
        // Get detailed error from API
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        
        // Create user-friendly error message
        const errorMessage = errorData.error?.message || errorData.detail || 'Unknown API error';
        throw new Error(`API Error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      // 1. Clean the Output
      let cleanJson = data.choices[0].message.content;
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Add debug log for raw AI output
      console.log('Raw AI Output:', cleanJson);

      try {
        // 2. Safe Parse
        const parsedData = JSON.parse(cleanJson);
        
        // 3. Structure Normalization
        let finalPlan = {};
        if (Array.isArray(parsedData)) {
          finalPlan = { tasks: parsedData, roadmap: null };
        } else {
          finalPlan = parsedData;
        }
        
        // 4. Update State
        setParsedPlan(finalPlan);

      } catch (e) {
        // 5. Error Handling
        console.error("JSON Parse Error:", e);
        console.log("Raw Output was:", cleanJson);
        alert("AI output format error. Please try again.");
      } finally {
        // 6. STOP LOADING (Crucial!)
        setIsLoading(false);
      }
    } catch (error) {
      console.error('💥 Full Error Details:', {
        message: error.message,
        stack: error.stack
      });
      // Handle error silently for now
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-amber-500" />
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Goal Decomposition</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="space-y-4 mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            What is your big goal?
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Finish reading Mini Habits, Learn basic Python, or Run 10km this week"
            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
          <div className="text-sm text-slate-400">💡 提示：当您输入的信息没有具体规划时间的时候，我们默认生成一周的计划。</div>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={isLoading || !goal.trim() || !apiKey}
          className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {isLoading ? 'Generating Plan...' : 'Generate Plan'}
        </button>

        <div className="flex-1 overflow-y-auto pr-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            AI Plan Preview
          </label>
          
          {success ? (
            <div className="w-full min-h-[200px] p-8 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Success!</h3>
              <p className="text-sm text-green-600 dark:text-green-400">Plans merged into your calendar!</p>
            </div>
          ) : parsedPlan ? (
            <div className="space-y-5">
              {/* Roadmap Display */}
              {parsedPlan.roadmap && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-800 mb-2">战略路线图</h4>
                  <p className="text-sm text-amber-700">{parsedPlan.roadmap}</p>
                </div>
              )}
              
              {/* Tasks Display */}
              {parsedPlan.tasks.map((dayPlan, dayIndex) => {
                // Calculate the actual date for this day
                const today = new Date();
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + dayIndex);
                
                return (
                  <div key={dayIndex} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${dayPlan.mode === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
                            {dayPlan.mode.charAt(0).toUpperCase() + dayPlan.mode.slice(1)} Day
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-500">Day {dayIndex + 1}</span>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      {dayPlan.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center p-3 m-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          {/* Time Label */}
                          <span className="w-14 font-mono text-xs font-bold text-slate-400">
                            {task.time}
                          </span>
                          
                          {/* Task Text */}
                          <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                            {task.text}
                          </span>
                          
                          {/* Task Type Badge */}
                          <span className={`w-2 h-2 rounded-full ${task.type === 'green' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full min-h-[200px] p-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Your AI-generated plan will appear here...</p>
            </div>
          )}
        </div>

        {parsedPlan && !success && (
          <div className="border-t pt-4 mt-2 bg-white dark:bg-slate-900">
            <button
              onClick={handleApplyToCalendar}
              className="w-full py-4 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Apply to My Life
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPlanner;
