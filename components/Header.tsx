import React from 'react';
import {
    ShareIcon
} from './Icons';
// Fix: Removed unused AvoVersionId import.

interface HeaderProps {
    onMenuClick: () => void;
    onToggleShare: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onToggleShare }) => {

    return (
        <header className="flex-shrink-0 h-10 bg-[#161616] flex items-center px-2 border-b border-white/10" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            {/* Left side: Mobile menu button */}
            <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                 <button onClick={onMenuClick} className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white md:hidden" aria-label="Open menu">
                    N
                </button>
            </div>
            
            {/* Spacer */}
            <div className="flex-1 h-full" />

            {/* Right side: Window Controls removed as per user request */}
        </header>
    );
};

export default Header;