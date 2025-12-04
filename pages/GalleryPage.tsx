import React, { useState, useMemo } from 'react';
import { Chat, Asset, ChatModeId } from '../types';
import { ImageIcon, SearchIcon, PlusIcon, XIcon, VideoIcon } from '../components/Icons';

interface GalleryPageProps {
  chats: Chat[];
  onCreateNewChat: (modeId: ChatModeId) => void;
  onSelectChat: (chatId: string) => void;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ chats, onCreateNewChat, onSelectChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<{ asset: Asset, chatId: string } | null>(null);

  const allAssets = useMemo(() => {
    const assetsWithChatId: { asset: Asset, chatId: string }[] = [];
    chats.forEach(chat => {
      if (chat.assets) {
        chat.assets.forEach(asset => {
          assetsWithChatId.push({ asset, chatId: chat.id });
        });
      }
    });
    return assetsWithChatId.sort((a, b) => new Date(b.asset.timestamp).getTime() - new Date(a.asset.timestamp).getTime());
  }, [chats]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return allAssets;
    const lowerSearch = searchTerm.toLowerCase();
    return allAssets.filter(({ asset }) => asset.prompt.toLowerCase().includes(lowerSearch));
  }, [allAssets, searchTerm]);

  const AssetCard: React.FC<{ item: { asset: Asset, chatId: string } }> = ({ item }) => (
    <div 
      className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer group animate-fadeInUp"
      onClick={() => setSelectedAsset(item)}
    >
      {item.asset.type === 'image' ? (
        <img src={item.asset.url} alt={item.asset.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <>
            <video src={item.asset.url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full">
                <VideoIcon className="w-4 h-4 text-white" />
            </div>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <p className="text-white text-xs line-clamp-2">{item.asset.prompt}</p>
      </div>
    </div>
  );

  const AssetDetailModal: React.FC = () => {
    if (!selectedAsset) return null;
    const { asset, chatId } = selectedAsset;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeInUp" onClick={() => setSelectedAsset(null)}>
        <div className="relative w-full max-w-4xl bg-[#1C1F26] rounded-xl shadow-2xl flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
           <div className="w-full md:w-2/3 h-64 md:h-auto bg-black flex items-center justify-center rounded-t-xl md:rounded-l-xl md:rounded-r-none overflow-hidden">
             {asset.type === 'image' ? (
                <img src={asset.url} alt={asset.prompt} className="max-w-full max-h-full object-contain" />
              ) : (
                <video src={asset.url} controls autoPlay className="max-w-full max-h-full object-contain" />
              )}
           </div>
           <div className="w-full md:w-1/3 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">Asset Details</h3>
              <div className="flex-grow overflow-y-auto mb-4 pr-2">
                <p className="text-sm text-slate-300">{asset.prompt}</p>
              </div>
              <p className="text-xs text-slate-500 mb-4 flex-shrink-0">{new Date(asset.timestamp).toLocaleString()}</p>
              <button 
                onClick={() => {
                  onSelectChat(chatId);
                  setSelectedAsset(null);
                }}
                className="w-full py-2 text-sm text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-shrink-0"
              >
                Go to Chat
              </button>
           </div>
           <button onClick={() => setSelectedAsset(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white z-10">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] text-white">
      {selectedAsset && <AssetDetailModal />}
      <header className="flex-shrink-0 p-4 md:pl-48 pt-16 border-b border-white/10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-orange-400" />
            <h1 className="text-2xl font-bold">My Media</h1>
          </div>
          <button 
            onClick={() => onCreateNewChat('image_creator')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="w-4 h-4" /> Create New
          </button>
        </div>
        <div className="relative">
          <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by prompt..."
            className="w-full bg-[#1c1c1f] border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredAssets.map(item => (
              <AssetCard key={item.asset.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
            <ImageIcon className="w-12 h-12 mb-4" />
            <h2 className="text-lg font-semibold text-slate-400">
              {searchTerm ? 'No Media Found' : 'Your Media Gallery is Empty'}
            </h2>
            <p className="text-sm">
              {searchTerm ? 'Try a different search term.' : 'Images and videos you create will appear here.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GalleryPage;