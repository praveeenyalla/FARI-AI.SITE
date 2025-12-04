import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { 
    XIcon, CameraIcon, UserCircleIcon, SlidersHorizontalIcon, HeadphonesIcon, 
    DatabaseIcon, InfoIcon, TrashIcon, PlayIcon, PauseIcon, SunIcon, MoonIcon, MonitorIcon
} from './Icons';

type Tab = 'profile' | 'preferences' | 'voice' | 'data' | 'about';
type ThemePreference = 'system' | 'light' | 'dark';

const ToggleSwitch: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}> = ({ label, description, enabled, onChange }) => (
  <div
    onClick={onChange}
    className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
    role="switch"
    aria-checked={enabled}
  >
    <div className="flex-grow pr-4">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${enabled ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
      <span
        className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  </div>
);


const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  const { themePreference, setThemePreference } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // State for Profile Tab
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Voice Tab
  const [autoSend, setAutoSend] = useState(() => JSON.parse(localStorage.getItem('chatnlp-autosend') || 'false'));
  const [autoTTS, setAutoTTS] = useState(() => JSON.parse(localStorage.getItem('chatnlp-autotts') || 'false'));
  const { voices, speak, cancel, playbackState } = useTextToSpeech();
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('chatnlp-selected-voice') || '');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  // State for Preferences Tab
  const [saveHistory, setSaveHistory] = useState(() => JSON.parse(localStorage.getItem('chatnlp-save-history') ?? 'true'));

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [user, isOpen]);
  
  useEffect(() => {
    if (voices.length > 0 && !selectedVoice) {
        const defaultVoice = voices.find(v => v.default) || voices[0];
        if (defaultVoice) {
            setSelectedVoice(defaultVoice.name);
            localStorage.setItem('chatnlp-selected-voice', defaultVoice.name);
        }
    }
  }, [voices, selectedVoice]);

  useEffect(() => {
    if (playbackState === 'idle') {
        setPreviewingVoice(null);
    }
  }, [playbackState]);

  useEffect(() => {
      if (!isOpen) {
          cancel();
      }
  }, [isOpen, cancel]);


  if (!isOpen || !user) {
    return null;
  }
  
  const handleAutoSendToggle = () => {
    const newValue = !autoSend;
    setAutoSend(newValue);
    localStorage.setItem('chatnlp-autosend', JSON.stringify(newValue));
  };

  const handleAutoTTSToggle = () => {
    const newValue = !autoTTS;
    setAutoTTS(newValue);
    localStorage.setItem('chatnlp-autotts', JSON.stringify(newValue));
  };
  
  const handleSaveHistoryToggle = () => {
      const newValue = !saveHistory;
      setSaveHistory(newValue);
      localStorage.setItem('chatnlp-save-history', JSON.stringify(newValue));
      if (!newValue) {
          alert("Chat history will no longer be saved to this browser after your session ends. Existing history will remain until cleared.");
      }
  };
  
  const handleClearHistory = () => {
      if (window.confirm("Are you sure you want to permanently delete all your chat history from this browser? This action cannot be undone.")) {
          localStorage.removeItem('chatnlp_chats');
          localStorage.removeItem('chatnlp_activeChatId');
          localStorage.removeItem('avomind_deleted_chats');
          window.location.reload();
      }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    login({ name, avatar });
    onClose();
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    localStorage.setItem('chatnlp-selected-voice', voiceName);
  };

  const handlePreviewVoice = (voiceName: string) => {
    if (playbackState === 'playing' && previewingVoice === voiceName) {
        cancel();
        setPreviewingVoice(null);
    } else {
        setPreviewingVoice(voiceName);
        speak('Hello, I am a voice assistant from FARI-AI.', { voiceName });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-24 h-24 text-slate-400 dark:text-slate-500" />
                )}
                <button
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change avatar"
                >
                  <CameraIcon className="w-8 h-8 text-white" />
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.plan}</p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-[#101216] border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter your display name"
              />
            </div>
          </div>
        );
      case 'preferences':
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 px-1">Appearance</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setThemePreference('light')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreference === 'light' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-white/10 hover:border-pink-300 dark:hover:border-white/20'}`}
                        >
                            <SunIcon className={`w-6 h-6 ${themePreference === 'light' ? 'text-pink-500' : 'text-slate-400'}`} />
                            <span className={`text-xs font-medium ${themePreference === 'light' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Light</span>
                        </button>
                        <button
                            onClick={() => setThemePreference('dark')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreference === 'dark' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-white/10 hover:border-pink-300 dark:hover:border-white/20'}`}
                        >
                            <MoonIcon className={`w-6 h-6 ${themePreference === 'dark' ? 'text-pink-500' : 'text-slate-400'}`} />
                            <span className={`text-xs font-medium ${themePreference === 'dark' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Dark</span>
                        </button>
                        <button
                            onClick={() => setThemePreference('system')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreference === 'system' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-white/10 hover:border-pink-300 dark:hover:border-white/20'}`}
                        >
                            <MonitorIcon className={`w-6 h-6 ${themePreference === 'system' ? 'text-pink-500' : 'text-slate-400'}`} />
                            <span className={`text-xs font-medium ${themePreference === 'system' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>System</span>
                        </button>
                    </div>
                </div>
                
                <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 px-1">Privacy & History</h3>
                    <ToggleSwitch 
                        label="Save chat history"
                        description="Store your conversations in this browser for future sessions."
                        enabled={saveHistory}
                        onChange={handleSaveHistoryToggle}
                    />
                </div>
            </div>
        );
      case 'voice':
        return (
          <div className="space-y-2">
             <ToggleSwitch 
                label="Auto-send after transcription"
                description="In Voice Mode, send your message after you finish speaking."
                enabled={autoSend}
                onChange={handleAutoSendToggle}
              />
              <ToggleSwitch 
                label="Enable AI Voice Replies (Talk Back)"
                description="Automatically read AI responses aloud as they arrive."
                enabled={autoTTS}
                onChange={handleAutoTTSToggle}
              />
              <div className="border-t border-slate-200 dark:border-white/10 pt-4 mt-2">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 px-3 mb-2">Voice Selection</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {voices.map(voice => (
                          <div key={voice.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                              <label className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden">
                                  <input
                                      type="radio"
                                      name="voice-selection"
                                      checked={selectedVoice === voice.name}
                                      onChange={() => handleVoiceChange(voice.name)}
                                      className="form-radio h-4 w-4 bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-pink-500 focus:ring-pink-600"
                                  />
                                  <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{voice.name} ({voice.lang})</span>
                              </label>
                              <button onClick={() => handlePreviewVoice(voice.name)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white" aria-label={`Preview ${voice.name}`}>
                                { (playbackState === 'playing' && previewingVoice === voice.name) ? <PauseIcon className="w-4 h-4 text-sky-500" /> : <PlayIcon className="w-4 h-4" /> }
                              </button>
                          </div>
                      ))}
                      {voices.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No English voices were found in your browser.</p>}
                  </div>
              </div>
          </div>
        );
      case 'data':
        return (
            <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Manage Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Control how your application data is stored and managed in this browser.
                </p>
                <button
                    onClick={handleClearHistory}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                    <TrashIcon className="w-4 h-4" />
                    Clear All Chat History
                </button>
            </div>
        );
      case 'about':
        return (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">FARI-AI</h3>
                <p>Version 1.0.0</p>
                <p>Your next-generation AI assistant.</p>
                <p className="mt-4">&copy; {new Date().getFullYear()} FARI-AI. All Rights Reserved.</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeInUp" onClick={onClose}>
      <div className="relative w-full max-w-4xl h-[80vh] max-h-[700px] bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl flex overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="w-1/4 h-full bg-slate-50 dark:bg-black/20 border-r border-slate-200 dark:border-white/10 p-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>
          <nav className="space-y-2">
            {(['profile', 'preferences', 'voice', 'data', 'about'] as Tab[]).map(tab => {
              const icons = {
                profile: <UserCircleIcon className="w-5 h-5" />,
                preferences: <SlidersHorizontalIcon className="w-5 h-5" />,
                voice: <HeadphonesIcon className="w-5 h-5" />,
                data: <DatabaseIcon className="w-5 h-5" />,
                about: <InfoIcon className="w-5 h-5" />,
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === tab ? 'bg-pink-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                >
                  {icons[tab]}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="w-3/4 h-full flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
          <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-all">
              Save Changes
            </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white" aria-label="Close modal">
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;