import React, { useState } from 'react';
import { Chat } from '../types';
import { FileTextIcon, ImageIcon, MessageSquareIcon, CodeXmlIcon } from './Icons';

interface DocumentViewProps {
  activeChat: Chat;
  children: React.ReactNode; // This will be the ChatArea
}

const DocumentView: React.FC<DocumentViewProps> = ({ activeChat, children }) => {
  const [mobileTab, setMobileTab] = useState<'document' | 'chat'>('document');
  const file = activeChat.attachedFile;

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <FileTextIcon className="w-12 h-12 text-slate-500 mb-4" />
        <h2 className="text-xl font-bold">No document loaded</h2>
        <p className="text-slate-400">Please start a new file chat from the sidebar.</p>
      </div>
    );
  }

  const isImage = file.type.startsWith('image/');

  const DocumentPreview = (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex-shrink-0 bg-black/50 border-b border-slate-700/50 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
                {isImage ? <ImageIcon className="w-4 h-4 text-slate-400" /> : <FileTextIcon className="w-4 h-4 text-slate-400" />}
                <h2 className="text-sm font-semibold text-white truncate">{file.name}</h2>
            </div>
        </div>
        <div className="flex-1 p-4 overflow-auto">
            {isImage ? (
                <img src={file.dataUrl} alt={file.name} className="max-w-full h-auto mx-auto rounded-lg" />
            ) : (
                <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words font-mono">
                    {file.content}
                </pre>
            )}
        </div>
    </div>
  );

  return (
    <>
      {/* Desktop side-by-side view */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-1/2 h-full border-r border-slate-700/50">
            {DocumentPreview}
        </div>
        <div className="w-1/2 h-full">
            {children}
        </div>
      </div>

      {/* Mobile tabbed view */}
      <div className="flex flex-col w-full h-full md:hidden">
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-white/10 h-[57px] bg-black/20 backdrop-blur-sm">
            <div className="flex items-center p-1 bg-black/30 rounded-full">
                <button onClick={() => setMobileTab('document')} className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${mobileTab === 'document' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>
                    {isImage ? <ImageIcon className="w-4 h-4"/> : <FileTextIcon className="w-4 h-4"/>} Document
                </button>
                <button onClick={() => setMobileTab('chat')} className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${mobileTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>
                    <MessageSquareIcon className="w-4 h-4"/> Chat
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-hidden">
            {mobileTab === 'document' && DocumentPreview}
            {mobileTab === 'chat' && children}
        </div>
      </div>
    </>
  );
};

export default DocumentView;