import React, { createContext, useState, useEffect } from 'react'; 

// Create context
const EnergyContext = createContext(); 

// Energy Provider Component
export function EnergyProvider({ children }) {
  // Initialize energyMode from localStorage or default to 'green'
  const [energyMode, setEnergyMode] = useState(() => {
    const saved = localStorage.getItem('lifeos-energy-mode');
    return saved || 'green';
  });
  
  const [energyProfile, setEnergyProfile] = useState(() => {
    const saved = localStorage.getItem('lifeos-energy-profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('lifeos-api-key') || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Persist energyMode to localStorage
  useEffect(() => {
    localStorage.setItem('lifeos-energy-mode', energyMode);
  }, [energyMode]);
  
  useEffect(() => { if (energyProfile) localStorage.setItem('lifeos-energy-profile', JSON.stringify(energyProfile)); }, [energyProfile]);
  useEffect(() => { localStorage.setItem('lifeos-api-key', apiKey); }, [apiKey]);
  
  // Toggle energy mode function
  const toggleMode = () => {
    setEnergyMode(prevMode => prevMode === 'green' ? 'blue' : 'green');
  };
  
  const getModeForDate = (dateObj) => {
    if (!energyProfile) return 'green';
    return energyProfile[dateObj.getDay()];
  };
  
  const incrementRefreshTrigger = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return <EnergyContext.Provider value={{ energyMode, setEnergyMode, toggleMode, energyProfile, setEnergyProfile, getModeForDate, apiKey, setApiKey, refreshTrigger, incrementRefreshTrigger }}>{children}</EnergyContext.Provider>;
} 

// Export context for use in custom hooks
export { EnergyContext };