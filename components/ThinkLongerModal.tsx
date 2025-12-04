import React, { useState, useEffect } from 'react';
import { ThinkConfig } from '../types';
import { XIcon, BrainCircuitIcon } from './Icons';

interface ThinkLongerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (prompt: string, config: ThinkConfig) => void;
  initialPrompt?: string;
}

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
  <div
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors cursor-pointer ${enabled ? 'bg-pink-600' : 'bg-slate-700'}`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </div>
);

const ThinkLongerModal: React.FC<ThinkLongerModalProps> = ({ isOpen, onClose, onStart, initialPrompt = '' }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [config, setConfig] = useState<ThinkConfig>({
    timeBudget: 30,
    verbosity: 'detailed',
    useWeb: true,
    showSteps: true,
  });

  useEffect(() => {
    if (isOpen) {
        setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) {
    return null;
  }

  const handleStart = () => {
    if (prompt.trim()) {
      onStart(prompt, config);
      onClose();
      setPrompt('');
    }
  };
  
  const setTimeBudget = (value: string) => {
      const budget = parseInt(value, 10);
      setConfig(c => ({...c, timeBudget: isNaN(budget) ? 30 : budget}));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg p-6 bg-[#1C1F26] rounded-xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuitIcon className="w-5 h-5 text-sky-400"/> Think Longer
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
            <label htmlFor="think-prompt" className="block text-sm font-medium text-slate-300 mb-2">
              Your Request
            </label>
            <textarea
              id="think-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., Analyze the impact of quantum computing on modern cryptography..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Budget</label>
              <select value={config.timeBudget} onChange={(e) => setTimeBudget(e.target.value)} className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                <option value="15">Short (~15s)</option>
                <option value="30">Medium (~30s)</option>
                <option value="60">Long (~60s)</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Verbosity</label>
              <select value={config.verbosity} onChange={(e) => setConfig(c => ({...c, verbosity: e.target.value as 'short' | 'detailed'}))} className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                <option value="detailed">Detailed</option>
                <option value="short">Short</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
            <span className="text-sm font-medium text-slate-300">Use Web Search</span>
            <ToggleSwitch enabled={config.useWeb} onChange={(e) => setConfig(c => ({...c, useWeb: e}))} />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-300 bg-transparent rounded-lg hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={!prompt.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Thinking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkLongerModal;