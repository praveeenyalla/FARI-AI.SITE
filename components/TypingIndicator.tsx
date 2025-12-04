import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 animate-fadeInUp">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 17.5L12 12.5L16.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            <path d="M7.5 12.5L12 7.5L16.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="bg-slate-900/70 backdrop-blur-sm border border-white/10 rounded-xl rounded-bl-lg px-4 py-3">
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;