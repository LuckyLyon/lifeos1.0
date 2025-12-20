import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Clock, Hourglass, X, Check, ChevronDown } from 'lucide-react';

const DailyTimeline = ({ date, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null); // 当前正在编辑的任务

  // 初始化加载任务
  useEffect(() => {
    const loadTasks = () => {
      const storageKey = `lifeos-tasks-day-${date}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setTasks(JSON.parse(saved));
        } else {
          setTasks([]);
        }
      } catch (e) {
        console.error("Load tasks error", e);
      }
    };
    loadTasks();
  }, [date]);

  // 保存任务到本地
  const saveTasksToStorage = (newTasks) => {
    setTasks(newTasks);
    localStorage.setItem(`lifeos-tasks-day-${date}`, JSON.stringify(newTasks));
  };

  // 添加新任务
  const handleAddTask = () => {
    const newTask = {
      id: Date.now(),
      text: "新任务",
      time: "09:00",
      duration: 60,
      type: 'green',
      source: 'manual',
      done: false
    };
    const newTasks = [...tasks, newTask];
    saveTasksToStorage(newTasks);
    setEditingTask(newTask); // 添加后自动打开编辑
  };

  // 更新任务信息
  const handleUpdateTask = (taskId, updates) => {
    const newTasks = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    saveTasksToStorage(newTasks);
    // 更新当前编辑状态，保持面板同步
    setEditingTask(prev => ({ ...prev, ...updates }));
  };

  // 删除任务
  const handleDeleteTask = (taskId) => {
    if(!window.confirm("确定删除这个任务吗？")) return;
    const newTasks = tasks.filter(t => t.id !== taskId);
    saveTasksToStorage(newTasks);
    setEditingTask(null);
  };

  // 生成时间轴刻度 (05:00 - 24:00)
  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  // 计算位置样式
  const getTaskStyle = (time, duration) => {
    const [h, m] = time.split(':').map(Number);
    if (h < 5) return { display: 'none' }; // 太早的任务不显示
    const startMinutes = (h - 5) * 60 + m;
    const height = duration; // 1分钟 = 1px (可调整比例)
    return {
      top: `${startMinutes}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm shrink-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">{date}</h2>
        <div className="w-10"></div> {/* 占位保持居中 */}
      </div>

      {/* 可滚动的时间轴区域 */}
      <div className="flex-1 overflow-y-auto relative pb-20" style={{ minHeight: '1200px' }}>
        {/* 背景网格 */}
        <div className="absolute inset-0 pointer-events-none">
          {hours.map(hour => (
            <div key={hour} className="h-[60px] border-b border-slate-100 flex items-start group">
              <span className="text-xs font-mono text-slate-400 w-14 text-right pr-4 -mt-2 group-hover:text-slate-600 transition-colors">
                {String(hour).padStart(2, '0')}:00
              </span>
              <div className="flex-1 h-full relative">
                 {/* 半点辅助线 */}
                 <div className="absolute top-1/2 left-0 right-0 border-t border-slate-50 border-dashed"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 任务卡片渲染 */}
        <div className="absolute top-0 left-14 right-4 bottom-0">
          {tasks.map(task => {
            const style = getTaskStyle(task.time, task.duration);
            const isBlue = task.type === 'blue';
            
            return (
              <div
                key={task.id}
                onClick={() => setEditingTask(task)} // 👉 点击打开编辑面板
                style={style}
                className={`absolute left-0 right-0 rounded-xl px-3 py-2 border-l-4 shadow-sm cursor-pointer transition-all active:scale-95 flex flex-col justify-center overflow-hidden
                  ${isBlue 
                    ? 'bg-blue-50 border-blue-500 text-slate-700' 
                    : 'bg-green-50 border-green-500 text-slate-700'
                  } hover:brightness-95 hover:shadow-md z-10`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold font-mono ${isBlue ? 'text-blue-600' : 'text-green-600'}`}>
                    {task.time}
                  </span>
                  {/* 完成状态标记 */}
                  {task.done && <Check size={12} className="text-green-600" />}
                </div>
                <div className="font-bold text-sm truncate leading-tight">{task.text}</div>
                {task.duration > 45 && (
                    <div className="text-[10px] opacity-60 mt-1">{task.duration} 分钟</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 悬浮添加按钮 (右下角) */}
      <button 
        onClick={handleAddTask}
        className="absolute bottom-6 right-6 w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-700 hover:scale-105 transition-all active:scale-90 z-20"
      >
        <Plus size={28} />
      </button>

      {/* 🟢 移动端编辑面板 (底部弹出) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/20 backdrop-blur-sm animate-fadeIn">
          {/* 点击背景关闭 */}
          <div className="absolute inset-0" onClick={() => setEditingTask(null)}></div>
          
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl p-6 animate-slideUp z-50">
            {/* 标题栏 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">编辑任务</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 bg-slate-50 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* 任务内容输入 */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">任务内容</label>
                <input 
                  type="text" 
                  value={editingTask.text}
                  onChange={(e) => handleUpdateTask(editingTask.id, { text: e.target.value })}
                  className="w-full text-lg font-bold bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* 时间和时长控制 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 修改时间 */}
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

                {/* 修改时长 (你要的下拉框在这里！) */}
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

              {/* 底部按钮 */}
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="p-4 bg-rose-50 text-rose-500 rounded-xl font-bold flex-1 flex items-center justify-center gap-2 hover:bg-rose-100"
                >
                  <Trash2 size={18} /> 删除
                </button>
                <button 
                  onClick={() => setEditingTask(null)}
                  className="p-4 bg-slate-800 text-white rounded-xl font-bold flex-[2] hover:bg-slate-700"
                >
                  完成
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