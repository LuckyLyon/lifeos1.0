import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Zap, BatteryCharging, Clock, Save, X, Bot, ChevronDown, ChevronUp, History, Calendar, TrendingUp, Repeat, KeyRound, CheckCircle2, RotateCw, Flag, ArrowRight, MessageSquare } from 'lucide-react';
import { generateHabitPlan } from '../utils/ai';

const GoalManager = ({ onBack }) => {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({}); 

  // UI 状态
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState('manual'); 
  const [expandedId, setExpandedId] = useState(null);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  
  // 🟢 新增：下一阶段生成弹窗状态
  const [nextStageModal, setNextStageModal] = useState(null); 
  const [rating, setRating] = useState('Just Right'); 

  // 表单状态
  const [title, setTitle] = useState('');
  const [green, setGreen] = useState('');
  const [blue, setBlue] = useState('');
  const [time, setTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState([0,1,2,3,4,5,6]); 
  
  // 🟢 计划模式：默认循环
  const [planMode, setPlanMode] = useState('loop'); 
  
  // AI 状态
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    const loadGoals = () => {
      try {
        const saved = localStorage.getItem('lifeos-goals');
        if (saved) {
            let parsed = JSON.parse(saved);
            parsed = parsed.map(g => ({
                ...g,
                frequency: Array.isArray(g.frequency) ? g.frequency : [0,1,2,3,4,5,6],
                planMode: g.planMode || 'loop',
                stageCount: g.stageCount || 1,
                lastUpdate: g.lastUpdate || g.id // 用于计算当前阶段开始了几天
            }));
            setGoals(parsed);
            calculateAllStats(parsed); 
        }
      } catch (e) { console.error("Load goals failed", e); }
    };
    loadGoals();
  }, []);

  const calculateAllStats = (currentGoals) => {
    const newStats = {};
    const today = new Date();
    currentGoals.forEach(goal => {
      let streak = 0;
      let history = []; 
      let foundBreak = false;
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayData = localStorage.getItem(`lifeos-tasks-day-${dateStr}`);
        let isDone = false;
        let review = ""; 
        let energyMode = "green"; 
        if (dayData) {
          const tasks = JSON.parse(dayData);
          const task = tasks.find(t => t.goalId === goal.id);
          energyMode = localStorage.getItem(`lifeos-daily-status-${dateStr}`) || 'green';
          if (task && task.done) { isDone = true; review = task.review || ""; }
        }
        if (i < 14) history.unshift({ date: dateStr, done: isDone, review, energyMode }); 
        if (isDone) { if (!foundBreak) streak++; } else if (i > 0) { foundBreak = true; }
      }
      newStats[goal.id] = { streak, history };
    });
    setStats(newStats);
  };

  const saveToStorage = (updatedGoals) => {
    setGoals(updatedGoals);
    localStorage.setItem('lifeos-goals', JSON.stringify(updatedGoals));
    calculateAllStats(updatedGoals); 
  };

  // 🟢 核心：生成下一阶段 (医生复诊逻辑)
  const handleGenerateNextStage = async () => {
    const goal = goals.find(g => g.id === nextStageModal);
    if (!goal) return;
    
    const apiKey = localStorage.getItem('lifeos-api-key');
    if (!apiKey) { alert("请先设置 API Key"); return; }

    setIsGenerating(true);
    try {
        // 1. 收集病历：只取最近有复盘的记录
        const goalStats = stats[goal.id];
        const recentReviews = goalStats.history
            .filter(h => h.done && h.review) 
            .map(h => `[${h.date}] ${h.review}`);

        const context = {
            currentStage: `第 ${goal.stageCount || 1} 阶段`,
            rating: rating, 
            reviews: recentReviews
        };

        // 2. 调用 AI
        const data = await generateHabitPlan(apiKey, goal.title, context);

        // 3. 更新 Goal
        const updatedGoals = goals.map(g => {
            if (g.id === goal.id) {
                return {
                    ...g,
                    stageCount: (g.stageCount || 1) + 1,
                    lastUpdate: Date.now(), // 🟢 重置阶段开始时间
                    daily_routine: data.daily_routine || [],
                    milestones: [...(g.milestones || []), ...(data.milestones || [])],
                    green: data.green || g.green, // 更新默认文案
                    blue: data.blue || g.blue
                };
            }
            return g;
        });

        saveToStorage(updatedGoals);
        setNextStageModal(null); 
        alert(`🎉 第 ${goal.stageCount + 1} 阶段计划已生成！`);

    } catch (e) {
        alert("生成失败：" + e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  // 🟢 初始生成 (带模式选择)
  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    const apiKey = localStorage.getItem('lifeos-api-key');
    if (!apiKey) { setAiError("未检测到 API Key"); setShowSettingsHint(true); return; }
    
    setIsGenerating(true); setAiError(null);
    try {
      // 传入选定的 planMode
      const data = await generateHabitPlan(apiKey, aiPrompt, { mode: planMode }); 
      
      setTitle(data.title); setGreen(data.green); setBlue(data.blue);
      setSelectedDays([0,1,2,3,4,5,6]);
      window.tempAiData = { 
          isAi: true, 
          milestones: data.milestones || [], 
          daily_routine: data.daily_routine || [] 
      };
      setAddMode('manual');
    } catch (err) { setAiError(err.message || "生成失败"); } finally { setIsGenerating(false); }
  };

  const handleSave = () => {
    if (!title || !green || !blue) return;
    if (selectedDays.length === 0) { alert("请至少选择一天频率！"); return; }
    const newGoal = {
      id: Date.now(), title, green, blue, time, frequency: selectedDays, 
      milestones: window.tempAiData?.milestones || [],
      daily_routine: window.tempAiData?.daily_routine || [],
      planMode: planMode, // 保存模式
      stageCount: 1,
      lastUpdate: Date.now()
    };
    saveToStorage([...goals, newGoal]); setIsAdding(false); resetForm();
  };

  const resetForm = () => { setTitle(''); setGreen(''); setBlue(''); setTime('09:00'); setSelectedDays([0,1,2,3,4,5,6]); setPlanMode('loop'); setAiPrompt(''); setAddMode('manual'); window.tempAiData = null; setAiError(null); };
  const handleDelete = (e, id) => { e.stopPropagation(); if (confirm("确定删除?")) saveToStorage(goals.filter(g => g.id !== id)); };
  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const toggleDay = (dayIndex) => { if (selectedDays.includes(dayIndex)) { if (selectedDays.length > 1) setSelectedDays(selectedDays.filter(d => d !== dayIndex)); } else { setSelectedDays([...selectedDays, dayIndex].sort()); } };
  const formatFreq = (days) => { if (!Array.isArray(days)) return '每天'; if (days.length === 7) return '每天'; const map = ['日','一','二','三','四','五','六']; return '周' + days.map(d => map[d]).join('、'); };
  const getLast14Days = () => { const dates = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); } return dates; };
  const handleOpenSettings = () => { alert("请点击主页（返回上一页）右上角的齿轮图标 ⚙️ 进行设置"); };
  const weekDays = [{id: 1, label: '一'}, {id: 2, label: '二'}, {id: 3, label: '三'}, {id: 4, label: '四'}, {id: 5, label: '五'}, {id: 6, label: '六'}, {id: 0, label: '日'}];

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans select-none relative">
      {/* 🟢 下一阶段生成弹窗 */}
      {nextStageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-6 animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-slideUp">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">💪</div>
                    <h3 className="text-xl font-black text-slate-800">阶段完成！</h3>
                    <p className="text-sm text-slate-400 mt-1">AI 将读取你的复盘记录，优化下一周计划。</p>
                </div>
                
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-3 block text-center">本周难度如何？</label>
                    <div className="flex gap-2">
                        {['Too Easy', 'Just Right', 'Too Hard'].map(r => (
                            <button key={r} onClick={() => setRating(r)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${rating === r ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>
                                {r === 'Too Easy' ? '太简单' : r === 'Just Right' ? '刚刚好' : '太难'}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handleGenerateNextStage} disabled={isGenerating} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-500 shadow-lg shadow-purple-200">
                    {isGenerating ? '正在分析...' : <><Bot size={18}/> 生成下一阶段</>}
                </button>
                <button onClick={() => setNextStageModal(null)} className="w-full mt-3 py-2 text-slate-400 text-xs font-bold">暂不生成</button>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between p-6 bg-white shadow-sm shrink-0 z-10">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-green-600 font-bold transition-colors"><ArrowLeft size={20} className="mr-2" /> 保存并返回</button>
        <h2 className="text-xl font-black text-slate-800">目标指挥部</h2>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
        {goals.map(goal => {
          const isExpanded = expandedId === goal.id;
          const goalStats = stats[goal.id] || { streak: 0, history: [] };
          const last14Days = getLast14Days();
          
          return (
            <div key={goal.id} onClick={() => toggleExpand(goal.id)} className={`bg-white rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md ${isExpanded ? 'ring-2 ring-slate-800' : ''}`}>
              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        {goal.title}
                        {goal.milestones?.length > 0 && <Bot size={16} className="text-purple-500" />}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={12}/> {goal.time}</span>
                          <span className="flex items-center gap-1"><Repeat size={12}/> {formatFreq(goal.frequency)}</span>
                          <span className="text-amber-500 flex items-center gap-1"><Zap size={12}/> {goalStats.streak} 连胜</span>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              {goal.planMode === 'loop' ? <RotateCw size={10}/> : <Flag size={10}/>}
                              {goal.planMode === 'loop' ? '循环' : '进阶'}
                          </span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDelete(e, goal.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                    <div className="text-slate-300">{isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-green-50/80 border border-green-100 flex items-center gap-3"><div className="text-[10px] font-bold text-green-600 uppercase shrink-0">Green</div><div className="text-sm font-bold text-slate-700 truncate">{goal.green}</div></div>
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center gap-3"><div className="text-[10px] font-bold text-blue-500 uppercase shrink-0">Blue</div><div className="text-sm font-bold text-slate-700 truncate">{goal.blue}</div></div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100 p-6 animate-slideDown">
                   {/* 最近状态 */}
                   <div className="mb-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={14}/> 最近状态 (14天)</h4>
                      <div className="flex gap-1.5 justify-between">
                          {last14Days.map(date => {
                             const record = goalStats.history.find(h => h.date === date);
                             let bgClass = "bg-slate-200"; 
                             if (record && record.done) bgClass = record.energy_mode === 'blue' ? 'bg-blue-400' : 'bg-green-500';
                             const isToday = date === new Date().toISOString().split('T')[0];
                             return (<div key={date} className="flex flex-col items-center gap-1 w-full"><div className={`w-full aspect-square rounded-md ${bgClass} transition-all ${isToday ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`} title={`${date}: ${record?.done ? 'Done' : 'Missed'}`}></div></div>)
                          })}
                      </div>
                   </div>

                   {/* AI 7天计划展示区 */}
                   {goal.daily_routine?.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-200/50">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
                                <Bot size={12}/> 
                                {goal.planMode === 'loop' ? '本周循环计划' : `第 ${goal.stageCount || 1} 阶段计划`}
                            </div>
                            
                            {/* 🟢 进阶模式下，显示下一阶段入口 */}
                            {goal.planMode === 'advance' && (
                                <button onClick={(e) => { e.stopPropagation(); setNextStageModal(goal.id); }} className="text-[10px] bg-purple-100 text-purple-600 px-2 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-purple-200">
                                    进入下一阶段 <ArrowRight size={10}/>
                                </button>
                            )}
                            
                            {/* 🟢 循环模式下，显示提示 */}
                            {goal.planMode === 'loop' && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">🔄 自动循环中</span>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            {goal.daily_routine.map((task, i) => (
                                <div key={i} className="flex flex-col gap-1 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px]">{i+1}</div>
                                        <span className="font-bold text-slate-400">Day {i+1}</span>
                                    </div>
                                    <div className="pl-6 flex flex-col gap-1">
                                        <div className="text-green-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{typeof task === 'string' ? task : task.green}</div>
                                        {typeof task !== 'string' && <div className="text-blue-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{task.blue}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                   )}
                   
                   <div className="mt-6 pt-6 border-t border-slate-200/50">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={14}/> 详细复盘</h4>
                      {goalStats.history.filter(h => h.done).length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-sm">暂无打卡记录</div>
                      ) : (
                        <div className="space-y-3">
                          {[...goalStats.history].filter(h => h.done).map((record, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 animate-fadeIn">
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> {record.date}</div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${record.energy_mode === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{record.energy_mode === 'blue' ? 'Recovery' : 'Growth'}</span>
                                  </div>
                                  <CheckCircle2 size={14} className="text-green-500"/>
                               </div>
                               {record.review ? (<div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg italic border-l-2 border-slate-300">"{record.review}"</div>) : (<div className="text-[10px] text-slate-300 pl-1">完成任务</div>)}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
               </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-800 animate-slideUp">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setAddMode('manual')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${addMode === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>手动录入</button>
                    <button onClick={() => setAddMode('ai')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${addMode === 'ai' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-400'}`}><Bot size={14}/> AI 规划</button>
                 </div>
                 <button onClick={() => { setIsAdding(false); resetForm(); }}><X size={24} className="text-slate-400 hover:text-slate-800"/></button>
             </div>
             {addMode === 'ai' ? (
               <div className="space-y-6 py-4">
                  <div className="text-center space-y-2"><div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2"><Bot size={28}/></div><h3 className="text-lg font-bold text-slate-800">AI 智能规划 (V13.0)</h3><p className="text-xs text-slate-400">接入 SiliconFlow/DeepSeek，为你量身定制蓝绿双态目标。</p></div>
                  
                  {/* 🟢 1. 在 AI 输入框上方，显式让用户选择模式 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setPlanMode('loop')} className={`p-3 rounded-xl border cursor-pointer transition-all ${planMode === 'loop' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        <div className="flex items-center gap-2 mb-1"><RotateCw size={14}/> <span className="font-bold text-xs">无限循环</span></div>
                        <p className="text-[10px] opacity-80 leading-tight">适合习惯养成（背单词/冥想），7天一周期重复。</p>
                    </div>
                    <div onClick={() => setPlanMode('advance')} className={`p-3 rounded-xl border cursor-pointer transition-all ${planMode === 'advance' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        <div className="flex items-center gap-2 mb-1"><Flag size={14}/> <span className="font-bold text-xs">进阶挑战</span></div>
                        <p className="text-[10px] opacity-80 leading-tight">适合项目突破（减肥/考证），难度递增，需生成新阶段。</p>
                    </div>
                  </div>

                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="例如: 3个月内减重10斤 / 学习Python爬虫..." className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-purple-200 outline-none transition-all" autoFocus />
                   {aiError && (<div className="p-3 bg-red-50 text-red-500 text-xs rounded-xl flex items-center gap-2 animate-pulse"><KeyRound size={14}/> {aiError}</div>)}
                  {showSettingsHint && (<div className="text-center text-xs text-blue-500 underline cursor-pointer" onClick={handleOpenSettings}>不知道去哪里填 Key? 点我提示</div>)}
                  
                  <button onClick={handleAIGenerate} disabled={isGenerating || !aiPrompt} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGenerating ? <span className="animate-pulse">正在连接大脑...</span> : <><Zap size={18}/> 生成方案</>}</button>
               </div>
             ) : (
               <div className="space-y-4">
                  {/* ... 手动添加模式下也保留模式选择 ... */}
                  <div className="flex gap-3">
                      <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">目标名称</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="如: 练出腹肌" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all"/></div>
                      <div className="w-1/3"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">每日时间</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all"/></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2 block">计划模式</label>
                    <div className="flex gap-2">
                        <button onClick={() => setPlanMode('loop')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${planMode === 'loop' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>
                            <RotateCw size={16}/> <span className="text-xs font-bold">无限循环</span>
                        </button>
                        <button onClick={() => setPlanMode('advance')} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${planMode === 'advance' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                            <Flag size={16}/> <span className="text-xs font-bold">进阶挑战</span>
                        </button>
                    </div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-2 block">重复频率</label><div className="flex justify-between gap-2 p-1">{weekDays.map(day => {const isSelected = selectedDays.includes(day.id); return (<button key={day.id} onClick={() => toggleDay(day.id)} className={`w-10 h-10 rounded-full text-xs font-bold transition-all border flex items-center justify-center ${isSelected ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform -translate-y-1' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>{day.label}{isSelected && <div className="absolute -bottom-1 w-1 h-1 bg-green-400 rounded-full"></div>}</button>)})}</div><p className="text-[10px] text-center text-slate-300 mt-2">{formatFreq(selectedDays)}</p></div>
                  <div className="space-y-3"><div className="relative"><div className="absolute top-3 left-3 text-green-600"><Zap size={18}/></div><input value={green} onChange={e => setGreen(e.target.value)} placeholder="高能量: 完美状态下做什么?" className="w-full pl-10 p-3 bg-green-50 border border-green-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-200 transition-all"/></div><div className="relative"><div className="absolute top-3 left-3 text-blue-500"><BatteryCharging size={18}/></div><input value={blue} onChange={e => setBlue(e.target.value)} placeholder="低能量: 累的时候做什么?" className="w-full pl-10 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 transition-all"/></div></div>
                  <button onClick={handleSave} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg"><Save size={18} /> 确认并保存</button>
               </div>
             )}
          </div>
        )}
      </div>

      {!isAdding && <div className="p-6 pt-0 bg-transparent flex justify-center"><button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform hover:shadow-purple-500/20"><Plus size={20} /> 新建目标</button></div>}
    </div>
  );
};

export default GoalManager;