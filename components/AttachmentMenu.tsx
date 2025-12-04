import React, { useState } from 'react';
import { 
    FileAttachmentIcon, BrainCircuitIcon, MoreHorizontalIcon,
    PenToolIcon, GoogleDriveIcon, OneDriveIcon, SharePointIcon, ChevronUpIcon, BrushIcon
} from './Icons';
import { ChatModeId } from '../types';

interface AttachmentMenuProps {
    onAddPhotosAndFiles: () => void;
    onClose: () => void;
    onThinkLongerClick: () => void;
    onModeChange: (modeId: ChatModeId) => void;
    onDrawSketchClick: () => void;
}

const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}> = ({ icon, label, onClick, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
        {icon}
        <span>{label}</span>
        {disabled && (
            <span className="text-xs text-slate-500 ml-auto opacity-0 group-hover:opacity-100">
                Coming soon
            </span>
        )}
    </button>
);

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onAddPhotosAndFiles, onClose, onThinkLongerClick, onModeChange, onDrawSketchClick }) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const MainMenu = (
        <>
            <MenuItem 
                icon={<FileAttachmentIcon className="w-5 h-5" />} 
                label="Add photos & files" 
                onClick={() => { onAddPhotosAndFiles(); onClose(); }} 
            />
            <MenuItem 
                icon={<BrushIcon className="w-5 h-5" />} 
                label="Draw a sketch" 
                onClick={onDrawSketchClick}
            />
            <MenuItem 
                icon={<BrainCircuitIcon className="w-5 h-5" />} 
                label="Think longer" 
                onClick={() => { onThinkLongerClick(); onClose(); }} 
            />
            <div className="border-t border-white/10 my-1" />
            <button
                onClick={() => setIsMoreMenuOpen(true)}
                className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-md transition-colors text-slate-300 hover:bg-slate-700/50"
            >
                <div className="flex items-center gap-3">
                    <MoreHorizontalIcon className="w-5 h-5" />
                    <span>More</span>
                </div>
                <ChevronUpIcon className="w-4 h-4 transform -rotate-90" />
            </button>
        </>
    );

    const MoreMenu = (
        <>
            <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-slate-300 hover:bg-slate-700/50 mb-1"
            >
                <ChevronUpIcon className="w-4 h-4 transform rotate-90" />
                <span>Back</span>
            </button>
            <div className="border-t border-white/10 mb-1" />
            <MenuItem 
                icon={<PenToolIcon className="w-5 h-5" />} 
                label="Canvas" 
                onClick={() => { onModeChange('canvas'); onClose(); }}
            />
            <MenuItem 
                icon={<GoogleDriveIcon className="w-5 h-5" />} 
                label="Connect Google Drive" 
                disabled 
            />
            <MenuItem 
                icon={<OneDriveIcon className="w-5 h-5" />} 
                label="Connect OneDrive" 
                disabled 
            />
            <MenuItem 
                icon={<SharePointIcon className="w-5 h-5" />} 
                label="Connect Sharepoint" 
                disabled 
            />
        </>
    );

    return (
        <div className="absolute bottom-full mb-2 w-72 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg p-2 z-20 border border-white/10 animate-fadeInUp">
            {isMoreMenuOpen ? MoreMenu : MainMenu}
        </div>
    );
};

export default AttachmentMenu;