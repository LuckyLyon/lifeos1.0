import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarStrip = ({ onSelectDate, getPredictedMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === d.toDateString();
      
      // 🌟 V15.1: 能量热力带核心逻辑
      // 默认绿色，如果有预测函数，则使用预测结果
      let mode = 'green';
      if (getPredictedMode) {
          mode = getPredictedMode(dateStr);
      }
      
      // 🎨 全彩配色方案
      let bgClass = '';
      let textClass = '';
      let shadowClass = '';

      if (isToday) {
          // 选中状态 (高亮)
          if (mode === 'blue') {
              bgClass = 'bg-blue-500';
              textClass = 'text-white';
              shadowClass = 'shadow-lg shadow-blue-300 scale-110';
          } else {
              bgClass = 'bg-green-500';
              textClass = 'text-white';
              shadowClass = 'shadow-lg shadow-green-300 scale-110';
          }
      } else {
          // 未选中状态 (淡雅背景)
          if (mode === 'blue') {
              bgClass = 'bg-blue-50 hover:bg-blue-100';
              textClass = 'text-blue-600';
          } else {
              bgClass = 'bg-green-50 hover:bg-green-100';
              textClass = 'text-green-600';
          }
      }

      days.push(
        <button
          key={i}
          onClick={() => onSelectDate(dateStr)}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${bgClass} ${textClass} ${shadowClass}`}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6 px-2">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><ChevronLeft size={20}/></button>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">
           {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><ChevronRight size={20}/></button>
      </div>
      
      <div className="grid grid-cols-7 gap-3 text-center mb-2">
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
            <div key={d} className="text-[10px] font-bold text-slate-300 tracking-widest">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-3 place-items-center">
        {renderCalendar()}
      </div>
    </div>
  );
};

export default CalendarStrip;