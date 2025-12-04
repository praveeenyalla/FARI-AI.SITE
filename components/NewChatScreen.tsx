import React from 'react';
import { ChatMode } from '../types';
import { FARI_MODELS, NEW_CHAT_SUGGESTIONS_CARDS } from '../constants';
import { FariAlLogoIcon } from './Icons';

interface SuggestionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ icon, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-4 bg-slate-900/70 border border-white/10 rounded-xl text-left hover:bg-slate-800/80 transition-all duration-200 group w-full"
  >
    <div className="flex items-start gap-4">
      <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
    </div>
  </button>
);


interface NewChatScreenProps {
  onSendMessage: (prompt: string) => void;
  onModeChange: (mode: ChatMode) => void;
  activeMode: ChatMode;
}

const NewChatScreen: React.FC<NewChatScreenProps> = ({ onSendMessage }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 h-full">
            <div className="w-full max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <FariAlLogoIcon className="w-16 h-16" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-3 brand-gradient-text">
                    How can Fari-AI help you today?
                </h1>
                <p className="max-w-xl mx-auto text-base text-slate-300 mb-12">
                    I'm FARI-AI, here to assist with your questions, creative projects, and problem-solving needs.
                </p>

                <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Powered by FARI AI FARI NLP
                </p>
            </div>
        </div>
    );
};

export default NewChatScreen;