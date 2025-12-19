import React, { useState, useEffect } from 'react';
import CalendarStrip from './components/CalendarStrip';
import DailyTimeline from './components/DailyTimeline';
import ModeToggle from './components/ModeToggle';
import GoalManager from './components/GoalManager'; 
import EnergyCheckin from './components/EnergyCheckin'; 
import OnboardingWizard from './components/OnboardingWizard';
import { Settings, Sparkles, BookOpen, Sun, Calendar as CalendarIcon, Bell, KeyRound, X, Save } from 'lucide-react';
// ✅ 关键修复：引入 Hook
import { useEnergy } from './contexts/useEnergy'; 

const SettingsModal = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  useEffect(() => { const saved = localStorage.getItem('lifeos-api-key'); if (saved) setApiKey(saved); }, []);
  const handleSave = () => { localStorage.setItem('lifeos-api-key', apiKey); alert("配置已保存"); onClose(); };
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-fadeIn">
       <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slideUp">
          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><KeyRound size={24} className="text-purple-600"/> 系统设置</h3><button onClick={onClose}><X size={24} className="text-slate-400"/></button></div>
          <div className="space-y-4"><div><label className="text-xs font-bold text-slate-400 uppercase ml-1">硅基流动 (SiliconFlow) API Key</label><input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-xxxxxxxxxxxxxxxx" className="w-full p-4 bg-slate-50 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-purple-200 transition-all"/><div className="text-[10px] text-slate-400 mt-2 leading-relaxed space-y-1"><p>1. 访问 <a href="https://cloud.siliconflow.cn" target="_blank" className="text-blue-500 underline">cloud.siliconflow.cn</a> 注册。</p><p>2. 点击 [API 密钥] &rarr; [新建密钥]。</p><p>3. 复制 sk- 开头的密钥填入上方。</p></div></div><button onClick={handleSave} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"><Save size={18}/> 保存配置</button></div>
       </div>
    </div>
  );
};

function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showGoalManager, setShowGoalManager] = useState(false);
  const [showEnergyCheckin, setShowEnergyCheckin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // ✅ 关键修复：使用 Context 替代本地 state
  const { energyMode, setEnergyMode } = useEnergy();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getPredictedMode = (dateStr) => {
    // 1. 如果当天已经有手动覆盖的记录，听记录的
    const saved = localStorage.getItem(`lifeos-daily-status-${dateStr}`);
    if (saved) return saved;

    // 2. 否则，查能量周期配置
    const profileStr = localStorage.getItem('lifeos-energy-profile');
    if (profileStr) {
        try {
            const blueDays = JSON.parse(profileStr); 
            // 🛡️ ✅ 核心修复：必须确认它是数组，才执行 includes
            if (Array.isArray(blueDays)) {
                const dayOfWeek = new Date(dateStr).getDay();
                if (blueDays.includes(dayOfWeek)) return 'blue';
            }
        } catch (e) {
            console.error("Energy profile parse error", e);
        }
    }
    return 'green';
  };

  const syncModeWithDate = (date) => {
    if (!date) return;
    const mode = getPredictedMode(date);
    setEnergyMode(mode); 
  };

  const toggleMode = () => {
    const newMode = energyMode === 'green' ? 'blue' : 'green';
    const targetDate = selectedDate || getTodayString();
    
    updateTasksForMode(targetDate, newMode);
    
    setEnergyMode(newMode);
    setRefreshKey(prev => prev + 1);
  };

  // 状态机变形逻辑
  const updateTasksForMode = (dateStr, targetMode) => {
    const goalsStr = localStorage.getItem('lifeos-goals');
    if (!goalsStr) return; 
    let goals = [];
    try { goals = JSON.parse(goalsStr); } catch(e) { return; }

    const storageKey = `lifeos-tasks-day-${dateStr}`;
    let currentTasks = [];
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) currentTasks = JSON.parse(saved);
    } catch (e) {}

    const targetDateObj = new Date(dateStr);
    const dayOfWeek = targetDateObj.getDay(); 

    const activeGoals = goals.filter(g => {
        if (!Array.isArray(g.frequency)) return true;
        return g.frequency.includes(dayOfWeek);
    });

    let processedTasks = currentTasks.map(task => {
        if (task.done) return task; 
        if (task.source === 'manual') return { ...task, type: targetMode }; 
        
        if (task.source === 'habit' && task.goalId) {
            const goalConfig = activeGoals.find(g => g.id === task.goalId);
            if (goalConfig) {
                return {
                    ...task, 
                    text: targetMode === 'blue' ? goalConfig.blue : goalConfig.green,
                    duration: targetMode === 'blue' ? 15 : 60,
                    type: targetMode
                };
            }
            return null; 
        }
        return task;
    }).filter(t => t !== null);

    const existingGoalIds = processedTasks.map(t => t.goalId).filter(id => id);
    activeGoals.forEach((g, idx) => {
        if (!existingGoalIds.includes(g.id)) {
            let defaultTimeStr = g.time;
            if (!defaultTimeStr) { const h = 9 + idx; defaultTimeStr = `${h < 10 ? '0'+h : h}:00`; }
            
            processedTasks.push({
                id: Date.now() + idx + Math.random(), 
                goalId: g.id, 
                text: targetMode === 'blue' ? g.blue : g.green,
                time: defaultTimeStr,
                duration: targetMode === 'blue' ? 15 : 60,
                type: targetMode,
                source: 'habit',
                done: false
            });
        }
    });

    processedTasks.sort((a, b) => {
        const getMin = (t) => { if(!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; };
        return getMin(a.time) - getMin(b.time);
    });

    localStorage.setItem(storageKey, JSON.stringify(processedTasks));
    localStorage.setItem(`lifeos-daily-status-${dateStr}`, targetMode);
  };

  const handleDateSelect = (date) => {
    const mode = getPredictedMode(date);
    updateTasksForMode(date, mode); 
    setEnergyMode(mode); 
    setSelectedDate(date);
    setShowGoalManager(false);
  };

  const handleEnergyPlanGenerated = (ignoreTasks, mode) => {
    const today = getTodayString();
    const targetDate = selectedDate || today; 
    updateTasksForMode(targetDate, mode); 
    setEnergyMode(mode); 
    setRefreshKey(prev => prev + 1);
    if (!selectedDate) setSelectedDate(today); 
    setShowEnergyCheckin(false);
  };

  const handleExportCalendar = () => {
    if (!window.confirm("导出未来 7 天计划到手机日历？")) return;
    const CRLF = '\r\n';
    let icsContent = `BEGIN:VCALENDAR${CRLF}VERSION:2.0${CRLF}PRODID:-//LifeOS//V15.0//EN${CRLF}CALSCALE:GREGORIAN${CRLF}METHOD:PUBLISH${CRLF}`;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const mode = getPredictedMode(dateStr);
        updateTasksForMode(dateStr, mode);

        const savedTasks = localStorage.getItem(`lifeos-tasks-day-${dateStr}`);
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            tasks.forEach(task => {
                if (!task.time) return;
                const [th, tm] = task.time.split(':').map(Number);
                const startDate = new Date(d);
                startDate.setHours(th, tm, 0);
                const endDate = new Date(startDate);
                endDate.setMinutes(startDate.getMinutes() + (task.duration || 60));
                const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                icsContent += `BEGIN:VEVENT${CRLF}SUMMARY:LifeOS: ${task.text}${CRLF}DTSTART:${formatICSDate(startDate)}${CRLF}DTEND:${formatICSDate(endDate)}${CRLF}DESCRIPTION:来自 LifeOS 的能量计划${CRLF}STATUS:CONFIRMED${CRLF}END:VEVENT${CRLF}`;
            });
        }
    }
    icsContent += `END:VCALENDAR${CRLF}`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'lifeos_plan.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.confirm("导出完成！App 内的未来计划也已刷新。\n是否刷新页面查看？")) { window.location.reload(); }
  };
  
  const handleRequestNotification = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") new Notification("LifeOS Ready");
    });
  };

  useEffect(() => {
    const today = getTodayString();
    const savedGoals = localStorage.getItem('lifeos-goals');
    if (!savedGoals || savedGoals === '[]') { setShowOnboarding(true); return; }
    
    const mode = getPredictedMode(today);
    updateTasksForMode(today, mode);
    setEnergyMode(mode); 
    
    const lastCheckin = localStorage.getItem('lifeos-last-checkin');
    if (lastCheckin !== today) { setShowEnergyCheckin(true); }
  }, []);

  const handleBack = () => { 
      const today = getTodayString();
      const target = selectedDate || today;
      const mode = getPredictedMode(target);
      updateTasksForMode(target, mode); 
      setRefreshKey(prev => prev + 1); 
      setSelectedDate(null); 
      setShowGoalManager(false); 
      setShowEnergyCheckin(false); 
      setEnergyMode(getPredictedMode(today)); 
  };
  
  const handleOnboardingComplete = () => { setShowOnboarding(false); const today = getTodayString(); setSelectedDate(today); setEnergyMode(getPredictedMode(today)); };

  if (showOnboarding) return <OnboardingWizard onComplete={handleOnboardingComplete} />;

  let content;
  if (showGoalManager) {
    content = <GoalManager onBack={handleBack} />;
  } else if (selectedDate) {
    content = <DailyTimeline key={refreshKey} date={selectedDate} onBack={handleBack} />;
  } else {
    content = (
      <div className="flex flex-col items-center justify-center h-full space-y-10 animate-fadeIn p-6">
        <div className="w-full">
            <CalendarStrip onSelectDate={handleDateSelect} getPredictedMode={getPredictedMode} />
        </div>
        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
           <button onClick={() => setShowGoalManager(true)} className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-700 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-lg group">
             <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110 transition-transform"><BookOpen size={24} /></div><span>Habit Library</span>
           </button>
        </div>
        <p className="text-slate-400 text-sm font-medium">Select a date or check your energy.</p>
      </div>
    );
  }

  const themeClass = energyMode === 'blue' ? 'bg-blue-50' : 'bg-green-50';

  return (
    <div className={`h-screen w-full flex justify-center overflow-hidden transition-colors duration-500 ${themeClass}`}>
      <div className={`w-full max-w-md md:max-w-3xl h-full shadow-2xl relative flex flex-col transition-colors duration-500 ${themeClass}`}>
        {!selectedDate && !showGoalManager && (
          <div className="pt-10 pb-4 px-8 flex items-center justify-between shrink-0">
            <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">LIFE REBOOT</h1><p className="text-xs text-slate-400 font-bold tracking-widest uppercase">System V15.1</p></div>
            <div className="flex items-center gap-2">
              <div onClick={toggleMode} className="cursor-pointer transition-transform active:scale-90">
                 <ModeToggle mode={energyMode} />
              </div>
              <button onClick={handleRequestNotification} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl shadow-sm hover:bg-rose-100 transition-colors"><Bell size={20} /></button>
              <button onClick={handleExportCalendar} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-100 transition-colors"><CalendarIcon size={20} /></button>
              <button onClick={() => setShowSettings(true)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shadow-sm hover:bg-slate-200 transition-colors"><Settings size={20} /></button>
              <button onClick={() => setShowEnergyCheckin(true)} className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shadow-sm hover:bg-amber-200 transition-colors"><Sun size={20} /></button>
            </div>
          </div>
        )}
        {selectedDate && (<div className="absolute top-4 right-4 z-50 flex gap-2 animate-fadeIn"><button onClick={() => setShowEnergyCheckin(true)} className="p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-amber-500 hover:scale-110 transition-transform"><Sun size={20} /></button></div>)}
        <div className="flex-1 overflow-hidden relative">{content}</div>
        {showEnergyCheckin && <EnergyCheckin onGenerate={handleEnergyPlanGenerated} onClose={() => setShowEnergyCheckin(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
}

export default App;