import React, { useState, useEffect, useMemo } from 'react';
import { Message } from '../types';
import { CheckIcon, XIcon, BrainCircuitIcon } from './Icons';

interface ThinkingProgressProps {
    message: Message;
}

const ThinkingProgress: React.FC<ThinkingProgressProps> = ({ message }) => {
    const [progress, setProgress] = useState(0);
    const { thinkLongerConfig, text } = message;
    const timeBudget = thinkLongerConfig?.timeBudget || 30; // Default to 30s

    useEffect(() => {
        if (message.status === 'generating') {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elapsedTime = (Date.now() - startTime) / 1000;
                const newProgress = Math.min((elapsedTime / timeBudget) * 100, 100);
                setProgress(newProgress);
                if (newProgress >= 100) {
                    clearInterval(interval);
                }
            }, 100);

            return () => clearInterval(interval);
        } else if (message.status === 'completed') {
            setProgress(100);
        }
    }, [message.status, timeBudget]);

    const { steps, currentAction } = useMemo(() => {
        const parsedSteps: string[] = [];
        const lines = text.split('\n');
        let action = 'Analyzing...';
        
        lines.forEach(line => {
            if (line.startsWith('[STEP]')) {
                parsedSteps.push(line.replace('[STEP]', '').trim());
            } else if (line.trim().length > 0 && !line.startsWith('**Conclusion:**')) {
                action = line.trim();
            }
        });

        if (message.status === 'completed') {
            action = `Analysis complete. ${parsedSteps.length} steps taken.`;
        }

        return { steps: parsedSteps, currentAction: action };
    }, [text, message.status]);

    const handleCancel = () => {
        // In a real implementation, this would signal an AbortController
        // to stop the streaming request. For now, it's a UI placeholder.
        alert('Canceling long-running tasks is not yet implemented.');
    };

    return (
        <div className="p-4 w-full animate-fadeInUp max-w-full">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BrainCircuitIcon className="w-5 h-5 text-sky-400" />
                    <h3 className="font-semibold text-white">Thinking...</h3>
                </div>
                <button onClick={handleCancel} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-transform hover:scale-110" aria-label="Cancel">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-3">
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                    <div 
                        className="bg-sky-500 h-1.5 rounded-full transition-all duration-500 ease-linear" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-2">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{step}</span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-slate-400 animate-pulse">{currentAction}</p>

        </div>
    );
};

export default ThinkingProgress;