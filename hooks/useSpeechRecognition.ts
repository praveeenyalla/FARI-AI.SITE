import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Add type definitions for the Web Speech API to resolve compilation errors.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface UseSpeechRecognitionOptions {
  onEnd?: (result: { transcript: string; confidence: number }) => void;
  continuous?: boolean;
  autoRestart?: boolean; 
  lang?: string; // Added language option
}


export const useSpeechRecognition = (options?: UseSpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isStoppingManually = useRef(false); 

  const onEndRef = useRef(options?.onEnd);
  useEffect(() => {
    onEndRef.current = options?.onEnd;
  }, [options?.onEnd]);

  const finalTranscriptRef = useRef('');
  const finalConfidenceRef = useRef(0);


  useEffect(() => {
    // Fix: Use `window as any` to access browser-specific, non-standard properties.
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionConstructor | undefined;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    recognition.continuous = options?.continuous ?? false;
    recognition.interimResults = true;
    recognition.lang = options?.lang || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript(''); 
      finalTranscriptRef.current = '';
      finalConfidenceRef.current = 0;
    };

    recognition.onend = () => {
      setIsListening(false);
      onEndRef.current?.({
        transcript: finalTranscriptRef.current,
        confidence: finalConfidenceRef.current,
      });

      if (options?.autoRestart && !isStoppingManually.current) {
        try {
            setTimeout(() => recognition.start(), 100);
        } catch(e) {
            console.error("Error restarting speech recognition:", e);
        }
      }
      isStoppingManually.current = false;
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';
      let lastFinalConfidence = 0;
      
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            lastFinalConfidence = event.results[i][0].confidence;
        }
      }
      setTranscript(fullTranscript);
      finalTranscriptRef.current = fullTranscript;
      if (lastFinalConfidence > 0) {
        finalConfidenceRef.current = lastFinalConfidence;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isStoppingManually.current = true;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
    };
  }, [options?.continuous, options?.autoRestart, options?.lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); 
      isStoppingManually.current = false; 
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isStoppingManually.current = true; 
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasSpeechRecognition: !!recognitionRef.current,
  };
};
