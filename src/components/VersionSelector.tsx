import React, { useState, useEffect, useRef } from 'react';
import { FariModel, FariModelId } from '../types';
import { FARI_MODELS } from '../constants';
import { ChevronDownIcon, CheckIcon } from './Icons';

interface VersionSelectorProps {
  activeModelId: FariModelId;
  onModelChange: (modelId: FariModelId) => void;
  disabled?: boolean;
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ activeModelId, onModelChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = FARI_MODELS.find(v => v.id === activeModelId) || FARI_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Change AI Version"
      >
        <span className="font-semibold">{activeModel.name.replace('FARI ', '')}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#1A1829]/90 backdrop-blur-md rounded-lg shadow-2xl p-2 z-50 border border-white/10 origin-top">
          <ul className="space-y-1">
            {FARI_MODELS.map(version => (
              <li key={version.id}>
                <button
                  onClick={() => {
                    onModelChange(version.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-colors ${
                    activeModelId === version.id
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{version.name}</p>
                    <p className="text-xs text-slate-400">{version.description}</p>
                  </div>
                  {activeModelId === version.id && (
                    <CheckIcon className="w-4 h-4 text-white flex-shrink-0" />
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

export default VersionSelector;