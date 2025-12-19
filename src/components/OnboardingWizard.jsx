import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, BatteryCharging, Zap, Target } from 'lucide-react';

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  
  // 0=周日, 1=周一... 存储蓝日索引
  const [blueDays, setBlueDays] = useState([2, 4]); // 默认周二周四

  // 目标详情
  const [goalTitle, setGoalTitle] = useState('');
  const [greenTask, setGreenTask] = useState('');
  const [blueTask, setBlueTask] = useState('');

  const handleNext = () => {
    if (step === 3) {
      // 1. 保存用户名
      localStorage.setItem('lifeos-username', nickname || 'Explorer');
      
      // 2. 保存能量周期配置
      localStorage.setItem('lifeos-energy-profile', JSON.stringify(blueDays));
      
      // 3. 保存第一个目标 (手动构建)
      if (goalTitle && greenTask && blueTask) {
        const goal = {
          id: Date.now(),
          title: goalTitle,
          green: greenTask, // 用户手动输入的绿日计划
          blue: blueTask,   // 用户手动输入的蓝日计划
          time: '09:00',
          frequency: [0,1,2,3,4,5,6], // 默认全勤
          streak: 0,
          history: []
        };
        localStorage.setItem('lifeos-goals', JSON.stringify([goal]));
      }
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const toggleBlueDay = (dayIndex) => {
    if (blueDays.includes(dayIndex)) {
      setBlueDays(blueDays.filter(d => d !== dayIndex));
    } else {
      setBlueDays([...blueDays, dayIndex]);
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="w-full max-w-md space-y-8">
        {/* 进度条 */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-slate-800' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Step 1: 昵称 */}
        {step === 1 && (
          <div className="space-y-6 animate-slideUp">
            <h1 className="text-3xl font-black text-slate-800">欢迎来到 LifeOS</h1>
            <p className="text-slate-500">这是一个顺应你能量周期的智能系统。</p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">怎么称呼你?</label>
              <input 
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="你的名字"
                className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-800 transition-all"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: 能量周期 */}
        {step === 2 && (
          <div className="space-y-6 animate-slideUp">
            <h1 className="text-2xl font-black text-slate-800">设定你的能量周期</h1>
            <p className="text-slate-500 text-sm">请选择你通常感到<span className="text-blue-500 font-bold">能量较低 (Blue Mode)</span> 的日子：</p>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const isBlue = blueDays.includes(idx);
                return (
                  <button 
                    key={idx}
                    onClick={() => toggleBlueDay(idx)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                      isBlue 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-green-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{day}</span>
                    <div className="mt-1">
                      {isBlue ? <BatteryCharging size={14}/> : <Zap size={14} className={!isBlue ? "text-green-400" : ""}/>}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 px-2">
               <span>未选中 = 高能日 (Green)</span>
               <span>选中 = 恢复日 (Blue)</span>
            </div>
          </div>
        )}

        {/* Step 3: 手动设定首个目标 */}
        {step === 3 && (
          <div className="space-y-5 animate-slideUp">
            <h1 className="text-2xl font-black text-slate-800">建立第一个习惯</h1>
            <p className="text-slate-500 text-sm">为这个习惯设定两种执行强度：</p>
            
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">习惯名称</label>
               <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="例如: 每日阅读" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"/>
            </div>

            <div className="space-y-3 pt-2">
                <div className="relative">
                    <div className="absolute top-3 left-3 text-green-500"><Zap size={18}/></div>
                    <input value={greenTask} onChange={e => setGreenTask(e.target.value)} placeholder="高能日做什么? (如: 读30分钟)" className="w-full pl-10 p-3 bg-green-50 border border-green-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-200"/>
                </div>
                <div className="relative">
                    <div className="absolute top-3 left-3 text-blue-500"><BatteryCharging size={18}/></div>
                    <input value={blueTask} onChange={e => setBlueTask(e.target.value)} placeholder="低能日做什么? (如: 读1页书)" className="w-full pl-10 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"/>
                </div>
            </div>
          </div>
        )}

        <button 
          onClick={handleNext}
          disabled={(step === 1 && !nickname) || (step === 3 && (!goalTitle || !greenTask || !blueTask))}
          className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 3 ? "启动系统" : "下一步"} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingWizard;