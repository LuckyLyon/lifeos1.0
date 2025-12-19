import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trash2, Plus, Star, MessageSquare, Save, X, CheckCircle2 } from 'lucide-react';

const HOUR_HEIGHT = 120; 

const DailyTimeline = ({ date, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [now, setNow] = useState(new Date());
  const [dragState, setDragState] = useState(null); 
  const scrollRef = useRef(null);
  const timelineRef = useRef(null);
  const storageKey = `lifeos-tasks-day-${date}`;

  // --- 复盘弹窗状态 ---
  const [reviewTask, setReviewTask] = useState(null); // 当前正在复盘的任务
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewNote, setReviewNote] = useState('');

  // 加载数据
  useEffect(() => {
    const loadTasks = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved).map(t => ({...t, duration: Number(t.duration) || 60 }));
          setTasks(parsed);
        } else { setTasks([]); }
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };
    loadTasks();
    const interval = setInterval(loadTasks, 2000); // 稍微放慢同步频率
    return () => clearInterval(interval);
  }, [date, storageKey]);

  // 保存数据
  useEffect(() => { 
    if (tasks.length > 0) localStorage.setItem(storageKey, JSON.stringify(tasks)); 
  }, [tasks, storageKey]);

  // 时间线滚动与当前时间更新
  useEffect(() => { 
    const timer = setInterval(() => setNow(new Date()), 60000); 
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
    return () => clearInterval(timer); 
  }, []);

  // --- 核心逻辑：打卡与复盘 ---
  
  // 1. 点击 Checkbox 触发
  const handleToggleClick = (task) => {
    if (task.done) {
      // 如果已经是完成状态，则取消完成 (撤销)
      const updated = tasks.map(t => t.id === task.id ? { ...t, done: false, review: null } : t);
      setTasks(updated);
    } else {
      // 如果是未完成，弹出复盘窗口
      setReviewTask(task);
      setReviewRating(5); // 默认五星
      setReviewNote('');
    }
  };

  // 2. 提交复盘
  const submitReview = () => {
    if (!reviewTask) return;

    // A. 更新今日任务状态
    const reviewData = {
      rating: reviewRating,
      note: reviewNote,
      timestamp: new Date().toISOString()
    };

    const updatedTasks = tasks.map(t => t.id === reviewTask.id ? { ...t, done: true, review: reviewData } : t);
    setTasks(updatedTasks);
    // 立即保存任务，防止同步延迟
    localStorage.setItem(storageKey, JSON.stringify(updatedTasks));

    // B. 【关键】同步写入 Goal Library (数据闭环)
    try {
      const goalsStr = localStorage.getItem('lifeos-goals');
      if (goalsStr) {
        let goals = JSON.parse(goalsStr);
        // 尝试找到匹配的目标 (通过任务文本匹配目标里的 green/blue 文本)
        // 这是一个简单的匹配逻辑，未来可以用 ID 关联
        goals = goals.map(g => {
          if (g.green === reviewTask.text || g.blue === reviewTask.text || g.title === reviewTask.text) {
             // 找到了！写入历史
             const newHistoryItem = {
               date: date,
               status: 'done',
               review: reviewNote,
               rating: reviewRating,
               energy_mode: reviewTask.type // 'blue' or 'green'
             };
             // 确保 history 数组存在
             const history = g.history || [];
             // 更新 streak (简单的连胜逻辑：如果昨天也打了这几天就是 streak+1，这里简化为+1)
             const newStreak = (g.streak || 0) + 1;
             
             return { ...g, history: [...history, newHistoryItem], streak: newStreak };
          }
          return g;
        });
        localStorage.setItem('lifeos-goals', JSON.stringify(goals));
        console.log("复盘数据已同步至目标库!");
      }
    } catch (e) { console.error("同步目标库失败", e); }

    // 关闭弹窗
    setReviewTask(null);
  };

  // --- 常规 CRUD ---
  const addTask = (time) => { 
    setTasks(prev => [...prev, { 
      id: Date.now(), time, text: "新任务", done: false, duration: 60, type: 'green', source: 'manual' 
    }]); 
  };
  const updateTask = (id, field, value) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t)); };
  const deleteTask = (id) => { const newTasks = tasks.filter(t => t.id !== id); setTasks(newTasks); localStorage.setItem(storageKey, JSON.stringify(newTasks)); };
  
  // 布局计算
  const getMinutes = (timeStr) => { if (!timeStr) return 0; const [h, m] = timeStr.split(':').map(Number); return (h * 60) + (m || 0); };
  const getLayoutStyles = (task, allTasks) => {
    const taskStart = getMinutes(task.time);
    const duration = task.duration || 60;
    const taskEnd = taskStart + duration;
    const overlapping = allTasks.filter(t => {
      const tStart = getMinutes(t.time);
      const tDuration = t.duration || 60;
      const tEnd = tStart + tDuration;
      return (tStart < taskEnd && tEnd > taskStart);
    });
    overlapping.sort((a, b) => getMinutes(a.time) - getMinutes(b.time) || a.id - b.id);
    const index = overlapping.findIndex(t => t.id === task.id);
    const count = overlapping.length;
    const pxPerMin = HOUR_HEIGHT / 60;
    return {
      top: `${taskStart * pxPerMin}px`,
      height: `${duration * pxPerMin}px`,
      left: `calc(80px + ((100% - 90px) * ${index / count}))`,
      width: `calc(((100% - 90px) / ${count}) - 4px)`
    };
  };

  // 拖拽逻辑
  const handleMouseDown = (e, task) => { e.stopPropagation(); e.preventDefault(); setDragState({ taskId: task.id, startY: e.clientY, originalDuration: task.duration || 60 }); };
  const handleMouseMove = useCallback((e) => {
    if (!dragState) return;
    const deltaY = e.clientY - dragState.startY; 
    const pxPerMin = HOUR_HEIGHT / 60;
    const deltaMinutes = Math.round((deltaY / pxPerMin) / 15) * 15;
    let newDuration = dragState.originalDuration + deltaMinutes;
    if (newDuration < 15) newDuration = 15;
    updateTask(dragState.taskId, 'duration', newDuration);
  }, [dragState]);
  const handleMouseUp = useCallback(() => { if (dragState) setDragState(null); }, [dragState]);
  useEffect(() => { if (dragState) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } else { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [dragState, handleMouseMove, handleMouseUp]);

  const handleSlotClick = (e, hour) => {
    if (dragState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top; 
    const pxPerMin = HOUR_HEIGHT / 60;
    const minutes = Math.round((y / pxPerMin) / 15) * 15;
    let finalHour = hour; let finalMinutes = minutes;
    if (minutes === 60) { finalHour += 1; finalMinutes = 0; }
    addTask(`${finalHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`);
  };

  const getCurrentTimePosition = () => ((now.getHours() * 60) + now.getMinutes()) * (HOUR_HEIGHT / 60);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-slate-50 transition-colors duration-300 select-none font-sans">
      {/* 顶部 */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm z-20 shrink-0">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-green-500 font-bold"><ArrowLeft size={20} className="mr-1" /> 返回</button>
        <h2 className="text-lg font-bold text-slate-800">今日执行 ({date})</h2>
        <div className="w-16"></div> 
      </div>

      {/* 时间轴 */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={timelineRef}>
        <div className="relative w-full" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* 背景网格 */}
          {hours.map(hour => (
            <div key={hour} className="absolute w-full border-b border-slate-100/80 flex group" style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }} onClick={(e) => handleSlotClick(e, hour)}>
              <span ref={hour === new Date().getHours() ? scrollRef : null} className="w-[60px] text-xs text-slate-400 text-right pr-3 pt-1 font-mono sticky left-0">{hour.toString().padStart(2, '0')}:00</span>
              <div className="absolute top-1/2 left-[70px] right-0 border-t border-slate-50/50 w-full pointer-events-none"></div>
              <div className="flex-1 hover:bg-slate-50 transition-colors cursor-pointer"></div>
            </div>
          ))}
          {/* 红线 */}
          <div className="absolute left-[75px] right-0 border-t-2 border-red-500 z-50 pointer-events-none flex items-center" style={{ top: `${getCurrentTimePosition()}px` }}><div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shadow-sm"></div></div>
          
          {/* 任务块 */}
          {tasks.map(task => {
            const style = getLayoutStyles(task, tasks);
            const isDraggingThis = dragState?.taskId === task.id;
            let bgClass = task.type === 'green' ? 'bg-green-50 border-green-500 text-green-900' : task.type === 'blue' ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-white border-slate-200 text-slate-800';
            const isShort = (task.duration || 60) <= 20;

            return (
              <div key={task.id} 
                className={`absolute rounded-lg shadow-sm border-l-4 overflow-hidden group flex 
                  ${task.done ? 'opacity-60 grayscale' : 'opacity-100'} ${bgClass} 
                  ${isDraggingThis ? 'z-50 shadow-xl ring-2 ring-blue-300 scale-[1.02]' : 'z-10 hover:shadow-md'}
                  ${isShort ? 'flex-row items-center px-1' : 'flex-col p-1.5'}
                `} 
                style={{ ...style, transition: isDraggingThis ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <div className={`flex items-center gap-1.5 shrink-0 ${isShort ? 'mr-2' : 'mb-0.5 justify-between w-full'}`}>
                   <div className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleToggleClick(task); }}>
                      {task.done ? <CheckCircle2 size={16} className="text-green-600 fill-green-100"/> : <div className="w-3.5 h-3.5 border-2 border-current rounded-sm"></div>}
                      <span className="text-[10px] font-bold font-mono opacity-80">{task.time}</span>
                   </div>
                   {!isShort && (
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500"><Trash2 size={12} /></button>
                   )}
                </div>
                <input 
                  value={task.text} 
                  onChange={(e) => updateTask(task.id, 'text', e.target.value)} 
                  className={`bg-transparent text-xs font-medium outline-none min-w-0 flex-1 
                    ${task.done ? 'line-through opacity-50' : ''} placeholder:text-current/40 ${isShort ? 'truncate h-full py-0' : 'w-full'}
                  `} 
                />
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-transparent hover:bg-black/5 cursor-ns-resize z-20" onMouseDown={(e) => handleMouseDown(e, task)}></div>
              </div>
            );
          })}
        </div>
      </div>
      
      <button onClick={() => addTask("09:00")} className="fixed bottom-8 right-8 w-14 h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"><Plus size={28} /></button>

      {/* --- 📝 复盘弹窗 Modal --- */}
      {reviewTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative animate-slideUp">
             <button onClick={() => setReviewTask(null)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><X size={20}/></button>
             
             <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm"><CheckCircle2 size={24}/></div>
                <h3 className="text-lg font-black text-slate-800">完成任务!</h3>
                <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1">"{reviewTask.text}"</p>
             </div>

             <div className="space-y-4">
                {/* 评分 */}
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase block mb-2 text-center">执行感受 (1-5)</label>
                   <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setReviewRating(star)} className={`transition-all hover:scale-110 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}>
                           <Star size={28} />
                        </button>
                      ))}
                   </div>
                </div>

                {/* 心得 */}
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase block mb-2 ml-1">复盘心得 (AI将根据此优化)</label>
                   <textarea 
                     value={reviewNote}
                     onChange={e => setReviewNote(e.target.value)}
                     placeholder="例如: 刚开始有点不想动，但做完很爽..." 
                     className="w-full p-3 bg-slate-50 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 min-h-[80px]"
                   />
                </div>

                <button onClick={submitReview} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-lg">
                   <Save size={18}/> 确认打卡
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DailyTimeline;