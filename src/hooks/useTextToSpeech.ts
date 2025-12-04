import { useState, useEffect, useCallback, useRef } from 'react';

const stripMarkdown = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/#+\s/g, '');
};

export const useTextToSpeech = () => {
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const volumeRef = useRef(1);
  const speakingStateCheckInterval = useRef<number | null>(null);

  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    handleVoicesChanged();
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
       if (speakingStateCheckInterval.current) {
        clearInterval(speakingStateCheckInterval.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setPlaybackState('idle');
       if (speakingStateCheckInterval.current) {
        clearInterval(speakingStateCheckInterval.current);
      }
    }
  }, []);
  
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = volume;
    if (utteranceRef.current) {
        utteranceRef.current.volume = volume;
    }
  }, []);

  const speak = useCallback((text: string, options?: { voiceName?: string; lang?: string; queue?: boolean; onBoundary?: (event: SpeechSynthesisEvent) => void; onEnd?: () => void; }) => {
    const { voiceName, lang, queue = false, onBoundary, onEnd } = options || {};

    if (!window.speechSynthesis || !text) return;

    if (!queue) {
        if (utteranceRef.current) {
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;
        }
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utteranceRef.current = utterance;

    utterance.volume = volumeRef.current;

    let voiceToUse: SpeechSynthesisVoice | undefined;

    if (voiceName) {
        voiceToUse = voices.find(v => v.name === voiceName);
    } else if (lang) {
        const langVoices = voices.filter(v => v.lang.startsWith(lang));
        if (langVoices.length > 0) {
            voiceToUse = langVoices.find(v => v.default) || langVoices[0];
        }
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }


    utterance.onend = () => {
        onEnd?.();
    };
    
    utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
            console.error(`SpeechSynthesis Error: ${event.error}`, event);
        }
    };
    
    if (onBoundary) utterance.onboundary = onBoundary;

    window.speechSynthesis.speak(utterance);
    setPlaybackState('playing');

    if (speakingStateCheckInterval.current) {
        clearInterval(speakingStateCheckInterval.current);
    }
    speakingStateCheckInterval.current = window.setInterval(() => {
        if (!window.speechSynthesis.speaking) {
            setPlaybackState('idle');
            if (speakingStateCheckInterval.current) {
                clearInterval(speakingStateCheckInterval.current);
            }
        }
    }, 250);

  }, [voices]);


  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && playbackState === 'playing') {
      window.speechSynthesis.pause();
      setPlaybackState('paused');
    }
  }, [playbackState]);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaybackState('playing');
    }
  }, []);


  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { speak, pause, resume, cancel, playbackState, voices, setVolume };
};