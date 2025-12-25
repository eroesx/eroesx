
import React, { useMemo, useState, useEffect } from 'react';
import { User, Block, Dues, Announcement, Page, SiteInfo, Feedback, ChatMessage, Expense, FeedbackType, NeighborConnection } from '../types';

interface DashboardProps {
    currentUser: User;
    users: User[];
    blocks: Block[];
    dues: Dues[];
    announcements: Announcement[];
    siteInfo: SiteInfo;
    messages: ChatMessage[];
    setCurrentPage: (page: Page) => void;
    isResidentViewMode?: boolean;
    feedbacks?: Feedback[];
    onUpdateUser?: (user: User) => void;
    expenses?: Expense[];
    onUpdateSiteInfo?: (info: SiteInfo) => void;
    onSelectBlock?: (id: number) => void;
    onAddFeedback?: (userId: number, type: FeedbackType, subject: string, content: string) => void;
    connections?: NeighborConnection[];
}

// --- SVG ICONS ---
const UsersIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 13a5.995 5.995 0 003-1.197" /></svg>;
const CashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MegaphoneIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>;
const BuildingIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const InboxIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const ChatIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const ChartBarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ClipboardIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h6" /></svg>;
const PencilIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass: string;
    onClick?: () => void;
    actionLabel?: string;
    onAction?: () => void;
}> = ({ title, value, icon, trend, trendValue, colorClass, onClick, actionLabel, onAction }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{title}</p>
            <h3 className="text-xl md:text-3xl font-black text-gray-800">{value}</h3>
            {trend && (
                <div className={`flex items-center mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${trend === 'up' ? 'bg-green-50 text-green-600' : trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    <span className="mr-1">{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}</span>
                    <span>{trendValue}</span>
                </div>
            )}
            {actionLabel && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onAction?.(); }}
                    className="mt-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline block"
                >
                    {actionLabel}
                </button>
            )}
        </div>
        <div className={`p-3 md:p-4 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0 transition-colors`}>
            {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 md:w-6 md:h-6 ${colorClass.replace('bg-', 'text-')}` })}
        </div>
    </div>
);

const QuickAction: React.FC<{ label: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ label, icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all active:scale-95 group w-full"
    >
        <div className={`h-12 w-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${color.replace('bg-', 'text-')}` })}
        </div>
        <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{label}</span>
    </button>
);

const ManagerDashboard: React.FC<DashboardProps> = ({ users, blocks, dues, announcements, siteInfo, feedbacks, messages, currentUser, setCurrentPage, expenses, onUpdateSiteInfo, onSelectBlock }) => {
    const totalApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.length, 0), [blocks]);
    const occupiedApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.filter(a => a.status === 'Dolu').length, 0), [blocks]);
    
    const totalCollected = useMemo(() => dues.filter(d => d.status === 'Ödendi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const totalPending = useMemo(() => dues.filter(d => d.status === 'Ödenmedi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const totalExpense = useMemo(() => (expenses || []).reduce((acc, e) => acc + e.amount, 0), [expenses]);
    
    const initialBalance = siteInfo.initialBalance || 0;
    const netBalance = (totalCollected + initialBalance) - totalExpense;
    const collectionRate = (totalCollected + totalPending) > 0 ? Math.round((totalCollected / (totalCollected + totalPending)) * 100) : 0;
    
    const newFeedbacks = useMemo(() => (feedbacks || []).filter(f => f.status === 'Yeni').length, [feedbacks]);
    const unreadMsgs = useMemo(() => messages.filter(m => m.receiverId === currentUser.id && !m.read).length, [messages, currentUser]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Kasadaki Mevcut (Net)" value={`₺${netBalance.toLocaleString()}`} icon={<CashIcon />} trend={netBalance >= 0 ? 'up' : 'down'} trendValue={netBalance >= 0 ? 'Pozitif' : 'Açık'} colorClass="bg-indigo-600" />
                <StatCard 
                    title="Yeni Bildirim" 
                    value={newFeedbacks} 
                    icon={<InboxIcon />} 
                    onClick={() => setCurrentPage('feedback')} 
                    trend={newFeedbacks > 0 ? 'up' : 'neutral'} 
                    trendValue={newFeedbacks > 0 ? "Acil Bekliyor" : "Güncel"} 
                    colorClass={newFeedbacks > 0 ? "bg-rose-600" : "bg-amber-500"} 
                />
                <StatCard title="Okunmamış Mesaj" value={unreadMsgs} icon={<ChatIcon />} onClick={() => setCurrentPage('neighbors')} trend={unreadMsgs > 0 ? 'up' : 'neutral'} trendValue="Komşular" colorClass="bg-indigo-600" />
                <StatCard title="Tahsilat Oranı" value={`%${collectionRate}`} icon={<ChartBarIcon />} onClick={() => setCurrentPage('duesManagement')} trend={collectionRate > 80 ? 'up' : 'neutral'} trendValue={`${totalCollected.toLocaleString()} ₺`} colorClass="bg-green-600" />
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight ml-1">Hızlı İşlemler</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickAction label="Üye Ekle" icon={<PlusIcon />} color="bg-indigo-600" onClick={() => setCurrentPage('users')} />
                    <QuickAction label="Duyuru" icon={<MegaphoneIcon />} color="bg-amber-500" onClick={() => setCurrentPage('announcements')} />
                    <QuickAction label="Aidat" icon={<CashIcon />} color="bg-green-600" onClick={() => setCurrentPage('duesManagement')} />
                    <QuickAction label="Gider" icon={<ChartBarIcon />} color="bg-rose-500" onClick={() => setCurrentPage('expenses')} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Blok Doluluk Ayrıntıları</h3>
                            <button onClick={() => setCurrentPage('blockManagement')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Blok Yönetimi</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Blok Adı</th>
                                        <th className="px-6 py-4">Dolu / Toplam</th>
                                        <th className="px-6 py-4 text-right">Oran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {blocks.map(block => {
                                        const occ = block.apartments.filter(a => a.status === 'Dolu').length;
                                        const total = block.apartments.length;
                                        const pct = total > 0 ? Math.round((occ / total) * 100) : 0;
                                        return (
                                            <tr key={block.id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-6 py-4 font-black text-indigo-600 text-xs cursor-pointer hover:underline" onClick={() => { onSelectBlock?.(block.id); setCurrentPage('blockManagement'); }}>{block.name}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-500">{occ} / {total}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div style={{ width: `${pct}%` }} className={`h-full ${pct > 80 ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-800">%{pct}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Bekleyen Son Bildirimler</h3>
                            <button onClick={() => setCurrentPage('feedback')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Tümünü Gör</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {(feedbacks || []).filter(f => f.status === 'Yeni').slice(0, 3).map(fb => (
                                <div key={fb.id} className="p-4 flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-xl ${fb.type === 'Şikayet' ? 'bg-red-50 text-red-600' : (fb.type === 'İtiraz' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600')}`}>
                                            <InboxIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{fb.subject}</p>
                                            <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs">{fb.content}</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-300 uppercase">{new Date(fb.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            ))}
                            {(feedbacks || []).filter(f => f.status === 'Yeni').length === 0 && (
                                <div className="p-8 text-center text-gray-300 text-xs font-bold uppercase italic">Yeni bildirim bulunmuyor</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <CashIcon className="w-32 h-32" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4">Mali Durum Özeti</h3>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center border-b border-indigo-500/50 pb-2">
                                <div>
                                    <p className="text-[9px] font-bold opacity-75 uppercase tracking-tighter">Gelir (Kasa+Aidat)</p>
                                    <p className="text-lg font-black text-emerald-300">+ ₺{(totalCollected + initialBalance).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold opacity-75 uppercase tracking-tighter">Toplam Gider</p>
                                    <p className="text-lg font-black text-rose-300">- ₺{totalExpense.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                <p className="text-[10px] font-black opacity-80 uppercase mb-1 tracking-widest text-center">Net Kasa Bakiyesi</p>
                                <p className={`text-3xl font-black text-center ${netBalance >= 0 ? 'text-white' : 'text-rose-400 animate-pulse'}`}>₺{netBalance.toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-1 mt-4">
                                <button onClick={() => setCurrentPage('duesManagement')} className="py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Analiz</button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Son Giderler</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {(expenses || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map(exp => (
                                <div key={exp.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-gray-700 uppercase">{exp.title}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{exp.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-rose-600">-₺{exp.amount.toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-300 font-bold uppercase">{new Date(exp.date).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ResidentDashboard Component ---
const ResidentDashboard: React.FC<DashboardProps> = ({ currentUser, users, blocks, announcements, dues, siteInfo, setCurrentPage, messages, onUpdateUser, onAddFeedback, feedbacks = [], connections = [] }) => {
    const unreadMsgs = useMemo(() => messages.filter(m => m.receiverId === currentUser.id && !m.read).length, [messages, currentUser]);
    const pendingReqs = useMemo(() => connections.filter(c => c.receiverId === currentUser.id && c.status === 'pending').length, [connections, currentUser]);
    const unreadFeedbacks = useMemo(() => feedbacks.filter(f => f.userId === currentUser.id && f.status === 'Yanıtlandı').length, [feedbacks, currentUser.id]);
    const latestAnnouncements = useMemo(() => [...announcements].sort((a, b) => b.id - a.id).slice(0, 3), [announcements]);
    
    const [plateSearchTerm, setPlateSearchTerm] = useState('');
    const [plateSearchResults, setPlateSearchResults] = useState<{ user: User, location: string }[]>([]);
    const [plateSearchError, setPlateSearchError] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [plate1, setPlate1] = useState(currentUser.vehiclePlate1 || '');
    const [plate2, setPlate2] = useState(currentUser.vehiclePlate2 || '');
    const [phone1, setPhone1] = useState(currentUser.contactNumber1 || '');
    const [phone2, setPhone2] = useState(currentUser.contactNumber2 || '');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const [isDuesModalOpen, setDuesModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [objectionSuccessMsg, setObjectionSuccessMsg] = useState('');

    useEffect(() => {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setPlate1(currentUser.vehiclePlate1 || '');
        setPlate2(currentUser.vehiclePlate2 || '');
        setPhone1(currentUser.contactNumber1 || '');
        setPhone2(currentUser.contactNumber2 || '');
    }, [currentUser]);

    const handlePlateSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPlateSearchError(false);
        setPlateSearchResults([]);
        
        const originalTerm = plateSearchTerm.trim().toLocaleUpperCase('tr-TR');
        const termNoSpace = originalTerm.replace(/\s/g, '');
        
        if (!originalTerm) return;

        const results = users.filter(u => {
            const p1 = u.vehiclePlate1?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            const p2 = u.vehiclePlate2?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            const nameStr = u.name.toLocaleUpperCase('tr-TR');
            
            return p1.includes(termNoSpace) || p2.includes(termNoSpace) || nameStr.includes(originalTerm);
        });

        if (results.length > 0) {
            const resultsWithLocation = results.map(foundUser => {
                let locText = 'Bilinmiyor';
                for (const b of blocks) {
                    const apt = b.apartments.find(a => a.residentId === foundUser.id);
                    if (apt) { locText = `${b.name} Daire ${apt.number}`; break; }
                }
                return { user: foundUser, location: locText };
            });
            setPlateSearchResults(resultsWithLocation);
        } else {
            setPlateSearchError(true);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatPhoneNumber = (phone: string | undefined) => {
        if (!phone) return null;
        const cleanPhone = phone.trim().replace(/\s/g, '');
        return cleanPhone.startsWith('0') ? cleanPhone : `0${cleanPhone}`;
    };

    const handleSaveProfile = () => {
        if (!onUpdateUser) return;
        setSaveStatus('saving');
        onUpdateUser({ ...currentUser, name, email, vehiclePlate1: plate1, vehiclePlate2: plate2, contactNumber1: phone1, contactNumber2: phone2 });
        setTimeout(() => {
            setSaveStatus('success');
            setIsEditing(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 500);
    };

    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const yearlyDuesStatus = useMemo(() => {
        return months.map((monthName, idx) => {
            const monthStr = `${monthName} ${currentYear}`;
            const record = dues.find(d => d.userId === currentUser.id && d.month === monthStr);
            const isPast = idx < currentMonthIdx;
            const isCurrent = idx === currentMonthIdx;
            
            let status: 'Ödendi' | 'Ödenmedi' | 'Bekliyor' | 'İtiraz Edildi' = 'Bekliyor';
            
            // Eğer "Ödendi" kaydı varsa direkt ödenmiş göster (itiraz olsa bile yeşil öncelikli)
            if (record?.status === 'Ödendi') {
                status = 'Ödendi';
            } else {
                // Ödendi değilse itiraz var mı bak
                const hasObjection = feedbacks.some(f => 
                    f.userId === currentUser.id && 
                    f.type === 'İtiraz' && 
                    f.subject.includes(monthStr) &&
                    f.status !== 'Arşivlendi' // Arşivlenmemiş aktif itirazlar
                );
                
                if (hasObjection) {
                    status = 'İtiraz Edildi';
                } else if (isPast || (isCurrent && record?.status === 'Ödenmedi')) {
                    status = 'Ödenmedi';
                }
            }
            
            return { monthName, status, amount: record?.amount || siteInfo.duesAmount };
        });
    }, [dues, currentUser, currentYear, currentMonthIdx, siteInfo.duesAmount, feedbacks]);

    const totalDebt = useMemo(() => {
        return yearlyDuesStatus.reduce((acc, item, idx) => {
            if (item.status === 'Ödenmedi') return acc + item.amount;
            if (idx === currentMonthIdx && item.status === 'Bekliyor') return acc + item.amount;
            return acc;
        }, 0);
    }, [yearlyDuesStatus, currentMonthIdx]);

    const hasPastUnpaid = useMemo(() => yearlyDuesStatus.some((item, idx) => idx < currentMonthIdx && item.status === 'Ödenmedi'), [yearlyDuesStatus, currentMonthIdx]);
    const isCurrentPaid = yearlyDuesStatus[currentMonthIdx].status === 'Ödendi';

    const handleObjection = (monthName: string) => {
        if(!onAddFeedback) return;
        const confirmMsg = `${monthName} ${currentYear} aidatı için yöneticiye itiraz bildirimi göndermek istiyor musunuz?`;
        if(window.confirm(confirmMsg)) {
            // Anlık bilgi mesajı
            setObjectionSuccessMsg(`${monthName} ayı için itiraz talebiniz oluşturuluyor...`);
            
            setTimeout(() => {
                onAddFeedback(currentUser.id, 'İtiraz', `Aidat Ödeme İtirazı: ${monthName} ${currentYear}`, `${monthName} ${currentYear} dönemine ait aidat borcum için itiraz ediyorum. Ödemenin kontrol edilmesini rica ederim.`);
                setObjectionSuccessMsg(`${monthName} ayı için itirazınız başarıyla mavi renkli olarak kaydedildi ve yönetime iletildi.`);
                setTimeout(() => setObjectionSuccessMsg(''), 4000);
            }, 1000);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2">
            {isDuesModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{currentYear} Yılı Aidat Durumu</h3>
                                <p className="text-indigo-200 text-xs font-bold uppercase mt-2 tracking-widest italic">* Geçmiş aylarda kaydı bulunmayan aidatlar borç sayılır</p>
                            </div>
                            <button onClick={() => setDuesModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {objectionSuccessMsg && (
                            <div className="px-8 py-3 bg-blue-50 text-blue-800 text-[10px] font-black uppercase border-b border-blue-100 flex items-center">
                                <svg className="w-4 h-4 mr-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {objectionSuccessMsg}
                            </div>
                        )}
                        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {yearlyDuesStatus.map((item, idx) => (
                                    <div key={idx} className={`p-5 rounded-3xl border flex items-center justify-between shadow-sm transition-all hover:shadow-md bg-white ${item.status === 'Ödendi' ? 'border-green-300 ring-2 ring-green-100 bg-green-50/20 scale-[1.01]' : item.status === 'İtiraz Edildi' ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100 scale-[1.02] shadow-blue-100 shadow-lg' : item.status === 'Ödenmedi' ? 'border-rose-100 ring-1 ring-rose-50' : 'border-gray-100 opacity-60'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${item.status === 'Ödendi' ? 'bg-green-600 text-white shadow-sm' : item.status === 'İtiraz Edildi' ? 'bg-blue-600 text-white shadow-sm animate-pulse' : item.status === 'Ödenmedi' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black uppercase tracking-tight ${item.status === 'İtiraz Edildi' ? 'text-blue-800' : item.status === 'Ödendi' ? 'text-green-800' : 'text-gray-800'}`}>{item.monthName}</p>
                                                <p className="text-[10px] font-bold text-gray-400">₺{item.amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.status === 'Ödendi' ? 'bg-green-600 text-white shadow-sm' : item.status === 'İtiraz Edildi' ? 'bg-blue-600 text-white shadow-md' : item.status === 'Ödenmedi' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                                                {item.status}
                                            </span>
                                            {item.status === 'Ödenmedi' && (
                                                <button onClick={() => handleObjection(item.monthName)} className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 uppercase rounded-lg hover:bg-rose-100 transition-all shadow-sm" title="Yöneticiye İtiraz Et">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    İtiraz Et
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-white border-t border-gray-100 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Her ayın başında aidat borcu otomatik olarak işlenir</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Aidat Durumu" value={isCurrentPaid && !hasPastUnpaid ? 'Ödendi' : `₺${totalDebt.toLocaleString()}`} icon={<CashIcon />} onClick={() => setDuesModalOpen(true)} trend={isCurrentPaid && !hasPastUnpaid ? 'up' : 'down'} trendValue={isCurrentPaid && !hasPastUnpaid ? 'Güncel' : (totalDebt > 0 ? 'Borcunuz bulunmaktadır' : 'Ödeme Bekliyor')} colorClass={isCurrentPaid && !hasPastUnpaid ? 'bg-green-600' : 'bg-rose-600'} />
                <StatCard title="Mesajlarım" value={unreadMsgs + pendingReqs} icon={<ChatIcon />} onClick={() => setCurrentPage('neighbors')} trend={(unreadMsgs + pendingReqs) > 0 ? 'up' : 'neutral'} trendValue={`${unreadMsgs} Mesaj, ${pendingReqs} İstek`} colorClass={(unreadMsgs + pendingReqs) > 0 ? 'bg-rose-600' : 'bg-indigo-600'} />
                <StatCard title="Duyurular" value={announcements.length} icon={<MegaphoneIcon />} onClick={() => setCurrentPage('announcements')} trend="neutral" trendValue="Toplam Yayında" colorClass="bg-amber-500" />
                <StatCard title="Öneri/İstek" value={unreadFeedbacks > 0 ? unreadFeedbacks : "İlet"} icon={<InboxIcon />} onClick={() => setCurrentPage('feedback')} trend={unreadFeedbacks > 0 ? 'up' : 'neutral'} trendValue={unreadFeedbacks > 0 ? "Yeni Yanıt" : "Yönetime Yaz"} colorClass={unreadFeedbacks > 0 ? 'bg-rose-600' : 'bg-blue-600'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Hızlı Araç / Sakin Sorgulama</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sakin plaka veya isim bilgilerini sorgulayın</p>
                            </div>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        </div>
                        <form onSubmit={handlePlateSearch} className="flex gap-2">
                            <input 
                                type="text" 
                                value={plateSearchTerm} 
                                onChange={e => setPlateSearchTerm(e.target.value)} 
                                placeholder="Plaka veya İsim (Örn: 34 ABC 123 veya Ahmet)" 
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm uppercase" 
                            />
                            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">Sorgula</button>
                        </form>
                        
                        {plateSearchResults.length > 0 && (
                            <div className="mt-6 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {plateSearchResults.map((result, index) => (
                                    <div key={index} className="bg-indigo-50/50 border-l-8 border-indigo-500 rounded-2xl p-5 animate-in slide-in-from-top-2 duration-300 relative group">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">{result.user.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{result.user.name}</p>
                                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{result.location}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">1. İrtibat Numarası</label>
                                                    <div className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                        <a href={`tel:${formatPhoneNumber(result.user.contactNumber1)}`} className="text-indigo-700 hover:underline text-xl font-black tracking-tighter">{formatPhoneNumber(result.user.contactNumber1) || 'Bilinmiyor'}</a>
                                                    </div>
                                                </div>
                                            </div>
                                            {index === 0 && (
                                                <button onClick={() => setPlateSearchResults([])} className="p-1 text-gray-400 hover:text-rose-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {plateSearchError && (
                            <div className="mt-6 bg-rose-50 border-l-8 border-rose-500 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center text-rose-700">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="text-[11px] font-black uppercase tracking-tight">Kayıt Bulunamadı</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Son Duyurular</h3>
                            <button onClick={() => setCurrentPage('announcements')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Tümünü Gör</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {latestAnnouncements.map(ann => (
                                <div key={ann.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <h4 className="font-black text-gray-800 uppercase text-sm mb-2">{ann.title}</h4>
                                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{ann.content}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-3 uppercase">📅 {ann.date}</p>
                                </div>
                            ))}
                            {latestAnnouncements.length === 0 && (
                                <div className="p-12 text-center text-gray-300 text-xs font-bold uppercase italic">Henüz duyuru bulunmuyor</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 relative group/profile">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Profil Bilgilerim</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{isEditing ? 'Bilgilerinizi aşağıdan güncelleyin' : 'Sistemde kayıtlı iletişim bilgileriniz'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {saveStatus === 'success' && !isEditing && <span className="text-[10px] font-black text-emerald-600 uppercase animate-in fade-in">Güncellendi!</span>}
                                <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`} title={isEditing ? "Vazgeç" : "Düzenle"}>
                                    {isEditing ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <PencilIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        {isEditing ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İsim Soyisim</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-posta</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Telefon</label><input type="tel" value={phone1} onChange={e => setPhone1(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Telefon</label><input type="tel" value={phone2} onChange={e => setPhone2(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Plaka</label><input type="text" value={plate1} onChange={e => setPlate1(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                                    <div className="space-y-1"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Plaka</label><input type="text" value={plate2} onChange={e => setPlate2(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">İptal</button>
                                    <button onClick={handleSaveProfile} disabled={saveStatus === 'saving'} className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">{saveStatus === 'saving' ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 animate-in fade-in duration-500">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">İsim Soyisim</p><p className="text-sm font-black text-gray-800 uppercase">{currentUser.name}</p></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">E-posta</p><p className="text-sm font-bold text-gray-700">{currentUser.email}</p></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">İletişim</p><p className="text-sm font-black text-gray-800">{currentUser.contactNumber1 || '-'}</p>{currentUser.contactNumber2 && <p className="text-xs font-bold text-gray-500 mt-0.5">{currentUser.contactNumber2}</p>}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2v0" /></svg></div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Araç Plakaları</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {currentUser.vehiclePlate1 ? <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-black rounded-lg border border-gray-200">{currentUser.vehiclePlate1}</span> : <span className="text-xs text-gray-400 italic">Kayıtlı plaka yok</span>}
                                                {currentUser.vehiclePlate2 && <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-black rounded-lg border border-gray-200">{currentUser.vehiclePlate2}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10"><BuildingIcon className="w-32 h-32" /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4">Ödeme Bilgileri</h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 relative">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-[9px] font-black opacity-80 uppercase tracking-widest">{siteInfo.bankName}</p>
                                    <button onClick={() => handleCopy(siteInfo.iban, 'IBAN')} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${copiedField === 'IBAN' ? 'bg-green-50 text-white' : 'bg-white/20 hover:bg-white/40 text-white'}`}><ClipboardIcon className="w-3 h-3" />{copiedField === 'IBAN' ? 'Kopyalandı' : 'Kopyala'}</button>
                                </div>
                                <p className="text-sm font-black break-all tracking-tighter mb-4 pr-2">{siteInfo.iban}</p>
                                <div className="pt-3 border-t border-white/10">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1"><p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-1">Ödeme Notu</p><p className="text-[10px] font-bold leading-tight line-clamp-2">{siteInfo.note}</p></div>
                                        <button onClick={() => handleCopy(siteInfo.note, 'Not')} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all shrink-0 ${copiedField === 'Not' ? 'bg-green-50 text-white' : 'bg-white/20 hover:bg-white/40 text-white'}`}><ClipboardIcon className="w-3 h-3" />{copiedField === 'Not' ? 'Kopyalandı' : 'Kopyala'}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 text-center">
                                <p className="text-[10px] font-black opacity-80 uppercase mb-1">Aylık Aidat Tutarı</p>
                                <p className="text-2xl font-black">₺{siteInfo.duesAmount}</p>
                            </div>
                            <button onClick={() => setDuesModalOpen(true)} className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Aidat Detayları</button>
                        </div>
                    </div>
                    <QuickAction label="Komşularla Sohbet" icon={<ChatIcon />} color="bg-indigo-600" onClick={() => setCurrentPage('neighbors')} />
                    <QuickAction label="Yönetime Bildir" icon={<InboxIcon />} color="bg-rose-500" onClick={() => setCurrentPage('feedback')} />
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }`}} />
        </div>
    );
};

// --- Default Export for Dashboard ---
const Dashboard: React.FC<DashboardProps> = (props) => {
    const isAdmin = props.currentUser.role === 'Yönetici' && !props.isResidentViewMode;
    return isAdmin ? <ManagerDashboard {...props} /> : <ResidentDashboard {...props} />;
};

export default Dashboard;
