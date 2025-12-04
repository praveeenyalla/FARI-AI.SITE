import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon, ChevronDownIcon, CheckIcon } from './Icons';

interface JobLocationFilterProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  disabled?: boolean;
}

const JOB_LOCATIONS = [
  'All Locations',
  'USA',
  'India',
  'United Kingdom',
  'Germany',
  'France',
  'Canada',
  'Australia',
  'Ireland',
  'Italy',
];

const JobLocationFilter: React.FC<JobLocationFilterProps> = ({ selectedLocation, onLocationChange, disabled }) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-pink-500/20 border border-pink-400/50 text-pink-300 hover:bg-pink-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={disabled ? "Location cannot be changed after a conversation has started." : "Change Job Location"}
      >
        <MapPinIcon className="w-4 h-4" />
        <span>{selectedLocation}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-[#1A1829]/90 backdrop-blur-md rounded-lg shadow-2xl p-2 z-20 border border-white/10 origin-top-right">
          <ul className="space-y-1 max-h-60 overflow-y-auto">
            {JOB_LOCATIONS.map(location => (
              <li key={location}>
                <button
                  onClick={() => {
                    onLocationChange(location);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-colors ${
                    selectedLocation === location
                      ? 'bg-pink-600 text-white'
                      : 'hover:bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <span>{location}</span>
                  {selectedLocation === location && (
                    <CheckIcon className="w-5 h-5 text-white" />
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

export default JobLocationFilter;