import { useContext } from 'react';
import { EnergyContext } from './EnergyContext';

function useEnergy() {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
}

export default useEnergy;
