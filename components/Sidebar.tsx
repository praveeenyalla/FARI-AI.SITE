import React, { useState, useMemo, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  SunIcon, MoonIcon, PlusIcon, UserCircleIcon, LogoutIcon, TrashIcon, 
  PencilIcon, FolderIcon, ImageIcon, MessageSquareIcon, VideoIcon, GlobeIcon,
  PenToolIcon, DownloadIcon, HeadphonesIcon, FileTextIcon, ClipboardListIcon, HistoryIcon, BrushIcon, SettingsIcon, GridIcon, MenuIcon, SparklesIcon, FariAlLogoIcon, ArrowLeftToLineIcon, ArrowRightToLineIcon
} from './Icons';
import { Chat, ChatMode, ChatModeId, MainView, FariModelId } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CHAT_MODES, SIDEBAR_ASSISTANT_IDS } from '../constants';
import VersionSelector from './VersionSelector';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  onDeleteChat: (id: string) => void;
  isCollapsed: boolean;
  onCreateNewChat: (modeId?: ChatModeId) => void;
  onCreateDocumentChat: (file: { name: string; type: string; content: string; dataUrl: string; }) => void;
  mainView: MainView;
  setMainView: (view: MainView) => void;
  onToggleVoiceMode: () => void;
  onToggleSettings: () => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    isCollapsed: boolean;
    onClick?: () => void;
    href?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, isCollapsed, onClick, href }) => {
    const commonClasses = `group relative w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
        isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
    }`;

    const content = (
        <>
            <div className="flex-shrink-0">{icon}</div>
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {label}
                </div>
            )}
        </>
    );
    
    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={commonClasses}>
                {content}
            </a>
        );
    }

    return (
        <button onClick={onClick} className={commonClasses}>
            {content}
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, setActiveChatId, onDeleteChat, isCollapsed, onCreateNewChat, onCreateDocumentChat, mainView, setMainView, onToggleSettings }) => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNewChat = (modeId?: ChatModeId) => {
    onCreateNewChat(modeId);
    setMainView('chat');
  };
  
  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to move this chat to the trash?')) {
      onDeleteChat(chatId);
    }
  };
  
  const handleExportChat = (e: React.MouseEvent, chatId: string) => {
      e.stopPropagation();
      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      const title = chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const formattedContent = chat.messages
          .map(msg => {
              let content = `**${msg.sender === 'user' ? (user?.name || 'You') : 'FARI'}** (${new Date(msg.timestamp).toLocaleString()}):\n\n`;
              if (msg.text) content += `${msg.text}\n\n`;
              if (msg.imageUrl) content += `![Generated Image](${msg.imageUrl})\n\n`;
              if (msg.videoUrl) content += `[Generated Video](${msg.videoUrl})\n\n`;
              if (msg.attachment) content += `[Attachment: ${msg.attachment.name}]\n\n`;
              if (msg.sources) {
                  content += 'Sources:\n';
                  msg.sources.forEach(source => {
                      content += `- [${source.title}](${source.uri})\n`;
                  });
                  content += '\n';
              }
              return content;
          })
          .join('---\n\n');
      
      const blob = new Blob([formattedContent], { type: 'text/markdown;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fari_${title}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const groupChatsByDate = useMemo(() => {
    const groups: { [key: string]: typeof chats } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    chats.forEach(chat => {
      if (chat.messages.length === 0 && !chat.canvasState && !chat.attachedFile) return;
      const chatDate = new Date(chat.messages[0]?.timestamp || chat.id.split('-')[0]); // Fallback for empty chats
      let key;

      if (chatDate.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = chatDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(chat);
    });
    return groups;
  }, [chats]);
  
  const mainNavItems: ({
      id: string;
      icon: React.ReactNode;
      label: string;
      view: MainView;
      href?: undefined;
  } | {
      id: string;
      icon: React.ReactNode;
      label: string;
      view?: undefined;
      href: string;
  })[] = [
    { id: 'chat', icon: <MessageSquareIcon className="w-5 h-5"/>, label: 'Chats', view: 'chat' },
    { id: 'auro-creator', icon: <SparklesIcon className="w-5 h-5 text-yellow-400"/>, label: 'Auro Creator', href: 'https://auro.fari-ai.site' },
    { id: 'fari-gen', icon: <GlobeIcon className="w-5 h-5 text-green-400"/>, label: 'Fari Gen 4.2', href: 'https://fari-gen.fari-ai.site' },
    { id: 'tools', icon: <GridIcon className="w-5 h-5"/>, label: 'Explore', view: 'tools' },
    { id: 'my-media', icon: <ImageIcon className="w-5 h-5"/>, label: 'My Media', view: 'my-media' },
    { id: 'tasks', icon: <ClipboardListIcon className="w-5 h-5"/>, label: 'Tasks', view: 'tasks' },
    { id: 'history', icon: <HistoryIcon className="w-5 h-5"/>, label: 'History', view: 'history' },
  ];

  return (
    <>
      <aside className="w-full flex-shrink-0 bg-[#0A0A0A]/80 backdrop-blur-lg text-white flex flex-col p-3 h-full overflow-hidden">
        {/* Top section */}
        <div className="flex-shrink-0">
           <div className="flex items-center justify-between mb-2 h-[48px]">
                {!isCollapsed ? (
                    <div className="flex items-center gap-3">
                        <FariAlLogoIcon className="w-7 h-7" />
                        <span className="text-2xl font-bold font-['Michroma',_sans_serif]">FARI</span>
                    </div>
                ) : (
                    <div className="flex justify-center w-full">
                        <FariAlLogoIcon className="w-8 h-8" />
                    </div>
                )}
            </div>

          <button onClick={() => handleCreateNewChat()} className="w-full flex items-center justify-center gap-2 button-gradient-animated text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105">
            <PlusIcon className="w-5 h-5" />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>New Chat</span>
          </button>
        </div>
        
        {/* Scrollable Middle Section */}
        <div className="flex-1 overflow-y-auto my-4 pr-2">
            <div className="space-y-6">
              {/* Main Navigation */}
              <nav className={`space-y-2 flex-shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                  {mainNavItems.map(item => (
                    <NavItem 
                        key={item.id} 
                        icon={item.icon} 
                        label={item.label} 
                        isActive={item.view ? mainView === item.view : false} 
                        isCollapsed={isCollapsed} 
                        onClick={item.view ? () => setMainView(item.view) : undefined}
                        href={item.href}
                    />
                  ))}
              </nav>
              
              <div className={`flex-1 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <div className="space-y-4">
                    {Object.entries(groupChatsByDate).map(([groupTitle, chatsInGroup]) => (
                    <div key={groupTitle}>
                        <h2 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">{groupTitle}</h2>
                        <ul className="space-y-1">
                        {/* Fix: Cast `chatsInGroup` to `Chat[]` to resolve the "Property 'map' does not exist on type 'unknown'" error. This helps TypeScript understand the data structure when iterating. */}
                        {(chatsInGroup as Chat[]).map(chat => (
                            <li key={chat.id} className="group flex items-center justify-between rounded-lg hover:bg-white/5 transition-transform hover:scale-[1.02]">
                            <button
                                onClick={() => setActiveChatId(chat.id)}
                                className={`flex-1 flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg truncate ${
                                activeChatId === chat.id
                                    ? 'bg-white/10'
                                    : ''
                                }`}
                            >
                                {chat.mode.icon({className: "w-4 h-4 text-slate-400 flex-shrink-0"})}
                                {chat.title}
                            </button>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => handleExportChat(e, chat.id)}
                                    className="p-2 text-slate-500 hover:text-sky-400 transition-all hover:scale-110"
                                    aria-label="Export chat as markdown"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, chat.id)}
                                    className="p-2 text-slate-500 hover:text-red-500 transition-all hover:scale-110"
                                    aria-label="Delete chat"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            </li>
                        ))}
                        </ul>
                    </div>
                    ))}
                </div>
              </div>
            </div>
        </div>

        {/* Bottom section (user profile) */}
        <div className="flex-shrink-0 border-t border-white/20 pt-4 mt-auto">
            <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                 <div className="flex-1 min-w-0 flex items-center gap-2">
                     {user?.avatar ? (
                        <img src={user.avatar} alt="User avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <UserCircleIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    )}
                    {!isCollapsed && user && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.plan}</p>
                        </div>
                    )}
                 </div>
                 <div className={`flex items-center gap-1 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <button onClick={onToggleSettings} className="p-1 rounded-full hover:bg-white/20 transition-transform hover:scale-110" aria-label="Settings">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button onClick={logout} className="p-1 rounded-full hover:bg-white/20 transition-transform hover:scale-110" aria-label="Log out">
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;