import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Fix: Module '"../types"' has no exported member 'AvoVersionId'. Replaced with FariModelId.
import { Message, ChatMode, FariModelId } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { startChat } from '../services/geminiService';
// Fix: Module '"./Icons"' has no exported member 'PenIcon'. Replaced with PenLineIcon.
import { XIcon, MicIcon, PenLineIcon, SettingsIcon, HeadphonesIcon } from './Icons';
import ChooseVoiceModal from './ChooseVoiceModal';
import type { Chat } from '@google/genai';


interface VoiceModeProps {
  onClose: (conversationHistory: Message[]) => void;
  initialHistory: Message[];
  chatMode: ChatMode;
  // Fix: Renamed prop for consistency.
  fariModelId: FariModelId;
}

const DynamicSphere: React.FC<{ status: 'idle' | 'listening' | 'thinking' | 'speaking' }> = ({ status }) => {
    const sphereStyle: React.CSSProperties = {
        transformStyle: 'preserve-3d',
    };

    return (
        <div className="relative w-[180px] h-[180px] flex items-center justify-center">
            {/* Pulsing glow for listening state */}
            <div className={`absolute w-full h-full rounded-full bg-blue-500/30 transition-all duration-500 ${status === 'listening' ? 'animate-pulse-slow opacity-100 scale-125' : 'opacity-0 scale-100'}`} />
            
            {/* Main Sphere */}
            <div
                className="relative w-[180px] h-[180px] rounded-full overflow-hidden bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl"
                style={sphereStyle}
            >
                {/* Animated Gradient Blobs for thinking/speaking */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${status === 'thinking' || status === 'speaking' ? 'opacity-100' : 'opacity-0'}`}>
                    <div
                        className="absolute w-[200px] h-[200px] bg-gradient-to-br from-cyan-500 to-blue-700 rounded-full opacity-50 filter blur-2xl animate-sphere-spin-1"
                        style={{ top: '-50px', left: '-50px' }}
                    />
                    <div
                        className="absolute w-[150px] h-[150px] bg-gradient-to-br from-purple-600 to-pink-500 rounded-full opacity-40 filter blur-xl animate-sphere-spin-2"
                        style={{ bottom: '-40px', right: '-40px' }}
                    />
                </div>
            </div>
        </div>
    );
};

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose, initialHistory, chatMode, fariModelId }) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastBotResponse, setLastBotResponse] = useState('Hello! How can I help you?');
  const [showMemoryNotification, setShowMemoryNotification] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('chatnlp-selected-voice') || '');
  const [currentLang, setCurrentLang] = useState('en-US');

  const chatSessionRef = useRef<Chat | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const { speak, cancel: cancelTts, playbackState } = useTextToSpeech();

  useEffect(() => {
    chatSessionRef.current = startChat(chatMode.systemInstruction);
  }, [chatMode.systemInstruction]);
  
  const { isListening, transcript, startListening, stopListening, hasSpeechRecognition } = useSpeechRecognition({ 
      continuous: true,
      autoRestart: true,
      lang: currentLang,
  });
  
  const handleLanguageSwitch = (newLang: 'en-US' | 'te-IN') => {
      stopListening();
      setCurrentLang(newLang);
      // The startListening will be triggered by the useEffect that watches currentLang
  };

  const sendTurnToAI = useCallback(async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;

    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    stopListening();
    
    // Handle explicit language switch commands locally
    const lowerTranscript = text.toLowerCase();
    if (currentLang === 'en-US' && lowerTranscript.includes('switch to telugu')) {
        handleLanguageSwitch('te-IN');
        setLastBotResponse('Ok, switching to Telugu.');
        speak('Ok, switching to Telugu.', { lang: 'en-US' });
        return;
    }
    if (currentLang === 'te-IN' && lowerTranscript.includes('switch back to english')) {
        handleLanguageSwitch('en-US');
        setLastBotResponse('సరే, నేను ఇంగ్లీష్ కి మారుతున్నాను.');
        speak('సరే, నేను ఇంగ్లీష్ కి మారుతున్నాను.', { lang: 'te-IN' });
        return;
    }

    setStatus('thinking');
    
    const userMessage: Message = { id: uuidv4(), text: text, sender: 'user', timestamp: new Date().toISOString() };
    setConversation(prev => [...prev, userMessage]);
    setLiveTranscript('');

    try {
        const messageToSend = `[lang=${currentLang}] ${text}`;
        const stream = await chatSessionRef.current.sendMessageStream({ message: messageToSend });
        
        let fullResponse = '';
        let sentenceBuffer = '';
        const sentenceEndings = /[.!?\n]/;
        let responseLang = 'en-US';

        setStatus('speaking'); 
        
        for await (const chunk of stream) {
            let processText = chunk.text;

            if (fullResponse.length === 0 && chunk.text.startsWith('[lang=')) {
                const tagMatch = chunk.text.match(/^\[lang=(en-US|te-IN)\]/);
                if (tagMatch) {
                    responseLang = tagMatch[1];
                    processText = chunk.text.substring(tagMatch[0].length);
                }
            }
            
            fullResponse += chunk.text;
            const cleanFullResponse = fullResponse.replace(/^\[lang=(en-US|te-IN)\]/, '');
            setLastBotResponse(cleanFullResponse);
            sentenceBuffer += processText;
            
            while (sentenceEndings.test(sentenceBuffer)) {
                const match = sentenceBuffer.match(sentenceEndings);
                if (match && match.index !== undefined) {
                    const sentence = sentenceBuffer.substring(0, match.index + 1);
                    sentenceBuffer = sentenceBuffer.substring(match.index + 1);
                    if (sentence.trim()) {
                        const speakOptions: any = { queue: true };
                        if (responseLang === 'te-IN') {
                            speakOptions.lang = 'te-IN';
                        } else {
                            speakOptions.voiceName = selectedVoice;
                        }
                        speak(sentence.trim(), speakOptions);
                    }
                } else {
                    break;
                }
            }
        }
        
        if (sentenceBuffer.trim()) {
            const speakOptions: any = { queue: true };
            if (responseLang === 'te-IN') {
                speakOptions.lang = 'te-IN';
            } else {
                speakOptions.voiceName = selectedVoice;
            }
            speak(sentenceBuffer.trim(), speakOptions);
        }
        
        const cleanFullResponse = fullResponse.replace(/^\[lang=(en-US|te-IN)\]/, '');
        const botMessage: Message = { id: uuidv4(), text: cleanFullResponse, sender: 'bot', timestamp: new Date().toISOString() };
        setConversation(prev => [...prev, botMessage]);
        setShowMemoryNotification(true);
        setTimeout(() => setShowMemoryNotification(false), 2500);

    } catch (error) {
        console.error("Error in voice mode response:", error);
        const errorText = error instanceof Error ? error.message : "Sorry, an error occurred.";
        const errorMessage: Message = { id: uuidv4(), text: errorText, sender: 'bot', timestamp: new Date().toISOString(), status: 'failed' };
        setConversation(prev => [...prev, errorMessage]);
        setLastBotResponse(errorText);
        speak(errorText, { voiceName: selectedVoice });
        setStatus('speaking');
    }
  }, [speak, selectedVoice, stopListening, currentLang]);
  
  // Re-start listening when language changes
  useEffect(() => {
    startListening();
  }, [currentLang, startListening]);

  useEffect(() => {
    if (transcript) {
        setLiveTranscript(transcript);
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = window.setTimeout(() => {
            sendTurnToAI(transcript);
        }, 1200);
    }
  }, [transcript, sendTurnToAI]);

  useEffect(() => {
    if (isListening) {
      setStatus('listening');
      if (playbackState === 'playing' && transcript.length > 0) {
          cancelTts();
      }
    }
  }, [isListening, playbackState, cancelTts, transcript]);
  
  useEffect(() => {
    if (playbackState === 'idle' && status === 'speaking') {
      setStatus('idle');
      if (!isListening) {
        startListening();
      }
    }
  }, [playbackState, status, isListening, startListening]);

  const handleClose = () => {
    stopListening();
    cancelTts();
    onClose(conversation);
  };
  
  return (
    <>
    <ChooseVoiceModal 
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelectVoice={setSelectedVoice}
        currentVoice={selectedVoice}
    />
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-6 md:p-8 animate-fadeInUp">
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900/50" />
       <div className="w-full flex justify-between z-10">
           <div className="flex items-center gap-2 text-sm text-slate-400">
            <HeadphonesIcon className="w-5 h-5" />
            <span>Voice Mode ({currentLang === 'te-IN' ? 'Telugu' : 'English'})</span>
           </div>
           <button onClick={() => setIsVoiceModalOpen(true)} className="p-2 text-slate-400 hover:text-white" aria-label="Change voice">
               <SettingsIcon className="w-5 h-5" />
           </button>
       </div>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl text-center z-10 overflow-hidden">
        <div className="min-h-[120px]">
            <p className="text-3xl md:text-4xl text-white font-medium leading-relaxed">
                {lastBotResponse}
            </p>
            {liveTranscript && (
                 <p className="text-xl md:text-2xl text-slate-400 mt-4 h-8">
                     {liveTranscript}
                 </p>
            )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 z-10 w-full">
         <div className="h-8 transition-opacity duration-300">
            {showMemoryNotification && (
                <div className="flex items-center gap-2 bg-black/30 text-slate-300 text-sm px-3 py-1.5 rounded-full animate-fadeInUp">
                    <PenLineIcon className="w-4 h-4" /> Memory updated
                </div>
            )}
         </div>
         <DynamicSphere status={status} />
         <div className="flex items-center gap-8">
             <button
                onClick={isListening ? stopListening : startListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-600' : 'bg-slate-700/50'}`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
             >
                <MicIcon className="w-7 h-7 text-white" />
             </button>
             <button onClick={handleClose} className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-700/50" aria-label="End voice chat">
                <XIcon className="w-7 h-7 text-white" />
            </button>
         </div>
      </div>
    </div>
    </>
  );
};

export default VoiceMode;