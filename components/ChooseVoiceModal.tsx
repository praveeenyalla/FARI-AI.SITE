import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, PlayIcon, PauseIcon } from './Icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface ChooseVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voiceName: string) => void;
  currentVoice: string;
}

const VOICE_PERSONAS = [
  { name: 'Lara', description: 'Female, warm & empathetic' },
  { name: 'Sam', description: 'Male, calm & professional' },
  { name: 'Mia', description: 'Female, energetic & engaging' },
  { name: 'Alex', description: 'Male, clear & confident' },
  { name: 'Sky', description: 'Energetic and friendly' }, // Kept one extra as a fallback
];


const ChooseVoiceModal: React.FC<ChooseVoiceModalProps> = ({ isOpen, onClose, onSelectVoice, currentVoice }) => {
  const { voices, speak, cancel, playbackState } = useTextToSpeech();
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const mappedVoices = useMemo(() => {
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length === 0) return [];
    return VOICE_PERSONAS.map((persona, index) => {
        const voice = englishVoices[index % englishVoices.length];
        return { ...persona, voiceName: voice?.name || '' };
    }).filter(v => v.voiceName);
  }, [voices]);

  useEffect(() => {
    if (playbackState === 'idle') {
      setPreviewingVoice(null);
    }
  }, [playbackState]);

  useEffect(() => {
    // Stop any preview when the modal is closed
    if (!isOpen) {
      cancel();
    }
  }, [isOpen, cancel]);

  if (!isOpen) return null;

  const handlePreview = (voiceName: string) => {
    if (playbackState === 'playing' && previewingVoice === voiceName) {
      cancel();
    } else {
      setPreviewingVoice(voiceName);
      speak('Hello, this is a preview of my voice.', {voiceName});
    }
  };

  const handleSelect = (voiceName: string) => {
    onSelectVoice(voiceName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp" onClick={onClose}>
      <div className="relative w-full max-w-sm p-6 bg-[#1C1F26] rounded-xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Choose a Voice</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close modal">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {mappedVoices.length > 0 ? mappedVoices.map(voice => (
                <li key={voice.name}>
                <button
                    onClick={() => handleSelect(voice.voiceName)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${currentVoice === voice.voiceName ? 'bg-pink-600/30' : 'hover:bg-slate-700/50'}`}
                >
                    <div>
                        <span className="text-sm font-semibold text-slate-200">{voice.name}</span>
                        <p className="text-xs text-slate-400">{voice.description}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handlePreview(voice.voiceName); }} className="p-2 text-slate-400 hover:text-white" aria-label={`Preview ${voice.name}`}>
                    {playbackState === 'playing' && previewingVoice === voice.voiceName ? <PauseIcon className="w-5 h-5 text-sky-400" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                </button>
                </li>
            )) : <p className="text-sm text-slate-500 text-center py-4">No English voices were found in your browser.</p>}
        </ul>
      </div>
    </div>
  );
};

export default ChooseVoiceModal;