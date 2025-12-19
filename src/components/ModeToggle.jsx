import React from 'react';
import { Leaf, BatteryCharging } from 'lucide-react';

const ModeToggle = ({ mode }) => {
  // mode is passed from parent ('green' or 'blue')
  const isGreen = mode === 'green';

  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 shadow-sm border
      ${isGreen 
        ? 'bg-green-100 text-green-800 border-green-200' 
        : 'bg-blue-100 text-blue-800 border-blue-200'
      }
    `}>
      {isGreen ? <Leaf size={16} /> : <BatteryCharging size={16} />}
      <span className="text-xs font-bold tracking-wider uppercase">
        {isGreen ? 'Growth Mode' : 'Recovery Mode'}
      </span>
    </div>
  );
};

export default ModeToggle;