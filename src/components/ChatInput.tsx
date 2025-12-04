import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MicIcon, SubmitIcon, PlusIcon, XIcon, ThumbsDownIcon, ThumbsUpIcon, HeadphonesIcon } from './Icons';
import { Attachment, ChatMode, ChatModeId, ThinkConfig } from '../types';
import AttachmentMenu from './AttachmentMenu';
import ThinkLongerModal from './ThinkLongerModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (message: string, attachment?: Attachment, fromUserMessageId?: string, thinkConfig?: ThinkConfig) => void;
  isSending: boolean;
  activeMode: ChatMode;
  onToggleVoiceMode: () => void;
  voiceEndedInfo: { duration: number } | null;
  onClearVoiceEndedInfo: () => void;
  onModeChange: (modeId: ChatModeId) => void;
  onDrawSketchClick: () => void;
}

const placeholderTexts = [
    "How can I assist you today?",
    "What's on your mind?",
    "Ask me anything...",
    "Let's create something new.",
    "Describe your idea...",
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending, activeMode, onToggleVoiceMode, voiceEndedInfo, onClearVoiceEndedInfo, onModeChange, onDrawSketchClick }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isThinkLongerModalOpen, setIsThinkLongerModalOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(placeholderTexts[0]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDictationEnd = ({ transcript }: { transcript: string }) => {
    if (transcript) {
        setInput(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + transcript);
    }
  };

  const { isListening: isDictating, startListening: startDictation, stopListening: stopDictation } = useSpeechRecognition({ onEnd: handleDictationEnd });

  const handleDictationToggle = () => {
    if (isDictating) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
        setPlaceholder(prev => {
            const currentIndex = placeholderTexts.indexOf(prev);
            const nextIndex = (currentIndex + 1) % placeholderTexts.length;
            return placeholderTexts[nextIndex];
        });
    }, 2000); // Change every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = (thinkConfig?: ThinkConfig) => {
    if ((input.trim() || attachment) && !isSending) {
      onSendMessage(input.trim(), attachment || undefined, undefined, thinkConfig);
      setInput('');
      setAttachment(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
    }
  };
  
  const handleThinkLongerStart = (prompt: string, config: ThinkConfig) => {
      onSendMessage(prompt, undefined, undefined, config);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachment({
          name: file.name,
          type: file.type,
          dataUrl: event.target?.result as string,
        });
        textareaRef.current?.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const canSubmit = (!!input.trim() || !!attachment) && !isSending;
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (voiceEndedInfo) {
      return (
          <div className="w-full max-w-3xl mx-auto px-4 pb-3 animate-fadeInUp">
                <div className="w-full relative bg-white dark:bg-black/20 backdrop-blur-lg rounded-xl shadow-lg flex items-center justify-between p-2 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-white">Voice chat ended</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDuration(voiceEndedInfo.duration)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50">
                            <ThumbsUpIcon className="w-5 h-5"/>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50">
                            <ThumbsDownIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={onClearVoiceEndedInfo} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
          </div>
      )
  }

  return (
    <>
    <ThinkLongerModal 
        isOpen={isThinkLongerModalOpen}
        onClose={() => setIsThinkLongerModalOpen(false)}
        onStart={handleThinkLongerStart}
        initialPrompt={input}
    />
    <div className="w-full max-w-3xl mx-auto px-4 pb-3">
      <div className="relative">
        {isAttachmentMenuOpen && (
            <AttachmentMenu 
                onAddPhotosAndFiles={handleAttachmentClick}
                onClose={() => setIsAttachmentMenuOpen(false)}
                onThinkLongerClick={() => {
                    setIsAttachmentMenuOpen(false);
                    setIsThinkLongerModalOpen(true);
                }}
                onModeChange={onModeChange}
                onDrawSketchClick={() => {
                    onDrawSketchClick();
                    setIsAttachmentMenuOpen(false);
                }}
            />
        )}
      </div>
      <div 
        className="w-full relative bg-white dark:bg-black/20 backdrop-blur-lg rounded-xl shadow-lg flex items-end p-1.5 border border-slate-200 dark:border-white/10 transition-all duration-200"
      >
        {attachment ? (
            <div className="flex-shrink-0 ml-2 mb-1.5 p-1.5 bg-pink-100 dark:bg-pink-500/20 rounded-lg text-xs text-pink-700 dark:text-pink-300 flex items-center gap-2">
                <span>{attachment.name}</span>
                <button onClick={() => setAttachment(null)} className="font-bold leading-none">✕</button>
            </div>
        ) : (
            <button
                onClick={() => setIsAttachmentMenuOpen(prev => !prev)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50 flex-shrink-0 self-center"
                aria-label="Open attachment menu"
                disabled={isSending}
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        )}
       
        <textarea 
          ref={textareaRef} 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleKeyDown} 
          placeholder={isSending ? '...' : activeMode.placeholder}
          className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 resize-none outline-none border-none text-sm leading-relaxed py-2 px-2.5 self-center" 
          rows={1} 
          aria-label="Chat message input" 
          disabled={isSending} 
        />
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        <div className="flex items-center gap-1 pr-1 flex-shrink-0 self-center">
            <button 
              onClick={handleDictationToggle}
              className={`p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50 ${isDictating ? 'mic-recording' : ''}`} 
              aria-label={'Dictate message'} 
              disabled={isSending}
            >
              <MicIcon className="w-5 h-5" />
            </button>
             <button 
              onClick={onToggleVoiceMode}
              className={`p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-50`} 
              aria-label={'Use voice mode'} 
              disabled={isSending}
            >
              <HeadphonesIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleSend()} 
              disabled={!canSubmit} 
              className={`w-9 h-9 rounded-full text-white transition-all duration-200 flex items-center justify-center ${canSubmit ? 'bg-pink-600 hover:bg-pink-500' : 'bg-slate-300 dark:bg-slate-700 opacity-50 cursor-not-allowed'}`} 
              aria-label="Submit message"
            >
                <SubmitIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatInput;