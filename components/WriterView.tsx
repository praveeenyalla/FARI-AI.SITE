import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '../types';
import { FeatherIcon, DownloadIcon } from './Icons';

interface WriterViewProps {
  activeChat: Chat | undefined;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

const downloadAsMarkdown = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const safeTitle = (title || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

const WriterView: React.FC<WriterViewProps> = ({ activeChat, setChats }) => {
  const documentContent = activeChat?.documentContent ?? '';
  const [localContent, setLocalContent] = useState(documentContent);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalContent(activeChat?.documentContent ?? '');
  }, [activeChat?.id, activeChat?.documentContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);

    if (debounceRef.current) {
        clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
        if (!activeChat) return;
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === activeChat.id
                    ? { ...chat, documentContent: newContent }
                    : chat
            )
        );
    }, 500); // Debounce saving to main state
  };
  
  if (!activeChat) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 bg-black/50 h-full">
            <FeatherIcon className="w-16 h-16 text-pink-400 mb-4"/>
            <h1 className="text-3xl font-bold text-white mb-2">Creative Writer</h1>
            <p className="text-slate-300 max-w-lg">Start a new conversation to begin writing your document or story.</p>
        </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#1a1a1a] text-white flex-col">
        <div className="flex-shrink-0 bg-black/50 border-b border-slate-700/50 p-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Document Editor</h2>
            <button
                onClick={() => downloadAsMarkdown(localContent, activeChat.title)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
                <DownloadIcon className="w-4 h-4" /> Download (.md)
            </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto bg-[#1e1e1e]">
            <textarea
                value={localContent}
                onChange={handleContentChange}
                placeholder="Start writing your masterpiece..."
                className="w-full h-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none border-none text-base leading-relaxed font-serif"
                spellCheck="false"
            />
        </div>
    </div>
  );
};

export default WriterView;
