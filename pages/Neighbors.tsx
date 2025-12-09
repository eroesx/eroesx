
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
    onSendMessage: (senderId: number, receiverId: number, content: string) => void;
}

const Neighbors: React.FC<NeighborsProps> = (props) => {
    const { currentUser, users, blocks, connections, messages, onSendRequest, onUpdateStatus, onSendMessage } = props;
    const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'discover'>('chats');
    const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedFriendId, activeTab]);

    // Helper: Get user details by ID
    const getUser = (id: number) => users.find(u => u.id === id);

    // Helper: Get Apartment info
    const getApartmentInfo = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) {
                return `${block.name} - No: ${apt.number}`;
            }
        }
        return '';
    };

    // 1. DATA FILTERING
    
    // My Friends (Accepted connections)
    const myFriends = useMemo(() => {
        return connections
            .filter(c => c.status === 'accepted' && (c.requesterId === currentUser.id || c.receiverId === currentUser.id))
            .map(c => {
                const friendId = c.requesterId === currentUser.id ? c.receiverId : c.requesterId;
                return getUser(friendId);
            })
            .filter((u): u is User => !!u);
    }, [connections, currentUser, users]);

    // Incoming Requests
    const incomingRequests = useMemo(() => {
        return connections.filter(c => c.receiverId === currentUser.id && c.status === 'pending');
    }, [connections, currentUser]);

    // Discoverable Users (Not me, not friends, not pending)
    const discoverableUsers = useMemo(() => {
        const involvedIds = new Set(
            connections
                .filter(c => c.requesterId === currentUser.id || c.receiverId === currentUser.id)
                .flatMap(c => [c.requesterId, c.receiverId])
        );
        involvedIds.add(currentUser.id); // Add self to exclusion list

        return users.filter(u => !involvedIds.has(u.id) && u.role !== 'Yönetici'); // Exclude admins if preferred, or keep them. Let's hide admins from "Neighbors" list usually.
    }, [users, connections, currentUser]);

    // Active Chat Messages
    const activeChatMessages = useMemo(() => {
        if (!selectedFriendId) return [];
        return messages
            .filter(m => 
                (m.senderId === currentUser.id && m.receiverId === selectedFriendId) ||
                (m.senderId === selectedFriendId && m.receiverId === currentUser.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUser, selectedFriendId]);


    // HANDLERS
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFriendId || !messageInput.trim()) return;
        onSendMessage(currentUser.id, selectedFriendId, messageInput.trim());
        setMessageInput('');
    };

    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    // RENDERERS
    
    // Left Sidebar: Tab Navigation
    const renderSidebar = () => (
        <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col h-[600px]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('chats')} 
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'chats' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Sohbetler
                </button>
                <button 
                    onClick={() => setActiveTab('requests')} 
                    className={`flex-1 py-3 text-sm font-medium relative ${activeTab === 'requests' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    İstekler
                    {incomingRequests.length > 0 && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('discover')} 
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'discover' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Komşu Bul
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
                {/* CHATS LIST */}
                {activeTab === 'chats' && (
                    myFriends.length > 0 ? (
                        <ul>
                            {myFriends.map(friend => (
                                <li 
                                    key={friend.id} 
                                    onClick={() => setSelectedFriendId(friend.id)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 flex items-center ${selectedFriendId === friend.id ? 'bg-indigo-50' : ''}`}
                                >
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                                        {getInitials(friend.name)}
                                    </div>
                                    <div className="ml-3 overflow-hidden">
                                        <p className="font-semibold text-gray-800 truncate">{friend.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{getApartmentInfo(friend.id)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                            <p>Henüz sohbetiniz yok. "Komşu Bul" sekmesinden komşularınızı ekleyin.</p>
                        </div>
                    )
                )}

                {/* REQUESTS LIST */}
                {activeTab === 'requests' && (
                    incomingRequests.length > 0 ? (
                        <ul>
                            {incomingRequests.map(req => {
                                const requester = getUser(req.requesterId);
                                if (!requester) return null;
                                return (
                                    <li key={req.id} className="p-4 border-b border-gray-100">
                                        <div className="flex items-center mb-2">
                                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold flex-shrink-0">
                                                {getInitials(requester.name)}
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-semibold text-gray-800">{requester.name}</p>
                                                <p className="text-xs text-gray-500">{getApartmentInfo(requester.id)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pl-12">
                                            <button 
                                                onClick={() => onUpdateStatus(req.id, 'accepted')}
                                                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                            >
                                                Onayla
                                            </button>
                                            <button 
                                                onClick={() => onUpdateStatus(req.id, 'rejected')}
                                                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                            >
                                                Reddet
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <p>Bekleyen arkadaşlık isteği yok.</p>
                        </div>
                    )
                )}

                {/* DISCOVER LIST */}
                {activeTab === 'discover' && (
                     discoverableUsers.length > 0 ? (
                        <ul>
                            {discoverableUsers.map(user => (
                                <li key={user.id} className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-semibold text-gray-800">{user.name}</p>
                                            <p className="text-xs text-gray-500">{getApartmentInfo(user.id)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onSendRequest(currentUser.id, user.id)}
                                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full"
                                        title="Ekle"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                     ) : (
                         <div className="p-8 text-center text-gray-500">
                             <p>Eklenebilecek yeni komşu bulunamadı.</p>
                         </div>
                     )
                )}
            </div>
        </div>
    );

    // Right Side: Chat Window
    const renderChatWindow = () => {
        if (activeTab !== 'chats' && window.innerWidth >= 768) {
             return (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 h-[600px] text-gray-400">
                    <p>Sohbet ekranını görmek için Sohbetler sekmesine geçin.</p>
                </div>
            );
        }

        if (!selectedFriendId) {
            return (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 h-[600px]">
                    <div className="text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <p>Bir sohbet başlatmak için soldan bir komşu seçin.</p>
                    </div>
                </div>
            );
        }

        const friend = getUser(selectedFriendId);

        return (
            <div className={`flex-1 flex flex-col h-[600px] bg-[#e5ddd5] ${activeTab === 'chats' ? 'block' : 'hidden md:flex'}`}>
                {/* Chat Header */}
                <div className="bg-gray-100 p-3 border-b border-gray-300 flex items-center">
                    <button className="md:hidden mr-3" onClick={() => setSelectedFriendId(null)}>
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {friend ? getInitials(friend.name) : '?'}
                    </div>
                    <div className="ml-3">
                        <p className="font-semibold text-gray-800">{friend?.name}</p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {activeChatMessages.map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm ${
                                        isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                                    }`}
                                >
                                    <p>{msg.content}</p>
                                    <p className="text-[10px] text-gray-500 text-right mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-gray-100 p-3">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-indigo-500"
                            placeholder="Bir mesaj yazın..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!messageInput.trim()}
                            className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex h-[600px] border border-gray-200">
            {/* On Mobile: If a chat is selected, hide list, show chat. Else show list. */}
            {/* We handle this with CSS classes in render functions based on state and viewport */}
            <div className={`w-full md:w-1/3 flex-shrink-0 ${selectedFriendId && window.innerWidth < 768 ? 'hidden' : 'block'}`}>
                {renderSidebar()}
            </div>
            <div className={`w-full md:w-2/3 ${!selectedFriendId && window.innerWidth < 768 ? 'hidden' : 'block'}`}>
                {renderChatWindow()}
            </div>
        </div>
    );
};

export default Neighbors;
