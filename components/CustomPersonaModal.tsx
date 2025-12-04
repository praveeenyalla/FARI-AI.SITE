import React from 'react';
import { XIcon, SparklesIcon } from './Icons';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomPersonaModal: React.FC<CustomPersonaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    alert('Creating custom personas is coming soon!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg p-6 bg-[#1C1F26] rounded-xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-green-400"/> Create Custom Persona
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-transform hover:scale-110"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="persona-name" className="block text-sm font-medium text-slate-300 mb-2">
              Persona Name
            </label>
            <input
              type="text"
              id="persona-name"
              className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., Sarcastic Commentator"
            />
          </div>

           <div>
            <label htmlFor="persona-icon" className="block text-sm font-medium text-slate-300 mb-2">
              Icon (Emoji)
            </label>
            <input
              type="text"
              id="persona-icon"
              className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., 🌶️"
              maxLength={2}
            />
          </div>

          <div>
            <label htmlFor="persona-instruction" className="block text-sm font-medium text-slate-300 mb-2">
              System Instruction
            </label>
            <textarea
              id="persona-instruction"
              rows={6}
              className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Describe how the AI should behave. e.g., 'You are a sarcastic commentator. Your answers should be witty, slightly cynical, and use dry humor.'"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-300 bg-transparent rounded-lg hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-all"
            >
              Save Persona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPersonaModal;