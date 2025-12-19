import { useContext } from 'react';
import { EnergyContext } from './EnergyContext.jsx';

/**
 * Custom hook to access the EnergyContext
 * @returns {Object} The energy context value
 */
const useEnergy = () => {
  const context = useContext(EnergyContext);
  
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  
  return context;
};

export default useEnergy;
