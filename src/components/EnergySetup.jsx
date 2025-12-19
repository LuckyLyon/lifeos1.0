import React, { useState } from 'react'; 
import { Check, RotateCcw } from 'lucide-react'; 

export default function EnergySetup({ onSave, initialProfile }) { 
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 
  const getDefault = () => { 
    const p = {}; 
    weekDays.forEach((_, i) => { p[i] = (i === 0 || i === 6) ? 'green' : 'blue'; }); 
    return p; 
  }; 
  const [profile, setProfile] = useState(initialProfile || getDefault()); 
  const toggleDay = (i) => setProfile(prev => ({ ...prev, [i]: prev[i] === 'green' ? 'blue' : 'green' })); 
  return ( 
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"> 
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md flex flex-col items-center"> 
        <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Set Your Rhythm</h2> 
        <p className="text-slate-500 mb-6 text-center text-xs">Define your weekly cycle. <br/><span className="text-green-600 font-bold">Green=Growth</span> • <span className="text-blue-600 font-bold">Blue=Flow</span></p> 
        <div className="grid grid-cols-7 gap-2 mb-6 w-full"> 
          {weekDays.map((day, i) => ( 
            <div key={day} className="flex flex-col items-center gap-2"> 
              <span className="text-[10px] font-bold text-slate-400 uppercase">{day}</span> 
              <button onClick={() => toggleDay(i)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${profile[i] === 'green' ? 'bg-green-100 border-2 border-green-500 text-green-700' : 'bg-blue-100 border-2 border-blue-500 text-blue-700'}`}> 
                {profile[i] === 'green' ? 'G' : 'F'} 
              </button> 
            </div> 
          ))} 
        </div> 
        <div className="flex gap-3 w-full"> 
          <button onClick={() => setProfile(getDefault())} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"><RotateCcw size={16} /></button> 
          <button onClick={() => onSave(profile)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition-transform shadow-lg"><Check size={18} /><span>Save Cycle</span></button> 
        </div> 
      </div> 
    </div> 
  ); 
 }