
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, NeighborConnection, ChatMessage, Block } from '../types';

interface NeighborsProps {
    currentUser: User;
    users: User[];
    blocks: Block[];
    connections: NeighborConnection[];
    messages: ChatMessage[];
    onSendRequest: (requesterId: number, receiverId: number) => void;
    onUpdateStatus: (connectionId: number, status: 'accepted' | 'rejected') => void;
    onSendMessage: (senderId: number, receiverId: number, content: string, fileData?: {url: string, name: string, type: string}) => void;
    onMarkAsRead: (senderId: number) => void;
    onDeleteConnection?: (connectionId: number) => void;
}

const Neighbors: React.FC<NeighborsProps> = (props) => {
    const { currentUser, users, blocks, connections, messages, onSendRequest, onUpdateStatus, onSendMessage, onMarkAsRead, onDeleteConnection } = props;
    const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'discover'>('chats');
    const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [discoverSearch, setDiscoverSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<{url: string, name: string, type: string} | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom logic: Only scroll if near bottom or initial load
    useEffect(() => {
        if (!selectedFriendId) return;

        const container = chatContainerRef.current;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            
            if (isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        } else {
             messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
        
        onMarkAsRead(selectedFriendId);
    }, [messages, selectedFriendId, onMarkAsRead]);

    // Initial scroll on chat open
    useEffect(() => {
        if(selectedFriendId) {
             setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 50);
        }
    }, [selectedFriendId]);

    const getUser = (id: number) => users.find(u => u.id === id);

    const getApartmentInfo = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) {
                return `${block.name} - Daire: ${apt.number}`;
            }
        }
        return 'Konum Belirtilmemiş';
    };

    const myNeighbors = useMemo(() => {
        return connections
            .filter(c => c.status === 'accepted' && (c.requesterId === currentUser.id || c.receiverId === currentUser.id))
            .map(c => {
                const friendId = c.requesterId === currentUser.id ? c.receiverId : c.requesterId;
                return getUser(friendId);
            })
            .filter((u): u is User => !!u);
    }, [connections, currentUser, users]);

    const incomingRequests = useMemo(() => {
        return connections.filter(c => c.receiverId === currentUser.id && c.status === 'pending');
    }, [connections, currentUser]);

    const outgoingRequests = useMemo(() => {
        return connections.filter(c => c.requesterId === currentUser.id && c.status === 'pending');
    }, [connections, currentUser]);

    const discoverableUsers = useMemo(() => {
        const involvedIds = new Set(
            connections
                .filter(c => (c.requesterId === currentUser.id || c.receiverId === currentUser.id) && c.status !== 'rejected')
                .flatMap(c => [c.requesterId, c.receiverId])
        );
        involvedIds.add(currentUser.id);
        
        let filtered = users.filter(u => !involvedIds.has(u.id) && u.role !== 'Yönetici' && u.isActive);
        
        if (discoverSearch.trim()) {
            const term = discoverSearch.toLocaleLowerCase('tr-TR');
            filtered = filtered.filter(u => u.name.toLocaleLowerCase('tr-TR').includes(term));
        }
        
        return filtered;
    }, [users, connections, currentUser, discoverSearch]);

    const activeChatMessages = useMemo(() => {
        if (!selectedFriendId) return [];
        return messages
            .filter(m => 
                (m.senderId === currentUser.id && m.receiverId === selectedFriendId) ||
                (m.senderId === selectedFriendId && m.receiverId === currentUser.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUser, selectedFriendId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 800 * 1024) {
            alert("Dosya boyutu çok büyük (Maksimum 800KB)");
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setSelectedFile({
                    url: event.target.result as string,
                    name: file.name,
                    type: file.type
                });
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFriendId) return;
        if (!messageInput.trim() && !selectedFile) return;

        onSendMessage(currentUser.id, selectedFriendId, messageInput.trim(), selectedFile || undefined);
        setMessageInput('');
        setSelectedFile(null);
        // Force scroll to bottom on send
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    const renderSidebar = () => (
        <div className={`w-full md:w-[380px] bg-white flex flex-col h-full border-r border-gray-100 ${selectedFriendId ? 'hidden md:flex' : 'flex'}`}>
            <div className="px-4 pt-6 pb-2">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Mesajlar</h2>
                <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('chats')} 
                        className={`flex-1 flex items-center justify-center py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${activeTab === 'chats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Komşular
                    </button>
                    <button 
                        onClick={() => setActiveTab('requests')} 
                        className={`flex-1 flex items-center justify-center py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all relative ${activeTab === 'requests' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        İstekler
                        {incomingRequests.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] rounded-full">{incomingRequests.length}</span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('discover')} 
                        className={`flex-1 flex items-center justify-center py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${activeTab === 'discover' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Keşfet
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-2">
                {activeTab === 'chats' && (
                    myNeighbors.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {myNeighbors.map(friend => {
                                const chatMsgs = messages.filter(m => (m.senderId === currentUser.id && m.receiverId === friend.id) || (m.senderId === friend.id && m.receiverId === currentUser.id));
                                const sortedMsgs = chatMsgs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                                const lastMsg = sortedMsgs[0];
                                const unreadCount = chatMsgs.filter(m => m.receiverId === currentUser.id && !m.read).length;
                                
                                const connectionId = connections.find(c => 
                                    (c.requesterId === currentUser.id && c.receiverId === friend.id) ||
                                    (c.requesterId === friend.id && c.receiverId === currentUser.id)
                                )?.id;

                                return (
                                    <div 
                                        key={friend.id} 
                                        onClick={() => setSelectedFriendId(friend.id)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center group transition-all border-l-4 relative ${selectedFriendId === friend.id ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent'}`}
                                    >
                                        <div className="relative">
                                            <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                                                {getInitials(friend.name)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="ml-4 overflow-hidden flex-1">
                                            <div className="flex justify-between items-baseline">
                                                <p className="font-black text-gray-800 text-[15px] truncate uppercase tracking-tight">{friend.name}</p>
                                                {lastMsg && <span className="text-[10px] text-gray-400 font-bold">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest truncate flex-1">{getApartmentInfo(friend.id)}</p>
                                                {unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-md ml-2 shrink-0">{unreadCount}</span>
                                                )}
                                            </div>
                                            {lastMsg && (
                                                <p className={`text-xs truncate mt-1 ${unreadCount > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                                                    {lastMsg.senderId === currentUser.id ? 'Siz: ' : ''}
                                                    {lastMsg.fileUrl ? (lastMsg.fileType?.startsWith('image/') ? '🖼️ Fotoğraf' : '📎 Dosya') : lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                        {connectionId && onDeleteConnection && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm(`${friend.name} kişisini komşu listenizden çıkarmak istediğinize emin misiniz?`)) {
                                                        onDeleteConnection(connectionId);
                                                        if (selectedFriendId === friend.id) setSelectedFriendId(null);
                                                    }
                                                }}
                                                className="absolute bottom-2 right-2 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                title="Komşuyu Sil"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center h-full flex flex-col justify-center items-center">
                            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Sohbet Yok</p>
                            <button onClick={() => setActiveTab('discover')} className="mt-4 text-indigo-600 text-xs font-black uppercase hover:underline">Komşu Bul</button>
                        </div>
                    )
                )}

                {activeTab === 'requests' && (
                    <div className="p-2 space-y-4">
                        {incomingRequests.length > 0 && (
                            <div>
                                <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Gelen Talepler</h4>
                                <div className="space-y-2">
                                    {incomingRequests.map(req => {
                                        const sender = getUser(req.requesterId);
                                        if (!sender) return null;
                                        return (
                                            <div key={req.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mx-2 animate-in slide-in-from-left-2 duration-300">
                                                <div className="flex items-center mb-4">
                                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                                        {getInitials(sender.name)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{sender.name}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{getApartmentInfo(sender.id)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => onUpdateStatus(req.id, 'accepted')} className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Onayla</button>
                                                    <button onClick={() => onUpdateStatus(req.id, 'rejected')} className="flex-1 py-2 bg-gray-50 text-gray-500 text-[10px] font-black uppercase rounded-xl hover:bg-gray-100">Reddet</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {outgoingRequests.length > 0 && (
                            <div className="mt-6">
                                <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Bekleyen İsteklerim</h4>
                                {outgoingRequests.map(req => {
                                    const rcv = getUser(req.receiverId);
                                    if (!rcv) return null;
                                    return (
                                        <div key={req.id} className="flex items-center p-4 hover:bg-gray-50 transition-all relative group">
                                            <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center font-black text-xs">
                                                {getInitials(rcv.name)}
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <p className="text-xs font-black text-gray-800 uppercase">{rcv.name}</p>
                                                <p className="text-[10px] text-amber-500 font-bold">Onay Bekleniyor...</p>
                                            </div>
                                            {onDeleteConnection && (
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('İsteği iptal etmek istediğinize emin misiniz?')) {
                                                            onDeleteConnection(req.id);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="İsteği İptal Et"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                            <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase tracking-widest italic">İstek bulunmuyor</div>
                        )}
                    </div>
                )}

                {activeTab === 'discover' && (
                    <div className="p-2 space-y-4">
                        <div className="px-2">
                            <div className="relative group">
                                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input 
                                    type="text" 
                                    value={discoverSearch}
                                    onChange={(e) => setDiscoverSearch(e.target.value)}
                                    placeholder="Komşu ara..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-xs"
                                />
                            </div>
                        </div>

                        {discoverableUsers.length > 0 ? (
                            <div className="space-y-1">
                                {discoverableUsers.map(user => (
                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-all">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center font-black">
                                                {getInitials(user.name)}
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{user.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{getApartmentInfo(user.id)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onSendRequest(currentUser.id, user.id)}
                                            className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase italic">
                                {discoverSearch ? 'Eşleşen komşu bulunamadı' : 'Keşfedilecek yeni kimse yok'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderChatWindow = () => {
        if (!selectedFriendId) {
            return (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 h-full rounded-r-3xl border-b border-gray-100">
                    <div className="text-center">
                        <div className="h-24 w-24 bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Sohbet Başlatın</h3>
                        <p className="text-[10px] text-gray-300 font-bold uppercase mt-2">Bir komşu seçerek mesajlaşmaya başlayın</p>
                    </div>
                </div>
            );
        }

        const friend = getUser(selectedFriendId);

        return (
            <div className="flex-1 flex flex-col h-full bg-white relative animate-in fade-in duration-300">
                <div className="bg-white px-4 py-3 md:py-4 border-b border-gray-50 flex items-center justify-between shadow-sm sticky top-0 z-20">
                    <div className="flex items-center">
                        <button className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden" onClick={() => setSelectedFriendId(null)}>
                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm md:text-lg shadow-lg">
                            {friend ? getInitials(friend.name) : '?'}
                        </div>
                        <div className="ml-4">
                            <p className="text-sm md:text-base font-black text-gray-800 uppercase tracking-tight">{friend?.name}</p>
                            <p className="text-[9px] md:text-[10px] text-green-500 font-black uppercase tracking-widest">Çevrimiçi</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedFriendId(null)}
                        className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Sohbetten Çık"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5] bg-opacity-30">
                    {activeChatMessages.map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-1 duration-200`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                                    {msg.fileUrl && (
                                        <div className="mb-2">
                                            {msg.fileType?.startsWith('image/') ? (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl bg-black/5">
                                                    <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full h-auto max-h-60 object-cover hover:scale-105 transition-transform" />
                                                </a>
                                            ) : (
                                                <a href={msg.fileUrl} download={msg.fileName} className={`flex items-center p-3 rounded-xl gap-3 ${isMe ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-indigo-600'} hover:opacity-90 transition-opacity`}>
                                                    <div className="p-2 rounded-lg bg-white/20">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-black uppercase truncate">{msg.fileName}</p>
                                                        <p className="text-[9px] opacity-70 font-bold">İndirmek için tıklayın</p>
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {msg.content && <p className="leading-relaxed font-medium">{msg.content}</p>}
                                    <div className="flex justify-end items-center mt-1 space-x-1">
                                        <span className={`text-[8px] font-black uppercase ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {selectedFile && (
                    <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3">
                            {selectedFile.type.startsWith('image/') ? (
                                <img src={selectedFile.url} className="h-12 w-12 rounded-lg object-cover border-2 border-white shadow-sm" alt="Önizleme" />
                            ) : (
                                <div className="h-12 w-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-black text-indigo-900 uppercase truncate max-w-[200px]">{selectedFile.name}</p>
                                <p className="text-[9px] text-indigo-400 font-bold uppercase">Dosya Eklendi</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="p-2 text-indigo-400 hover:text-rose-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                <div className="bg-white p-3 md:p-4 border-t border-gray-50">
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                        <div className="flex-1 bg-gray-50 rounded-[1.5rem] border border-gray-200 px-4 py-2 flex items-end">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`p-1.5 transition-colors ${selectedFile ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </button>
                            <textarea 
                                rows={1}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-bold text-gray-700 placeholder:font-medium placeholder:text-gray-400 resize-none max-h-32 px-2"
                                placeholder={isUploading ? "Dosya hazırlanıyor..." : "Mesaj yazın..."}
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                                disabled={isUploading}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isUploading || (!messageInput.trim() && !selectedFile)}
                            className="h-12 w-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 shadow-lg disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
                        >
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex h-[calc(100vh-160px)] md:h-[650px] border border-gray-50 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
            {renderSidebar()}
            {renderChatWindow()}
        </div>
    );
};

export default Neighbors;
