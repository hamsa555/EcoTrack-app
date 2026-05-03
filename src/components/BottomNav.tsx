import React from 'react';
import { Home, Map, Plus, User, ScanLine } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export default function BottomNav({ activeScreen, setScreen }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home', special: false },
    { id: 'map', icon: Map, label: 'Map', special: false },
    { id: 'activity', icon: Plus, label: 'Log', special: true },
    { id: 'scanner', icon: ScanLine, label: 'Scan', special: false },
    { id: 'profile', icon: User, label: 'Me', special: false },
  ] as const;

  if (activeScreen === 'login') return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-5 z-[100] pointer-events-none">
      <nav className="bg-[#1A1C19]/95 backdrop-blur-md flex items-center justify-between w-full max-w-sm rounded-[2.5rem] px-2 py-2 shadow-2xl shadow-black/30 pointer-events-auto border border-white/5">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          const Icon = tab.icon;
          
          if (tab.special) {
            return (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id as Screen)}
                className="w-14 h-14 bg-[#5CB338] rounded-full flex items-center justify-center -translate-y-10 shadow-xl shadow-[#5CB338]/30 active:scale-90 transition-all border-4 border-[#1A1C19]"
              >
                <Icon size={24} className="text-white" strokeWidth={3} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id as Screen)}
              className="flex-1 flex flex-col items-center justify-center py-2 active:scale-90 transition-all"
            >
              <Icon 
                size={20} 
                className={isActive ? 'text-[#5CB338]' : 'text-white/30'} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              {isActive && (
                <span className="text-[8px] text-[#5CB338] font-black uppercase tracking-widest mt-1 animate-in fade-in slide-in-from-bottom-1">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
