import { useContext } from 'react';
import { EnergyContext } from './EnergyContext';

// 导出名为 useEnergy 的工具
export function useEnergy() {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
}