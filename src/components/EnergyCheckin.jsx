import React, { useState } from 'react';
import { Battery, BatteryFull, Coffee, Sun, AlertCircle } from 'lucide-react';

const EnergyCheckin = ({ onGenerate, onClose }) => {
  const [energy, setEnergy] = useState(70);

  const getMode = () => {
    if (energy < 40) return { mode: 'blue', text: "恢复模式", message: "累了就休息，用微习惯守护你的连续性。", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
    if (energy > 80) return { mode: 'green', text: "成长模式", message: "状态极佳！今天是大步向前的日子。", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    return { mode: 'green', text: "稳健模式", message: "保持节奏，按部就班完成计划。", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" };
  };

  const currentMode = getMode();

  const handleGenerate = () => {
    let goals = [];
    try {
      const saved = localStorage.getItem('lifeos-goals');
      if (saved) goals = JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }

    // 如果没目标，用默认 (带上时间)
    if (goals.length === 0) {
      goals = [
        { id: 1, title: "健康", green: "健身房 45分钟", blue: "5个俯卧撑", time: "18:00" },
        { id: 2, title: "阅读", green: "读一章书", blue: "读一段话", time: "20:00" }
      ];
    }

    const isBlue = energy < 40;
    const selectedMode = isBlue ? 'blue' : 'green';

    // 生成任务 (尊重用户设定的时间)
    const newTasks = goals.map((g, index) => {
      // 优先使用 g.time, 如果没有则自动计算 (兼容旧数据)
      let timeStr = g.time;
      if (!timeStr) {
          const startTotalHours = 9 + index; 
          const hour = Math.floor(startTotalHours);
          const min = (startTotalHours % 1) * 60;
          timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      }

      return {
        id: Date.now() + index,
        time: timeStr,
        text: isBlue ? g.blue : g.green,
        done: false,
        duration: isBlue ? 15 : 60,
        type: selectedMode,
        source: 'habit' // 标记为习惯，方便 App.jsx 识别
      };
    });
    
    onGenerate(newTasks, selectedMode);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">✕</button>

        <div className="mb-4 flex justify-center text-amber-500 animate-pulse-slow"><Sun size={40} /></div>
        <h2 className="text-xl font-black text-slate-800 mb-1">早安!</h2>
        <p className="text-sm text-slate-500 mb-6">今天感觉能量如何?</p>

        <div className="mb-6 px-2">
           <input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"/>
           <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider"><span>精疲力尽</span><span>能量爆棚</span></div>
        </div>

        <div className={`rounded-xl p-4 mb-6 border transition-colors duration-300 ${currentMode.bg} ${currentMode.border}`}>
           <h3 className={`font-bold text-base mb-1 ${currentMode.color} flex items-center justify-center gap-2`}>
             {energy < 40 ? <Coffee size={18}/> : <BatteryFull size={18}/>}
             {currentMode.text}
           </h3>
           <p className="text-xs text-slate-600 leading-relaxed">{currentMode.message}</p>
        </div>
        
        <button onClick={handleGenerate} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
          生成今日计划
        </button>
      </div>
    </div>
  );
};
export default EnergyCheckin;