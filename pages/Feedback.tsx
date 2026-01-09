
import React, { useState, useMemo } from 'react';
import { User, Block, Feedback, FeedbackType, SiteInfo } from '../types';

interface FeedbackPageProps {
    currentUser: User;
    users: User[];
    blocks: Block[];
    feedbacks: Feedback[];
    onAddFeedback: (userId: number, type: FeedbackType, subject: string, content: string, fileData?: {url: string, name: string, type: string}) => void;
    onUpdateStatus: (id: number, status: 'Yeni' | 'Okundu' | 'Arşivlendi' | 'Yanıtlandı') => void;
    onRespond: (id: number, response: string) => void;
    isResidentViewMode?: boolean;
    onUpdateDues?: (userId: number, month: string, status: 'Ödendi' | 'Ödenmedi', amount: number) => void;
    siteInfo?: SiteInfo;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ currentUser, users, blocks, feedbacks, onAddFeedback, onUpdateStatus, onRespond, isResidentViewMode, onUpdateDues, siteInfo }) => {
    const isAdmin = currentUser.role === 'Yönetici' && !isResidentViewMode;
    const [activeTab, setActiveTab] = useState<'inbox' | 'passwords' | 'objections' | 'form' | 'history'>(isAdmin ? 'inbox' : 'history');
    const [residentFilter, setResidentFilter] = useState<'unread' | 'all'>('unread');

    // --- Form State ---
    const [subject, setSubject] = useState('');
    const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
    const [content, setContent] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Admin Reply State ---
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [markAsPaid, setMarkAsPaid] = useState(false);

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
        setSubject('');
        setSelectedType(null);
        setContent('');
        setSuccessMessage('Bildiriminiz başarıyla yönetime iletildi.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setActiveTab('history');
    };
    
    const handleClear = () => {
        setSubject('');
        setSelectedType(null);
        setContent('');
        setSuccessMessage('');
    };

    const handleReplySubmit = (feedback: Feedback) => {
        if (!replyContent.trim()) return;
        
        if (markAsPaid && feedback.type === 'İtiraz' && onUpdateDues && siteInfo) {
            const parts = feedback.subject.split(': ');
            if (parts.length > 1) {
                const monthStr = parts[1].trim();
                onUpdateDues(feedback.userId, monthStr, 'Ödendi', siteInfo.duesAmount);
            }
        }

        onRespond(feedback.id, replyContent);
        setReplyingToId(null);
        setReplyContent('');
        setMarkAsPaid(false);
    };

    const [filterStatus, setFilterStatus] = useState<'all' | 'Yeni' | 'Okundu' | 'Arşivlendi' | 'Yanıtlandı'>('Yeni');

    const filteredFeedbacks = useMemo(() => {
        let sorted = [...feedbacks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (isAdmin) {
            if (activeTab === 'inbox') {
                sorted = sorted.filter(f => f.subject !== 'Şifre Sıfırlama Talebi' && f.type !== 'İtiraz');
            } else if (activeTab === 'passwords') {
                sorted = sorted.filter(f => f.subject === 'Şifre Sıfırlama Talebi');
            } else if (activeTab === 'objections') {
                sorted = sorted.filter(f => f.type === 'İtiraz');
            }
            if (filterStatus !== 'all') {
                sorted = sorted.filter(f => f.status === filterStatus);
            }
        }
        return sorted;
    }, [feedbacks, filterStatus, activeTab, isAdmin]);

    const myFeedbacks = useMemo(() => {
        let list = feedbacks
            .filter(f => f.userId === currentUser.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (!isAdmin && residentFilter === 'unread') {
            list = list.filter(f => f.status === 'Yanıtlandı');
        }
        return list;
    }, [feedbacks, currentUser.id, isAdmin, residentFilter]);

    const getUserDetails = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (!user) return { name: 'Bilinmeyen Kullanıcı', location: '-', phone: '-' };
        let location = '-';
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) { location = `${block.name} Daire ${apt.number}`; break; }
        }
        return { name: user.name, location, phone: user.contactNumber1 || '-' };
    };

    const counts = useMemo(() => {
        return {
            inbox: feedbacks.filter(f => f.status === 'Yeni' && f.subject !== 'Şifre Sıfırlama Talebi' && f.type !== 'İtiraz').length,
            objections: feedbacks.filter(f => f.status === 'Yeni' && f.type === 'İtiraz').length,
            passwords: feedbacks.filter(f => f.status === 'Yeni' && f.subject === 'Şifre Sıfırlama Talebi').length,
            residentUnread: feedbacks.filter(f => f.userId === currentUser.id && f.status === 'Yanıtlandı').length
        };
    }, [feedbacks, currentUser.id]);

    const renderFilePreview = (fileUrl?: string, fileName?: string, fileType?: string) => {
        if (!fileUrl) return null;
        const isImage = fileType?.startsWith('image/');

        return (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tight mb-3 flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a1.5 1.5 0 11-2.121-2.121L16.715 5.858" /></svg>
                    Ekli Dosya / Dekont
                </p>
                <div className="flex flex-col gap-4">
                    {isImage ? (
                        <div className="relative group max-w-sm">
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border-4 border-white shadow-md transition-transform hover:scale-[1.02]">
                                <img src={fileUrl} alt={fileName} className="w-full h-auto object-cover max-h-64" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-[10px] font-black uppercase">Tam Boyut Görüntüle</span>
                                </div>
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-gray-800 uppercase truncate">{fileName}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">Doküman Dosyası</p>
                            </div>
                            <a href={fileUrl} download={fileName} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors">İndir</a>
                        </div>
                    )}
                    <p className="text-[10px] text-indigo-400 font-bold italic truncate">{fileName}</p>
                </div>
            </div>
        );
    };

    const renderForm = () => (
        <div className="bg-white p-6 rounded-3xl shadow-sm max-w-2xl mx-auto border border-gray-100">
            <h2 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-tight">Yeni Bildirim Oluştur</h2>
            {successMessage && <div className="bg-green-50 border border-green-100 text-green-700 p-4 mb-6 rounded-2xl font-bold text-sm uppercase tracking-tight flex items-center"><svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{successMessage}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Kategori</label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['Şikayet', 'Öneri', 'İstek'] as FeedbackType[]).map((type) => (
                            <button key={type} type="button" onClick={() => setSelectedType(type)} className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${selectedType === type ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300'}`}>{type}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="subject" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Konu Başlığı</label>
                    <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" placeholder="Kısa bir başlık yazın..." />
                </div>
                <div>
                     <label htmlFor="content" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Detaylı Açıklama</label>
                    <textarea id="content" rows={5} value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm" placeholder="Lütfen detayları burada belirtin..." />
                </div>
                <div className="flex gap-4 pt-2">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Bildirimi Gönder</button>
                    <button type="button" onClick={handleClear} className="px-6 py-4 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Temizle</button>
                </div>
            </form>
        </div>
    );

    const renderHistory = () => (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight ml-2">Bildirim Geçmişim</h2>
                <div className="flex gap-2">
                    <button onClick={() => setResidentFilter('unread')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${residentFilter === 'unread' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Okunmamış ({counts.residentUnread})</button>
                    <button onClick={() => setResidentFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${residentFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>Tümü</button>
                </div>
            </div>
            {myFeedbacks.length === 0 ? (
                <div className="p-16 text-center text-gray-300 bg-white rounded-3xl border border-dashed border-gray-200"><p className="font-black uppercase tracking-[0.2em] text-xs italic">Bildirim kaydı bulunamadı</p></div>
            ) : (
                <div className="space-y-4">
                    {myFeedbacks.map(fb => (
                        <div key={fb.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${fb.type === 'Şikayet' ? 'bg-red-50 text-red-600' : fb.type === 'Öneri' ? 'bg-blue-50 text-blue-600' : fb.type === 'İtiraz' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>{fb.type}</span>
                                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{fb.subject || '(Konu Yok)'}</h3>
                                        {fb.status === 'Yanıtlandı' && <span className="animate-pulse px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[8px] font-black uppercase shadow-sm">YENİ YANIT</span>}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(fb.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed">{fb.content}</p>
                                    {renderFilePreview(fb.fileUrl, fb.fileName, fb.fileType)}
                                </div>
                                {fb.adminResponse ? (
                                    <div className="bg-indigo-50 border-l-8 border-indigo-500 p-5 rounded-r-2xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center"><svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>Yönetim Yanıtı</h4>
                                            {fb.status === 'Yanıtlandı' && <button onClick={() => onUpdateStatus(fb.id, 'Okundu')} className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95">Okundu</button>}
                                        </div>
                                        <p className="text-indigo-800 text-sm font-bold leading-relaxed">{fb.adminResponse}</p>
                                        <p className="text-[9px] text-indigo-300 mt-4 font-bold text-right uppercase tracking-tighter">Yanıt Tarihi: {fb.responseDate && new Date(fb.responseDate).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-500 bg-amber-50/50 p-3 rounded-xl border border-amber-100"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-[10px] font-black uppercase tracking-widest">Yönetimden yanıt bekleniyor...</span></div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderInbox = () => (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">{activeTab === 'passwords' ? '🔐 Şifre Sıfırlama Talepleri' : (activeTab === 'objections' ? '⚠️ Aidat İtirazları' : '📨 Gelen Bildirimler')}</h2>
                <div className="flex flex-wrap gap-2">
                    {(['all', 'Yeni', 'Okundu', 'Yanıtlandı', 'Arşivlendi'] as const).map(status => (
                        <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${filterStatus === status ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>{status === 'all' ? 'Tümü' : status}</button>
                    ))}
                </div>
            </div>
            {filteredFeedbacks.length === 0 ? (
                <div className="p-20 text-center text-gray-300 italic bg-white"><p className="text-xs font-black uppercase tracking-widest">Bildirim bulunmuyor</p></div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {filteredFeedbacks.map(fb => {
                        const { name, location, phone } = getUserDetails(fb.userId);
                        const isReplying = replyingToId === fb.id;
                        return (
                            <div key={fb.id} className={`p-6 transition-colors ${fb.status === 'Yeni' ? 'bg-indigo-50/20' : 'hover:bg-gray-50/50'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${fb.type === 'Şikayet' ? 'bg-red-50 text-red-600' : fb.type === 'Öneri' ? 'bg-blue-50 text-blue-600' : fb.type === 'İtiraz' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>{fb.type}</span>
                                        <h3 className="text-sm font-black text-gray-800 uppercase">{fb.subject || '(Konu Yok)'}</h3>
                                        {fb.status === 'Yeni' && <span className="animate-pulse inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black bg-indigo-600 text-white shadow-sm uppercase">YENİ</span>}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(fb.createdAt).toLocaleDateString('tr-TR')} {new Date(fb.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="mb-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-gray-700 text-sm font-medium leading-relaxed">{fb.content}</p>
                                    {renderFilePreview(fb.fileUrl, fb.fileName, fb.fileType)}
                                </div>
                                {fb.adminResponse && !isReplying && (
                                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border-l-4 border-gray-300"><p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Sistem Yanıtı:</p><p className="text-sm text-gray-600 font-bold italic">{fb.adminResponse}</p></div>
                                )}
                                {isReplying ? (
                                    <div className="mt-4 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[9px] font-black text-indigo-400 uppercase mb-2 block tracking-widest">Yanıt İçeriği</label>
                                        <textarea autoFocus value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Sakinle paylaşılacak yanıtı yazın..." className="w-full p-4 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-4 shadow-inner font-medium" rows={3} />
                                        {fb.type === 'İtiraz' && (
                                            <div className="flex items-center mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 group cursor-pointer" onClick={() => setMarkAsPaid(!markAsPaid)}>
                                                <div className={`w-10 h-6 rounded-full transition-all relative ${markAsPaid ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${markAsPaid ? 'left-5' : 'left-1'}`} />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-[11px] font-black text-emerald-800 uppercase tracking-tight">Aidatı 'Ödendi' Olarak Kaydet</p>
                                                    <p className="text-[9px] text-emerald-600 font-bold opacity-70 uppercase">Onaylandığı an sakinin borcu silinecek ve yeşil olacaktır.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => { setReplyingToId(null); setReplyContent(''); setMarkAsPaid(false); }} className="px-5 py-2.5 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors">İptal</button>
                                            <button onClick={() => handleReplySubmit(fb)} className="px-8 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">Gönder ve Kaydet</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-gray-100">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2"><span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{name}</span><span className="text-gray-300">|</span><span className="text-[10px] font-bold text-gray-500 uppercase">{location}</span></div>
                                            <div className="flex items-center gap-1.5 text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg><span className="text-[10px] font-black tracking-tight">{phone}</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setReplyingToId(fb.id)} className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 flex items-center shadow-md active:scale-95 transition-all"><svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>Yanıtla</button>
                                            {fb.status !== 'Okundu' && fb.status !== 'Arşivlendi' && fb.status !== 'Yanıtlandı' && <button onClick={() => onUpdateStatus(fb.id, 'Okundu')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-[9px] font-black uppercase rounded-lg hover:bg-gray-50 transition-all">Okundu</button>}
                                            {fb.status !== 'Arşivlendi' && <button onClick={() => onUpdateStatus(fb.id, 'Arşivlendi')} className="px-4 py-2 bg-gray-50 text-gray-400 text-[9px] font-black uppercase rounded-lg hover:bg-gray-200 transition-all">Arşivle</button>}
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
                <div className="flex space-x-2 p-1.5 bg-white rounded-3xl shadow-sm border border-gray-100">
                    {[
                        { id: 'inbox', label: 'Bildirimler', icon: '📨', count: counts.inbox },
                        { id: 'objections', label: 'İtirazlar', icon: '⚠️', count: counts.objections },
                        { id: 'passwords', label: 'Şifre Talepleri', icon: '🔐', count: counts.passwords },
                        { id: 'form', label: 'Yeni Form', icon: '📝', count: 0 }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-gray-50'}`}><span>{tab.icon}</span><span className="hidden sm:inline">{tab.label}</span>{tab.count > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] text-white items-center justify-center">{tab.count}</span></span>}</button>
                    ))}
                </div>
             ) : (
                <div className="flex space-x-2 p-1.5 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <button className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-gray-50'}`} onClick={() => setActiveTab('history')}>📂 Geçmiş Bildirimlerim {counts.residentUnread > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] text-white items-center justify-center">{counts.residentUnread}</span></span>}</button>
                    <button className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-gray-50'}`} onClick={() => setActiveTab('form')}>📝 Yeni Bildirim Oluştur</button>
                </div>
             )}

            {(activeTab === 'inbox' || activeTab === 'passwords' || activeTab === 'objections') && isAdmin && renderInbox()}
            {activeTab === 'form' && renderForm()}
            {activeTab === 'history' && !isAdmin && renderHistory()}
        </div>
    );
};

export default FeedbackPage;
