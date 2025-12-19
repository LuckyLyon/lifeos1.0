import React from 'react';
// ✅ 修复点：这里其实不需要引入 useEnergy，因为 App.jsx 已经把 mode 传进来了
// 但为了防止你以后想用，如果非要引，必须加花括号： import { useEnergy } from '../contexts/useEnergy';
// 这里我直接用 props，既简单又不会报错。

import { Zap, Leaf, Wind } from 'lucide-react'; // 假设你用的是这些图标，或者用原来代码里的

const ModeToggle = ({ mode }) => {
  const isBlue = mode === 'blue';

  return (
    <div className={`relative flex items-center justify-between w-16 h-8 rounded-full p-1 transition-colors duration-500 ${isBlue ? 'bg-slate-700' : 'bg-green-200'}`}>
      <span className="sr-only">Toggle Energy Mode</span>
      
      {/* 滑块 */}
      <div 
        className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-500 flex items-center justify-center ${isBlue ? 'translate-x-8' : 'translate-x-0'}`}
      >
        {isBlue ? (
            <Wind size={14} className="text-slate-600" />
        ) : (
            <Leaf size={14} className="text-green-600" />
        )}
      </div>

      {/* 背景图标提示 */}
      <div className="flex justify-between w-full px-1.5">
         <div className={`text-[10px] font-bold ${isBlue ? 'opacity-0' : 'opacity-100 text-green-700'} transition-opacity duration-300`}>G</div>
         <div className={`text-[10px] font-bold ${isBlue ? 'opacity-100 text-slate-200' : 'opacity-0'} transition-opacity duration-300`}>F</div>
      </div>
    </div>
  );
};

export default ModeToggle;