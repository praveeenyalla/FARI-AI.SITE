import React, { useState, useEffect, useRef } from 'react';
import { ChatMode } from '../types';
import { CHAT_MODES, SIDEBAR_ASSISTANT_IDS } from '../constants';
import { ChevronDownIcon, CheckIcon, PenSquareIcon } from './Icons';

interface PersonaSelectorProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onOpenCustomPersonaModal: () => void;
  disabled?: boolean;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ activeMode, onModeChange, onOpenCustomPersonaModal, disabled = false }) => {
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
  const sortedModes = [availableModes.find(m => m.id === 'neutral')!, ...availableModes.filter(m => m.id !== 'neutral')];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl transition-colors bg-black/30 border border-slate-700/50 text-slate-200 hover:bg-black/50 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Change Persona"
      >
        <activeMode.icon className="w-4 h-4" />
        <span className="font-semibold">{activeMode.name}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#0F1015]/95 backdrop-blur-md rounded-xl shadow-2xl p-2 z-20 border border-white/10 origin-top-right max-h-[calc(100vh-80px)] overflow-y-auto">
          <ul className="space-y-1">
            {sortedModes.map(mode => (
              <li key={mode.id}>
                {mode.id === activeMode.id ? (
                  <div className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white">
                    <div className="flex items-center gap-3">
                        <mode.icon className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{mode.name}</p>
                            <p className="text-xs text-blue-200 truncate">{mode.placeholder}</p>
                        </div>
                    </div>
                    <CheckIcon className="w-5 h-5 text-white flex-shrink-0" />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onModeChange(mode);
                      setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-slate-800/70 text-slate-300"
                  >
                    <mode.icon className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-white">{mode.name}</p>
                        <p className="text-xs text-slate-400 truncate">{mode.placeholder}</p>
                    </div>
                  </button>
                )}
              </li>
            ))}
             <div className="border-t border-white/10 my-2"></div>
             <li>
                <button
                    onClick={() => {
                        onOpenCustomPersonaModal();
                        setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-slate-800/70 text-slate-300"
                >
                    <PenSquareIcon className="w-5 h-5 flex-shrink-0 text-green-400" />
                    <div>
                        <p className="font-semibold text-white">Create Custom Persona</p>
                        <p className="text-xs text-slate-400 truncate">Define your own AI assistant</p>
                    </div>
                </button>
             </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PersonaSelector;