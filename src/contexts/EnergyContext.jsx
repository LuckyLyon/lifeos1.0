import React, { createContext, useState, useEffect } from 'react';

// 1. 导出 Context 对象
export const EnergyContext = createContext();

// 2. 导出 Provider 组件 (核心发电机)
export const EnergyProvider = ({ children }) => {
  const [energyMode, setEnergyMode] = useState(() => {
    // 优先读取本地存储，读不到默认绿色
    return localStorage.getItem('lifeos-mode') || 'green';
  });

  useEffect(() => {
    // 每次变色，保存到本地
    localStorage.setItem('lifeos-mode', energyMode);
    // 强制修改 body 背景色，防止白屏
    document.body.className = energyMode === 'blue' ? 'bg-slate-900' : 'bg-green-50';
  }, [energyMode]);

  return (
    <EnergyContext.Provider value={{ energyMode, setEnergyMode }}>
      {children}
    </EnergyContext.Provider>
  );
};