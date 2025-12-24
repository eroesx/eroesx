
import React, { useState, useMemo } from 'react';
import { User, Block, Feedback, FeedbackType } from '../types';

interface FeedbackPageProps {
    currentUser: User;
    users: User[];
    blocks: Block[];
    feedbacks: Feedback[];
    onAddFeedback: (userId: number, type: FeedbackType, subject: string, content: string) => void;
    onUpdateStatus: (id: number, status: 'Yeni' | 'Okundu' | 'Arşivlendi' | 'Yanıtlandı') => void;
    onRespond: (id: number, response: string) => void;
    isResidentViewMode?: boolean;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ currentUser, users, blocks, feedbacks, onAddFeedback, onUpdateStatus, onRespond, isResidentViewMode }) => {
    // Determine if we show Admin view (Inbox) or User view (Form)
    const isAdmin = currentUser.role === 'Yönetici' && !isResidentViewMode;

    const [activeTab, setActiveTab] = useState<'inbox' | 'passwords' | 'form' | 'history'>('inbox');
    
    // Switch to 'form' by default if not admin
    React.useEffect(() => {
        if (!isAdmin) {
            setActiveTab('form');
        } else if (activeTab === 'history') {
            setActiveTab('inbox');
        }
    }, [isAdmin]);


    // --- Form State ---
    const [subject, setSubject] = useState('');
    const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
    const [content, setContent] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Admin Reply State ---
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) {
            alert('Lütfen bir konu türü seçiniz (Şikayet, Öneri veya İstek).');
            return;
        }
        if (!subject.trim() || !content.trim()) {
            alert('Lütfen konu ve içerik alanlarını doldurunuz.');
            return;
        }

        onAddFeedback(currentUser.id, selectedType, subject, content);
        
        // Reset Form
        setSubject('');
        setSelectedType(null);
        setContent('');
        setSuccessMessage('Bildiriminiz başarıyla yönetime iletildi.');
        setTimeout(() => setSuccessMessage(''), 4000);
        
        // Auto switch to history to show it's submitted
        if(!isAdmin) setActiveTab('history');
    };
    
    const handleClear = () => {
        setSubject('');
        setSelectedType(null);
        setContent('');
        setSuccessMessage('');
    };

    const handleReplySubmit = (feedbackId: number) => {
        if (!replyContent.trim()) return;
        onRespond(feedbackId, replyContent);
        setReplyingToId(null);
        setReplyContent('');
    };

    // --- Data Calculation ---
    const [filterStatus, setFilterStatus] = useState<'all' | 'Yeni' | 'Okundu' | 'Arşivlendi' | 'Yanıtlandı'>('all');

    const filteredFeedbacks = useMemo(() => {
        let sorted = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Şifre taleplerini genel kutudan ayır
        if (isAdmin) {
            if (activeTab === 'inbox') {
                sorted = sorted.filter(f => f.subject !== 'Şifre Sıfırlama Talebi');
            } else if (activeTab === 'passwords') {
                sorted = sorted.filter(f => f.subject === 'Şifre Sıfırlama Talebi');
            }
        }

        if (filterStatus !== 'all') {
            sorted = sorted.filter(f => f.status === filterStatus);
        }
        return sorted;
    }, [feedbacks, filterStatus, activeTab, isAdmin]);

    const myFeedbacks = useMemo(() => {
        return feedbacks
            .filter(f => f.userId === currentUser.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [feedbacks, currentUser.id]);

    const getUserDetails = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (!user) return { name: 'Bilinmeyen Kullanıcı', location: '-', phone: '-' };

        let location = '-';
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) {
                location = `${block.name} Daire ${apt.number}`;
                break;
            }
        }
        return { name: user.name, location, phone: user.contactNumber1 || '-' };
    };

    // --- RENDERERS ---

    // Render User Form
    const renderForm = () => (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Öneri / Şikayet / İstek Formu</h2>
            
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                    <p>{successMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Konu Seçimi <span className="text-red-500">*</span></label>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            {(['Şikayet', 'Öneri', 'İstek'] as FeedbackType[]).map((type) => (
                                <div key={type} className="flex flex-col items-center">
                                    <span className="text-sm font-medium text-gray-700 mb-2">{type}</span>
                                    <input 
                                        type="checkbox" 
                                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        checked={selectedType === type}
                                        onChange={() => setSelectedType(type)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                    <input 
                        type="text" 
                        id="subject" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
                        placeholder="Örn: Asansör Arızası"
                    />
                </div>

                <div>
                     <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                         Şikayet / Öneri / İsteğiniz aşağıda belirtiniz. <span className="text-red-500">*</span>
                     </label>
                    <textarea 
                        id="content" 
                        rows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
                        placeholder="Yanıtınız"
                    />
                    <div className="border-b border-gray-300 mt-2"></div>
                </div>

                <div className="flex justify-between pt-2">
                    <button 
                        type="submit" 
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Gönder
                    </button>
                    <button 
                        type="button" 
                        onClick={handleClear}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                        Formu temizle
                    </button>
                </div>
            </form>
        </div>
    );

    const renderHistory = () => (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
             <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Geçmiş Bildirimlerim</h2>
            </div>
            {myFeedbacks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <p>Henüz bir gönderiniz bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-200">
                    {myFeedbacks.map(fb => (
                        <div key={fb.id} className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${
                                        fb.type === 'Şikayet' ? 'bg-red-100 text-red-700' :
                                        fb.type === 'Öneri' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {fb.type}
                                    </span>
                                    <h3 className="text-md font-bold text-gray-900">{fb.subject || '(Konu Yok)'}</h3>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    fb.status === 'Yanıtlandı' ? 'bg-green-100 text-green-800' :
                                    fb.status === 'Okundu' ? 'bg-blue-100 text-blue-800' :
                                    fb.status === 'Arşivlendi' ? 'bg-gray-100 text-gray-600' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {fb.status === 'Yanıtlandı' ? 'Yönetici Yanıtladı' : 
                                     fb.status === 'Okundu' ? 'Okundu' : 
                                     fb.status === 'Arşivlendi' ? 'Arşivlendi' : 'İletildi'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                Gönderim: {new Date(fb.createdAt).toLocaleDateString('tr-TR')} {new Date(fb.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <p className="text-gray-700 mb-4 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{fb.content}</p>
                            {fb.adminResponse && (
                                <div className="mt-4 bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-md">
                                    <h4 className="text-sm font-bold text-indigo-900 mb-1 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                        Yönetim Yanıtı
                                    </h4>
                                    <p className="text-indigo-800 text-sm whitespace-pre-wrap">{fb.adminResponse}</p>
                                    <p className="text-xs text-indigo-500 mt-2 text-right">
                                        {fb.responseDate && new Date(fb.responseDate).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderInbox = () => (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
             <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-800">
                    {activeTab === 'passwords' ? '🔐 Şifre Sıfırlama Talepleri' : '📨 Gelen Bildirimler'}
                </h2>
                <div className="flex flex-wrap gap-2">
                    {(['all', 'Yeni', 'Okundu', 'Yanıtlandı', 'Arşivlendi'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                                filterStatus === status 
                                ? 'bg-indigo-600 text-white shadow-md scale-105' 
                                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {status === 'all' ? 'Tümü' : status}
                        </button>
                    ))}
                </div>
            </div>
            
            {filteredFeedbacks.length === 0 ? (
                <div className="p-12 text-center text-gray-400 italic bg-gray-50">
                    <p>Görüntülenecek bildirim bulunamadı.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-200">
                    {filteredFeedbacks.map(fb => {
                        const { name, location, phone } = getUserDetails(fb.userId);
                        const isReplying = replyingToId === fb.id;

                        return (
                            <div key={fb.id} className={`p-6 hover:bg-gray-50 transition-colors ${fb.status === 'Yeni' ? 'bg-indigo-50/30' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md ${
                                            fb.type === 'Şikayet' ? 'bg-red-100 text-red-700' :
                                            fb.type === 'Öneri' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {fb.type}
                                        </span>
                                        <h3 className="text-md font-bold text-gray-900">{fb.subject || '(Konu Yok)'}</h3>
                                        {fb.status === 'Yeni' && <span className="animate-pulse inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">YENİ</span>}
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {new Date(fb.createdAt).toLocaleDateString('tr-TR')} {new Date(fb.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                
                                <div className="mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{fb.content}</p>
                                </div>

                                {fb.adminResponse && (
                                    <div className="bg-gray-100 p-3 rounded-md mb-4 border-l-4 border-gray-400">
                                        <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Verilen Yanıt:</p>
                                        <p className="text-sm text-gray-800">{fb.adminResponse}</p>
                                    </div>
                                )}
                                
                                {isReplying ? (
                                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-indigo-200 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <textarea
                                            autoFocus
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Yanıtınızı buraya yazın..."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm mb-3 shadow-inner"
                                            rows={3}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setReplyingToId(null); setReplyContent(''); }}
                                                className="px-4 py-2 text-gray-600 text-xs font-bold hover:text-gray-800"
                                            >
                                                İptal
                                            </button>
                                            <button 
                                                onClick={() => handleReplySubmit(fb.id)}
                                                className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
                                            >
                                                Yanıtı Gönder
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-gray-100">
                                        <div className="text-xs flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{name}</span>
                                                <span className="text-gray-400">|</span>
                                                <span className="font-medium text-gray-600">{location}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-indigo-600 font-bold">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                {phone}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!fb.adminResponse && (
                                                <button 
                                                    onClick={() => setReplyingToId(fb.id)}
                                                    className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                    Yanıtla
                                                </button>
                                            )}
                                            {fb.status !== 'Okundu' && fb.status !== 'Arşivlendi' && fb.status !== 'Yanıtlandı' && (
                                                <button 
                                                    onClick={() => onUpdateStatus(fb.id, 'Okundu')}
                                                    className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-[10px] font-bold rounded-lg hover:bg-gray-50"
                                                >
                                                    Okundu
                                                </button>
                                            )}
                                            {fb.status !== 'Arşivlendi' && (
                                                <button 
                                                    onClick={() => onUpdateStatus(fb.id, 'Arşivlendi')}
                                                    className="px-4 py-1.5 bg-gray-50 border border-gray-300 text-gray-500 text-[10px] font-bold rounded-lg hover:bg-gray-200"
                                                >
                                                    Arşivle
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             {isAdmin ? (
                <div className="flex space-x-2 p-1 bg-white rounded-xl shadow-sm border border-gray-200">
                    {[
                        { id: 'inbox', label: 'Gelen Bildirimler', icon: '📨' },
                        { id: 'passwords', label: 'Şifre Talepleri', icon: '🔐' },
                        { id: 'form', label: 'Yeni Form Oluştur', icon: '📝' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
             ) : (
                <div className="flex space-x-2 p-1 bg-white rounded-xl shadow-sm border border-gray-200">
                    <button
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs transition-all ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('form')}
                    >
                        📝 Yeni Bildirim
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        📂 Geçmişim
                    </button>
                </div>
             )}

            {(activeTab === 'inbox' || activeTab === 'passwords') && isAdmin && renderInbox()}
            {activeTab === 'form' && renderForm()}
            {activeTab === 'history' && !isAdmin && renderHistory()}
        </div>
    );
};

export default FeedbackPage;
