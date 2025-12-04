import React from 'react';
import ImageCarousel from './ImageCarousel';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
      <ImageCarousel />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 p-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            NEXUS AI
          </span>
        </h1>
        <p className="text-lg text-slate-300 max-w-lg">
          Hello! I'm Nexus AI. Select a persona or just start chatting. How can I assist you today?
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
