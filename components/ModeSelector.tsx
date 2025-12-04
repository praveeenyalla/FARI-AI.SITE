import React, { useState, useEffect, useRef } from 'react';
import { ChatMode } from '../types';
import { CHAT_MODES, SIDEBAR_ASSISTANT_IDS } from '../constants';
import { ChevronDownIcon, CheckIcon } from './Icons';

interface ModeSelectorProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onModeChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const availableModes = CHAT_MODES.filter(m => !SIDEBAR_ASSISTANT_IDS.includes(m.id));
  const avomindMode = availableModes.find(m => m.id === 'neutral') || availableModes[0];
  const sortedModes = [avomindMode, ...availableModes.filter(m => m.id !== 'neutral')];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl transition-colors bg-[#1C1F26]/70 border border-slate-700/80 text-slate-200 hover:bg-[#2a2e36]/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#1C1F26]/70"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Change Persona"
      >
        <activeMode.icon className="w-4 h-4" />
        <span className="font-semibold">{activeMode.name}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1A1829]/90 backdrop-blur-md rounded-lg shadow-2xl p-2 z-20 border border-white/10 origin-top-right max-h-[70vh] overflow-y-auto">
          <ul className="space-y-1">
            {sortedModes.map(mode => (
              <li key={mode.id}>
                <button
                  onClick={() => {
                    onModeChange(mode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    activeMode.id === mode.id
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <mode.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{mode.name}</p>
                    <p className="text-xs text-slate-400 truncate">{mode.placeholder}</p>
                  </div>
                  {activeMode.id === mode.id && (
                    <CheckIcon className="w-5 h-5 text-white ml-auto flex-shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModeSelector;