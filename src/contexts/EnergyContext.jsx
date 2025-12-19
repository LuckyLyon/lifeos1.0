import React, { createContext, useState, useEffect } from 'react'; 

// Create context
const EnergyContext = createContext(); 

// Energy Provider Component
export function EnergyProvider({ children }) {
  const [energyMode, setEnergyMode] = useState('green');
  const [energyProfile, setEnergyProfile] = useState(() => {
    const saved = localStorage.getItem('lifeos-energy-profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('lifeos-api-key') || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => { if (energyProfile) localStorage.setItem('lifeos-energy-profile', JSON.stringify(energyProfile)); }, [energyProfile]);
  useEffect(() => { localStorage.setItem('lifeos-api-key', apiKey); }, [apiKey]);
  
  const getModeForDate = (dateObj) => {
    if (!energyProfile) return 'green';
    return energyProfile[dateObj.getDay()];
  };
  
  const incrementRefreshTrigger = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return <EnergyContext.Provider value={{ energyMode, setEnergyMode, energyProfile, setEnergyProfile, getModeForDate, apiKey, setApiKey, refreshTrigger, incrementRefreshTrigger }}>{children}</EnergyContext.Provider>;
} 

// Export context for use in custom hooks
export { EnergyContext };