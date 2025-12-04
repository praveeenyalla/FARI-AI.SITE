
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark as atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Message, Attachment } from '../types';
import {
  UserAvatarIcon,
  FariAlLogoIcon,
  CopyIcon,
  CheckIcon,
  PencilIcon,
  RefreshCwIcon,
  LinkIcon,
  FileTextIcon,
  SpeakerIcon,
  StopCircleIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  DownloadIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ShareIcon,
  XIcon,
} from './Icons';
import { generatePromptSuggestions } from '../services/geminiService';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import ThinkingProgress from './ThinkingProgress';

interface MessageProps {
  message: Message;
  onUpdateMessage: (messageId: string, newText: string) => void;
  onSendMessage: (text: string, attachment?: Attachment, fromUserMessageId?: string) => void;
  onRegenerateResponse: (botMessageId: string) => void;
  onAddTask: (title: string) => void;
}

const ImageShareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle: string;
}> = ({ isOpen, onClose, imageUrl, imageTitle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const safeTitle = imageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle || 'generated-image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp" onClick={onClose}>
      <div className="relative w-full max-w-md p-6 bg-[#1C1F26] rounded-xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white truncate pr-8">{imageTitle}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white absolute top-4 right-4" aria-label="Close modal">
                <XIcon className="w-5 h-5" />
            </button>
        </div>

        <img src={imageUrl} alt={imageTitle} className="w-full h-auto rounded-lg mb-4 object-contain max-h-64" />
        
        <div className="grid grid-cols-5 gap-2 text-center">
            <button onClick={handleCopy} className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-700/50">
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full mb-1"><LinkIcon className="w-4 h-4"/></div>
                <span className="text-xs text-slate-400">Copy link</span>
            </button>
            <a href="#" className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-700/50" onClick={e => e.preventDefault()}>
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full mb-1 font-bold text-sm">X</div>
                <span className="text-xs text-slate-400">X</span>
            </a>
            <a href="#" className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-700/50" onClick={e => e.preventDefault()}>
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full mb-1 font-bold text-sm">Li</div>
                <span className="text-xs text-slate-400">LinkedIn</span>
            </a>
             <a href="#" className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-700/50" onClick={e => e.preventDefault()}>
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full mb-1 font-bold text-sm">Re</div>
                <span className="text-xs text-slate-400">Reddit</span>
            </a>
             <button onClick={handleDownload} className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-700/50">
                <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full mb-1"><DownloadIcon className="w-4 h-4" /></div>
                <span className="text-xs text-slate-400">Download</span>
            </button>
        </div>
      </div>
    </div>
  );
};

const FullScreenPreviewModal: React.FC<{ imageUrl: string | null, onClose: () => void }> = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeInUp" onClick={onClose}>
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Preview" className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
                 <button onClick={onClose} className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white z-10" aria-label="Close preview">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const CodeBlock: React.FC<{ language: string | undefined; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 rounded-lg bg-[#1e1e1e] font-sans border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/70 border-b border-slate-700/50">
        <span className="text-xs text-slate-300">{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        wrapLines={true}
        customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e', fontSize: '0.9em' }}
        codeTagProps={{ style: { fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
      >
        {String(value).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageComponent: React.FC<MessageProps> = ({ message, onUpdateMessage, onSendMessage, onRegenerateResponse, onAddTask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { speak, cancel, playbackState, pause, resume, setVolume } = useTextToSpeech();
  const prevStatusRef = useRef(message.status);
  const [taskAdded, setTaskAdded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const typingTimeoutRef = useRef<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };
  }, [message.id]);
  
  useEffect(() => {
    const isBotStreaming = message.sender === 'bot' && message.status === 'generating' && !message.isThinkingLonger;

    if (isBotStreaming) {
        if (displayedText.length < message.text.length) {
            const newText = message.text.slice(displayedText.length);
            let i = 0;
            const type = () => {
                if (i < newText.length) {
                    setDisplayedText(prev => prev + newText[i]);
                    i++;
                    typingTimeoutRef.current = window.setTimeout(type, 15);
                }
            };
            typingTimeoutRef.current = window.setTimeout(type, 0);
        }
    } else {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setDisplayedText(message.text);
    }

    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };
  }, [message.text, message.status, message.sender, message.isThinkingLonger, message.id]);


  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  useEffect(() => {
    const autoTTS = JSON.parse(localStorage.getItem('chatnlp-autotts') || 'false');

    if (
        autoTTS &&
        message.sender === 'bot' &&
        message.status === 'completed' &&
        prevStatusRef.current !== 'completed' &&
        !message.videoUrl
    ) {
        speak(message.text);
    }

    prevStatusRef.current = message.status;
  }, [message.status, message.sender, message.text, message.videoUrl, speak]);

  useEffect(() => {
    setEditText(message.text);
  }, [message.text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeFilename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onSendMessage(editText, message.attachment, message.id);
  };
  
  const handleAddTaskClick = () => {
      if (message.actionableTask?.title) {
          onAddTask(message.actionableTask.title);
          setTaskAdded(true);
      }
  };

  const handleGetSuggestions = async () => {
    if (!message.originalPrompt) return;
    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await generatePromptSuggestions(message.originalPrompt);
      setSuggestions(newSuggestions);
    } catch (e) {
      console.error("Failed to get suggestions", e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handlePlay = () => {
    if (message.audioDescription && videoRef.current && !videoRef.current.muted) {
      if (playbackState === 'paused') {
        resume();
      } else if (playbackState === 'idle') {
        speak(message.audioDescription);
      }
    }
  };

  const handlePause = () => {
    if (playbackState === 'playing') {
      pause();
    }
  };
  
  const handleVolumeChange = () => {
    if (!videoRef.current || !setVolume) return;
    const video = videoRef.current;
    
    setVolume(video.volume);

    if (video.muted && playbackState === 'playing') {
      pause();
    } else if (!video.muted && playbackState === 'paused' && !video.paused) {
      resume();
    }
  };

  const isUser = message.sender === 'user';
  const isGenerating = message.status === 'generating';
  const hasFailed = message.status === 'failed';

  if (isGenerating && message.isThinkingLonger) {
    return <ThinkingProgress message={message} />;
  }

  if (isGenerating && !message.isThinkingLonger) {
    return (
      <div className="flex items-start gap-3 animate-fadeInUp w-full">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
          <FariAlLogoIcon className="w-8 h-8" />
        </div>
        <div className="flex-1">
            <div className="px-4 py-3 w-fit">
                {message.text && message.text.length > 0 ? (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300 text-sm">
                        <div className="w-4 h-4 border-2 border-slate-500 border-t-pink-400 rounded-full animate-spin"></div>
                        <span>{message.text}</span>
                    </div>
                ) : (
                    <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }
  
  const renderTTSControls = () => {
    switch (playbackState) {
        case 'playing':
            return (
                <>
                    <button onClick={pause} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Pause reading">
                        <PauseIcon className="w-4 h-4 text-pink-500" />
                    </button>
                    <button onClick={cancel} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Stop reading">
                        <StopCircleIcon className="w-4 h-4 text-red-500/80" />
                    </button>
                </>
            );
        case 'paused':
            return (
                <>
                    <button onClick={resume} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Resume reading">
                        <PlayIcon className="w-4 h-4 text-pink-500" />
                    </button>
                    <button onClick={cancel} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Stop reading">
                        <StopCircleIcon className="w-4 h-4 text-red-500/80" />
                    </button>
                </>
            );
        default:
            return (
                <button onClick={() => speak(message.text)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Read message aloud">
                    <SpeakerIcon className="w-3.5 h-3.5" />
                </button>
            );
    }
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="w-full">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 dark:text-slate-100"
            rows={Math.max(3, editText.split('\n').length)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">Cancel</button>
            <button onClick={handleSaveEdit} className="px-3 py-1 text-sm rounded-md bg-pink-600 hover:bg-pink-700 text-white">Save & Submit</button>
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-sm dark:prose-invert break-words max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-strong:text-slate-900 dark:prose-strong:text-white prose-headings:text-slate-900 dark:prose-headings:text-white">
        {message.imageUrl && (
            <div className="my-2 relative group/image">
                <button onClick={() => setPreviewImageUrl(message.imageUrl)} className="block w-full">
                    <img src={message.imageUrl} alt={message.imagePrompt || 'Generated content'} className="rounded-lg max-w-full h-auto cursor-pointer border border-slate-200 dark:border-slate-700" />
                </button>
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/80 dark:bg-black/40 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 shadow-md">
                    <button onClick={() => setFeedback('like')} className={`p-2 rounded-full transition-colors ${feedback === 'like' ? 'text-green-500 bg-green-100 dark:bg-green-500/20' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`} aria-label="Like">
                        <ThumbsUpIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setFeedback('dislike')} className={`p-2 rounded-full transition-colors ${feedback === 'dislike' ? 'text-red-500 bg-red-100 dark:bg-red-500/20' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`} aria-label="Dislike">
                        <ThumbsDownIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownload(message.imageUrl!, message.imagePrompt || 'generated-image')} className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors" aria-label="Download">
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                     <button onClick={() => setIsShareModalOpen(true)} className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors" aria-label="Share">
                        <ShareIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
        {message.videoUrl && (
            <div className="my-2">
                <video 
                    ref={videoRef}
                    src={message.videoUrl} 
                    controls 
                    className="rounded-lg max-w-full h-auto border border-slate-200 dark:border-slate-700"
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onEnded={cancel}
                    onVolumeChange={handleVolumeChange}
                />
            </div>
        )}
        {message.attachment && !message.imageUrl && (
             <div className="flex items-center gap-2 p-2 my-2 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                {message.attachment.type.startsWith('image/') ? (
                    <img src={message.attachment.dataUrl} alt={message.attachment.name} className="w-12 h-12 rounded object-cover" />
                ) : (
                    <FileTextIcon className="w-6 h-6 text-slate-400 flex-shrink-0" />
                )}
                <div className="truncate">
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate">{message.attachment.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{message.attachment.type}</p>
                </div>
            </div>
        )}

        {(displayedText || (isGenerating && !message.isThinkingLonger)) && (
             <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                    ) : (
                      <code className={className} {...props}>{children}</code>
                    );
                  }
                }}
              >
                {displayedText + (isGenerating && !message.isThinkingLonger ? '▍' : '')}
              </ReactMarkdown>
        )}
        
        {hasFailed && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
            {message.text.includes("couldn't generate an image") && message.originalPrompt ? (
              <>
                <p className="text-sm font-semibold text-red-600 dark:text-red-300 mb-2">Image Generation Failed</p>
                {suggestions.length === 0 && !isLoadingSuggestions && (
                  <button onClick={handleGetSuggestions} className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-500/30">
                    Get Suggestions
                  </button>
                )}
                {isLoadingSuggestions && <p className="text-xs text-slate-500 dark:text-slate-400">Loading suggestions...</p>}
                {suggestions.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300">Try one of these prompts instead:</p>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => onSendMessage(s)} className="block w-full text-left text-xs p-1.5 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
                <button onClick={() => onSendMessage(message.originalPrompt || '', message.attachment)} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200">
                    <RefreshCwIcon className="w-4 h-4" />
                    Regenerate response
                </button>
            )}
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Sources:</h4>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 transition-colors max-w-xs"
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const Avatar = isUser ? (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
          <UserAvatarIcon className="w-8 h-8" />
      </div>
  ) : (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
          <FariAlLogoIcon className="w-8 h-8" />
      </div>
  );

  return (
    <>
      <FullScreenPreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      <ImageShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          imageUrl={message.imageUrl || ''}
          imageTitle={message.imagePrompt || "Generated Image"}
      />
      <div className={`group flex items-start gap-3 w-full animate-fadeInUp ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && Avatar}
        <div className="relative flex flex-col w-fit max-w-[85%] md:max-w-[75%]">
            <div className={`px-4 py-3 rounded-xl shadow-sm ${isUser ? 'bg-pink-600 text-white rounded-br-sm' : 'bg-white dark:bg-[#1C1F26] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5'}`}>
                {renderContent()}
            </div>
            <div className={`relative flex items-center gap-2 mt-1 transition-opacity opacity-0 group-hover:opacity-100 ${isUser ? 'justify-end pr-1' : 'pl-1'}`}>
                {!isUser && !hasFailed && !message.imageUrl && (
                  <>
                    <button onClick={() => setFeedback('like')} className={`p-1 text-slate-400 dark:text-slate-500 transition-transform hover:scale-110 ${feedback === 'like' ? 'text-green-500' : 'hover:text-slate-900 dark:hover:text-white'}`} aria-label="Like response">
                        <ThumbsUpIcon className="w-3.5 h-3.5" />
                    </button>
                     <button onClick={() => setFeedback('dislike')} className={`p-1 text-slate-400 dark:text-slate-500 transition-transform hover:scale-110 ${feedback === 'dislike' ? 'text-red-500' : 'hover:text-slate-900 dark:hover:text-white'}`} aria-label="Dislike response">
                        <ThumbsDownIcon className="w-3.5 h-3.5" />
                    </button>
                    {message.text && !message.videoUrl && renderTTSControls()}
                    {message.text && (
                      <button onClick={handleCopy} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Copy message">
                        {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {message.videoUrl && (
                      <button onClick={() => handleDownload(message.videoUrl!, `fari-video.mp4`)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Download video">
                          <DownloadIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => onRegenerateResponse(message.id)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Regenerate response">
                        <RefreshCwIcon className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {isUser && !isEditing && (
                  <>
                    {message.text && (
                      <button onClick={handleCopy} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Copy message">
                        {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-110" aria-label="Edit message">
                        <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {isUser && message.actionableTask?.title && (
                    <button 
                      onClick={handleAddTaskClick}
                      disabled={taskAdded}
                      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600/80 disabled:bg-green-100 dark:disabled:bg-green-500/30 disabled:text-green-600 dark:disabled:text-green-300 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        {taskAdded ? <><CheckIcon className="w-3 h-3" /> Added</> : <><PlusIcon className="w-3 h-3" /> Add to Tasks</>}
                    </button>
                )}
            </div>
        </div>
        {isUser && Avatar}
      </div>
    </>
  );
};

export default MessageComponent;
