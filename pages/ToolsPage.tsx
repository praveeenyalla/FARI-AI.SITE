import React from 'react';
import { CHAT_MODES } from '../constants';
import { ChatMode, ChatModeId } from '../types';
import { GridIcon } from '../components/Icons';

interface ToolsPageProps {
  onSelectTool: (modeId: ChatModeId) => void;
}

const toolCategories = {
    'Featured': ['image_creator', 'website_creator', 'deep_researcher', 'canvas', 'creative_writer'],
    'Productivity': ['job_search_assistant', 'travel_planner', 'document_qa', 'n8n_workflow_expert', 'strategic_thinker'],
    'Personal & Fun': ['companion', 'loyal_friend', 'therapist', 'unhinged_comedian'],
    'Learning & Development': ['homework_helper', 'guided_learning', 'coding_expert'],
    'Specialized': ['video_creator', 'fari_doc', 'latest_news'],
};

const ToolCard: React.FC<{ mode: ChatMode; onClick: () => void }> = ({ mode, onClick }) => (
    <button
        onClick={onClick}
        className="relative w-full text-left p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/70 hover:border-pink-500 transition-all transform hover:scale-105 overflow-hidden group"
    >
        <div className="absolute top-0 left-0 h-1 w-full opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: mode.color }} />
        <div className="flex items-center gap-4 mb-2">
            <div className="p-2 rounded-full bg-slate-700">
                <mode.icon className="w-6 h-6" style={{ color: mode.color }} />
            </div>
            <h3 className="text-lg font-bold text-white">{mode.name}</h3>
        </div>
        <p className="text-sm text-slate-400">{mode.placeholder}</p>
    </button>
);

const ToolsPage: React.FC<ToolsPageProps> = ({ onSelectTool }) => {
    return (
        <div className="flex flex-col h-full w-full bg-[#111111] text-white">
            <header className="flex-shrink-0 p-4 md:pl-48 pt-16 border-b border-white/10">
                 <div className="flex items-center gap-3 mb-2">
                    <GridIcon className="w-8 h-8 text-purple-400" />
                    <h1 className="text-2xl font-bold">Explore Tools & Personas</h1>
                </div>
                <p className="text-slate-400">Discover custom versions of FARI-AI that combine instructions, extra knowledge, and unique skills.</p>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                {Object.entries(toolCategories).map(([category, modeIds]) => {
                    const modesInCategory = CHAT_MODES.filter(m => modeIds.includes(m.id));
                    if (modesInCategory.length === 0) return null;
                    return (
                        <div key={category}>
                            <h2 className="text-xl font-semibold mb-4 text-slate-200">{category}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modesInCategory.map(mode => (
                                    <ToolCard key={mode.id} mode={mode} onClick={() => onSelectTool(mode.id)} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

export default ToolsPage;