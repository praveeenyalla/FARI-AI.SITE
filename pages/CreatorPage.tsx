import React from 'react';
import { ImageIcon, SparklesIcon, VideoIcon } from '../components/Icons';
import { ChatModeId } from '../types';

interface CreatorPageProps {
  onSelectTool: (modeId: ChatModeId) => void;
}

const CreateCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/70 hover:border-pink-500 transition-all transform hover:scale-105"
  >
    <div className="flex items-center gap-4 mb-3">
      <div className="p-3 rounded-full bg-slate-700">{icon}</div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <p className="text-slate-400">{description}</p>
  </button>
);

const CreatorPage: React.FC<CreatorPageProps> = ({ onSelectTool }) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#111111] text-white">
      <header className="flex-shrink-0 p-4 md:pl-48 pt-16 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <SparklesIcon className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold">FARI-AI Create</h1>
        </div>
        <p className="text-slate-400">Your central hub for generating images and videos with AI.</p>
      </header>
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
            <h2 className="text-2xl font-semibold text-center text-slate-200">What would you like to create?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CreateCard 
                    title="Generate Image"
                    description="Create stunning, high-quality images from a text description."
                    icon={<ImageIcon className="w-8 h-8 text-orange-400" />}
                    onClick={() => onSelectTool('image_creator')}
                />
                <CreateCard 
                    title="Generate Video"
                    description="Bring your ideas to life with cinematic, photorealistic video clips."
                    icon={<VideoIcon className="w-8 h-8 text-pink-400" />}
                    onClick={() => onSelectTool('video_creator')}
                />
            </div>
        </div>
      </main>
    </div>
  );
};

export default CreatorPage;