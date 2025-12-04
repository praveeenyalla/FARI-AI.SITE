import React, { useState, useMemo } from 'react';
import { Chat } from '../types';
import { HistoryIcon, SearchIcon, MessageSquareIcon, FolderIcon, ImageIcon, PenToolIcon, BrushIcon, FileTextIcon, RotateCcwIcon, TrashIcon } from '../components/Icons';

interface HistoryPageProps {
  chats: Chat[];
  deletedChats: Chat[];
  onSelectChat: (id: string) => void;
  onRestoreChat: (id: string) => void;
  onPermanentlyDeleteChat: (id: string) => void;
}

const getChatIcon = (chat: Chat) => {
    const isSketchChat = chat.messages.some(m => m.sender === 'user' && m.text.startsWith('sketch::'));
    if (isSketchChat) {
        return <BrushIcon className="w-5 h-5" style={{ color: '#eab308' }} />;
    }
    
    const color = chat.mode.color;
    switch(chat.mode.id) {
        case 'website_creator': return <FolderIcon className="w-5 h-5" style={{ color }} />;
        case 'image_creator': return <ImageIcon className="w-5 h-5" style={{ color }} />;
        case 'canvas': return <PenToolIcon className="w-5 h-5" style={{ color }} />;
        case 'document_qa': return <FileTextIcon className="w-5 h-5" style={{ color }} />;
        default: {
            const Icon = chat.mode.icon;
            return <Icon className="w-5 h-5" style={{ color }} />;
        }
    }
}

const HistoryPage: React.FC<HistoryPageProps> = ({ chats, deletedChats, onSelectChat, onRestoreChat, onPermanentlyDeleteChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

    const filterChats = (chatList: Chat[]) => {
        return chatList
            .filter(chat => {
                if (!searchTerm.trim()) return true;
                const lowerSearch = searchTerm.toLowerCase();
                const hasMatch = chat.title.toLowerCase().includes(lowerSearch) ||
                                 chat.messages.some(m => m.text.toLowerCase().includes(lowerSearch));
                return hasMatch;
            })
            .sort((a, b) => {
                 const a_ts = new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime();
                 const b_ts = new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime();
                 return b_ts - a_ts;
            });
    };

    const filteredActiveChats = useMemo(() => filterChats(chats), [chats, searchTerm]);
    const filteredDeletedChats = useMemo(() => filterChats(deletedChats), [deletedChats, searchTerm]);

    const renderEmptyState = (message: string, subMessage: string) => (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4 animate-fadeInUp">
            <SearchIcon className="w-12 h-12 mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{message}</h2>
            <p className="text-sm">{subMessage}</p>
        </div>
    );

    const renderActiveChats = () => {
        if (filteredActiveChats.length === 0) {
            return renderEmptyState(
                searchTerm ? 'No Chats Found' : 'No Active Chats',
                searchTerm ? 'Try a different search term.' : 'Start a new conversation from the sidebar.'
            );
        }
        return (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredActiveChats.map(chat => (
                    <li key={chat.id}>
                        <button onClick={() => onSelectChat(chat.id)} className="w-full text-left flex items-center gap-4 p-4 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex-shrink-0">{getChatIcon(chat)}</div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">{chat.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{chat.messages[chat.messages.length - 1]?.text || '...'}</p>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                {new Date(chat.messages[0]?.timestamp || chat.id.split('-')[0]).toLocaleDateString()}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    const renderDeletedChats = () => {
         if (filteredDeletedChats.length === 0) {
            return renderEmptyState(
                searchTerm ? 'No Deleted Chats Found' : 'Trash is Empty',
                searchTerm ? 'Try a different search term.' : 'Chats you delete will appear here.'
            );
        }
        return (
             <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredDeletedChats.map(chat => (
                    <li key={chat.id} className="group p-4 flex items-center gap-4 opacity-80 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
                        <div className="flex-shrink-0">{getChatIcon(chat)}</div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 truncate">{chat.title}</h3>
                            <p className="text-sm text-slate-500 truncate">{chat.messages[chat.messages.length - 1]?.text || '...'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => onRestoreChat(chat.id)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-sky-500 dark:text-sky-300 bg-sky-100 dark:bg-sky-500/10 hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-colors">
                                <RotateCcwIcon className="w-3.5 h-3.5" /> Restore
                            </button>
                            <button onClick={() => onPermanentlyDeleteChat(chat.id)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors">
                                <TrashIcon className="w-3.5 h-3.5" /> Delete Forever
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#111111] text-slate-900 dark:text-white transition-colors duration-300">
            <header className="flex-shrink-0 flex items-center justify-between p-4 md:pl-48 pt-16 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="w-6 h-6 text-purple-500" />
                    <h1 className="text-xl font-bold">History</h1>
                </div>
            </header>

            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-white/10 space-y-4">
                <div className="relative">
                    <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full bg-white dark:bg-[#1c1c1f] border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                 <div className="flex items-center gap-2 border-b-2 border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === 'active' ? 'border-b-2 border-pink-500 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                        }`}
                    >
                        Active Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('deleted')}
                        className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                            activeTab === 'deleted' ? 'border-b-2 border-pink-500 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                        }`}
                    >
                        Deleted Chats
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto">
                {activeTab === 'active' && renderActiveChats()}
                {activeTab === 'deleted' && renderDeletedChats()}
            </main>
        </div>
    );
};

export default HistoryPage;