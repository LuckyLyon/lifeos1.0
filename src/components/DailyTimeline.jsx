import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Clock, Hourglass, X, Check, ChevronDown, GripHorizontal, Square, CheckSquare } from 'lucide-react';

const PIXELS_PER_MINUTE = 2; // 1分钟=2px

const DailyTimeline = ({ date, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const dragItemRef = useRef(null);
  const dragStartY = useRef(0);
  const originalTaskTop = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    const loadTasks = () => {
      const storageKey = `lifeos-tasks-day-${date}`;
      try {
        const saved = localStorage.getItem(storageKey);
        setTasks(saved ? JSON.parse(saved) : []);
      } catch (e) { console.error(e); }
    };
    loadTasks();
  }, [date]);

  const saveTasksToStorage = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem(`lifeos-tasks-day-${date}`, JSON.stringify(newTasks));
  };

  const handleAddTask = () => {
    const newTask = {
      id: Date.now(),
      text: "新任务",
      time: "09:00",
      duration: 60,
      type: 'green',
      source: 'manual',
      done: false // ✅ 默认未完成
    };
    const newTasks = [...tasks, newTask];
    saveTasksToStorage(newTasks);
    setEditingTask(newTask);
  };

  const handleUpdateTask = (taskId, updates) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    saveTasksToStorage(newTasks);
    // 如果正在编辑这个任务，也要同步更新编辑框的状态
    setEditingTask(prev => prev && prev.id === taskId ? ({ ...prev, ...updates }) : prev);
  };

  const handleDeleteTask = (taskId) => {
    if(!window.confirm("确定删除这个任务吗？")) return;
    const newTasks = tasks.filter(t => t.id !== taskId);
    saveTasksToStorage(newTasks);
    setEditingTask(null);
  };

  // 🟢 新增：快速打卡切换 (Quick Check-in)
  const toggleTaskDone = (e, task) => {
    e.stopPropagation(); // 阻止冒泡！防止点打卡时弹出编辑框
    handleUpdateTask(task.id, { done: !task.done });
  };

  // --- 🖱️ 电脑端拖拽逻辑 ---
  const handleMouseDown = (e, task) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragItemRef.current = task;
    dragStartY.current = e.clientY;
    
    const [h, m] = task.time.split(':').map(Number);
    originalTaskTop.current = ((h - 5) * 60 + m) * PIXELS_PER_MINUTE;
    
    hasMoved.current = false;
    setIsDragging(true);

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleWindowMouseMove = (e) => {
    if (!dragItemRef.current) return;
    const deltaY = e.clientY - dragStartY.current;
    if (Math.abs(deltaY) > 5) hasMoved.current = true;

    let newTop = originalTaskTop.current + deltaY;
    const snapSize = 15 * PIXELS_PER_MINUTE; 
    newTop = Math.round(newTop / snapSize) * snapSize;

    const maxTop = 19 * 60 * PIXELS_PER_MINUTE - (dragItemRef.current.duration * PIXELS_PER_MINUTE);
    newTop = Math.max(0, Math.min(newTop, maxTop));

    const totalMinutesFrom5AM = newTop / PIXELS_PER_MINUTE;
    const hour = Math.floor(totalMinutesFrom5AM / 60) + 5;
    const minute = totalMinutesFrom5AM % 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    setTasks(prev => prev.map(t => 
      t.id === dragItemRef.current.id ? { ...t, time: timeStr } : t
    ));
  };

  const handleWindowMouseUp = () => {
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
    
    if (hasMoved.current) {
        setTasks(prev => {
           localStorage.setItem(`lifeos-tasks-day-${date}`, JSON.stringify(prev));
           return prev;
        });
    }
    setIsDragging(false);
    dragItemRef.current = null;
  };

  const handleTaskClick = (task) => {
    if (!hasMoved.current) {
      setEditingTask(task);
    }
    hasMoved.current = false;
  };

  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex items-center justify-between p-4 bg-white shadow-sm shrink-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">{date}</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto relative pb-40 select-none" style={{ minHeight: '1200px' }}>
        <div className="absolute inset-0 pointer-events-none">
          {hours.map(hour => (
            <div key={hour} className="border-b border-slate-100 flex items-start group" style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}>
              <span className="text-xs font-mono text-slate-400 w-14 text-right pr-4 -mt-2 group-hover:text-slate-600">
                {String(hour).padStart(2, '0')}:00
              </span>
              <div className="flex-1 h-full relative border-l border-slate-100">
                 <div className="absolute top-1/2 left-0 right-0 border-t border-slate-50 border-dashed"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute top-0 left-14 right-4 bottom-0">
          {tasks.map(task => {
            const [h, m] = task.time.split(':').map(Number);
            if (h < 5) return null;
            
            const startMinutes = (h - 5) * 60 + m;
            const top = startMinutes * PIXELS_PER_MINUTE;
            const height = task.duration * PIXELS_PER_MINUTE;
            const isBlue = task.type === 'blue';
            const isShort = task.duration <= 30;

            return (
              <div
                key={task.id}
                onMouseDown={(e) => handleMouseDown(e, task)}
                onClick={() => handleTaskClick(task)}
                style={{ top: `${top}px`, height: `${height}px` }}
                className={`absolute left-0 right-0 rounded-lg px-3 border-l-4 shadow-sm cursor-pointer transition-all
                  ${isDragging && dragItemRef.current?.id === task.id ? 'z-50 shadow-2xl opacity-90 scale-[1.02]' : 'z-10'}
                  ${isBlue ? 'bg-blue-50 border-blue-500 text-slate-700' : 'bg-green-50 border-green-500 text-slate-700'}
                  ${task.done ? 'opacity-60 grayscale' : ''} // ✅ 完成后变灰
                  hover:brightness-95 hover:shadow-md flex flex-col justify-center overflow-hidden pr-10
                `}
              >
                {/* 🟢 恢复：右上角的打卡按钮 (绝对定位，防止挤压文字) */}
                <div 
                    onClick={(e) => toggleTaskDone(e, task)}
                    className="absolute top-2 right-2 p-2 -m-2 z-20 hover:scale-110 transition-transform cursor-pointer"
                >
                    {task.done ? (
                        <CheckSquare size={18} className="text-green-600 fill-green-100" />
                    ) : (
                        <Square size={18} className="text-slate-400 hover:text-slate-600" />
                    )}
                </div>

                {/* 智能排版 */}
                {isShort ? (
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono ${isBlue?'text-blue-500':'text-green-600'}`}>{task.time}</span>
                        <span className={`font-bold text-xs truncate flex-1 ${task.done ? 'line-through text-slate-400' : ''}`}>{task.text}</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-bold font-mono ${isBlue ? 'text-blue-600' : 'text-green-600'}`}>
                                {task.time}
                            </span>
                        </div>
                        <div className={`font-bold text-sm truncate leading-tight ${task.done ? 'line-through text-slate-400' : ''}`}>
                            {task.text}
                        </div>
                        <div className="text-[10px] opacity-60 mt-0.5 flex items-center gap-1">
                            <Clock size={8}/> {task.duration}m
                        </div>
                    </>
                )}
                
                <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-20 pointer-events-none">
                    <GripHorizontal size={16}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={handleAddTask}
        className="absolute bottom-6 right-6 w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-700 active:scale-90 z-30"
      >
        <Plus size={28} />
      </button>

      {editingTask && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/20 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setEditingTask(null)}></div>
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6 animate-slideUp z-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">编辑任务</h3>
              <div className="flex gap-2">
                  {/* 🟢 恢复：编辑面板里的打卡按钮 */}
                  <button 
                    onClick={() => handleUpdateTask(editingTask.id, { done: !editingTask.done })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${editingTask.done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {editingTask.done ? <CheckSquare size={14}/> : <Square size={14}/>}
                    {editingTask.done ? '已完成' : '未完成'}
                  </button>
                  <button onClick={() => setEditingTask(null)} className="p-2 bg-slate-50 rounded-full text-slate-400">
                    <X size={20} />
                  </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">任务内容</label>
                <input 
                  type="text" 
                  value={editingTask.text}
                  onChange={(e) => handleUpdateTask(editingTask.id, { text: e.target.value })}
                  className="w-full text-lg font-bold bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Clock size={12}/> 开始时间
                  </label>
                  <input 
                    type="time" 
                    value={editingTask.time}
                    onChange={(e) => handleUpdateTask(editingTask.id, { time: e.target.value })}
                    className="w-full font-mono font-bold bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Hourglass size={12}/> 持续时长
                  </label>
                  <div className="relative">
                    <select 
                      value={editingTask.duration}
                      onChange={(e) => handleUpdateTask(editingTask.id, { duration: Number(e.target.value) })}
                      className="w-full font-mono font-bold bg-slate-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                    >
                      <option value={15}>15 分钟</option>
                      <option value={30}>30 分钟</option>
                      <option value={45}>45 分钟</option>
                      <option value={60}>1 小时</option>
                      <option value={90}>1.5 小时</option>
                      <option value={120}>2 小时</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                  </div>
                </div>
              </div>
              <hr className="border-slate-100" />
              <div className="flex gap-3">
                <button onClick={() => handleDeleteTask(editingTask.id)} className="p-4 bg-rose-50 text-rose-500 rounded-xl font-bold flex-1 flex items-center justify-center gap-2 hover:bg-rose-100">
                  <Trash2 size={18} /> 删除
                </button>
                <button onClick={() => setEditingTask(null)} className="p-4 bg-slate-800 text-white rounded-xl font-bold flex-[2] hover:bg-slate-700">
                  完成编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTimeline;
