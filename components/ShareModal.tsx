import React, { useState } from 'react';
import { XIcon, CopyIcon, CheckIcon, LinkIcon } from './Icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatTitle: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, chatTitle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://avomind.ai/share/demo-link');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp" onClick={onClose}>
      <div className="relative w-full max-w-md p-6 bg-[#1C1F26] rounded-xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><LinkIcon className="w-5 h-5"/> Share Chat</h2>
            <p className="text-sm text-slate-400 truncate max-w-xs">{chatTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close modal">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300 mb-4">
          <strong>Note:</strong> Public link sharing is for demonstration purposes. This link is not active.
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value="https://avomind.ai/share/demo-link"
            className="w-full bg-[#101216] border border-white/10 rounded-lg px-3 py-2 text-slate-300"
          />
          <button onClick={handleCopy} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 flex items-center gap-2">
            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;