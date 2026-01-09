
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { User, Block, Dues, Announcement, Page, SiteInfo, Feedback, ChatMessage, Expense, FeedbackType, NeighborConnection, UserRole } from '../types';

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
    onAddFeedback?: (userId: number, type: FeedbackType, subject: string, content: string, fileData?: {url: string, name: string, type: string}) => void;
    connections?: NeighborConnection[];
}

// --- SVG ICONS ---
const UsersIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 13a5.995 5.995 0 003-1.197" /></svg>;
const CashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MegaphoneIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>;
const BuildingIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const InboxIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const ChatIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 00-2 2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const ChartBarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ClipboardIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h6" /></svg>;
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
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 md:w-6 md:h-6 ${colorClass.replace('bg-', 'text-')}` })}
        </div>
    </div>
);

const QuickAction: React.FC<{ label: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ label, icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all active:scale-95 group w-full"
    >
        <div className={`h-12 w-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `h-6 w-6 ${color.replace('bg-', 'text-')}` })}
        </div>
        <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{label}</span>
    </button>
);

const ManagerDashboard: React.FC<DashboardProps> = ({ users, blocks, dues, announcements, siteInfo, feedbacks, messages, currentUser, setCurrentPage, expenses, onUpdateSiteInfo, onSelectBlock }) => {
    const totalApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.length, 0), [blocks]);
    const occupiedApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.filter(a => a.status === 'Dolu').length, 0), [blocks]);
    
    const nonExemptUsers = useMemo(() => users.filter(u => !u.isDuesExempt && u.role !== 'Yönetici'), [users]);
    const nonExemptUserIds = useMemo(() => new Set(nonExemptUsers.map(u => u.id)), [nonExemptUsers]);

    const totalCollected = useMemo(() => dues.filter(d => d.status === 'Ödendi' && nonExemptUserIds.has(d.userId)).reduce((acc, d) => acc + d.amount, 0), [dues, nonExemptUserIds]);
    const totalPending = useMemo(() => dues.filter(d => d.status === 'Ödenmedi' && nonExemptUserIds.has(d.userId)).reduce((acc, d) => acc + d.amount, 0), [dues, nonExemptUserIds]);
    
    const totalExpense = useMemo(() => (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [expenses]);
    
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
                    <QuickAction label="Duyuru" icon={<MegaphoneIcon />} color="bg-amber-50" onClick={() => setCurrentPage('announcements')} />
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
                                    {[...blocks].sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true })).map(block => {
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
    const [role, setRole] = useState<UserRole>(currentUser.role === 'Yönetici' ? 'Daire Sahibi' : currentUser.role);
    const [plate1, setPlate1] = useState(currentUser.vehiclePlate1 || '');
    const [plate2, setPlate2] = useState(currentUser.vehiclePlate2 || '');
    const [phone1, setPhone1] = useState(currentUser.contactNumber1 || '');
    const [phone2, setPhone2] = useState(currentUser.contactNumber2 || '');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const [isDuesModalOpen, setDuesModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [objectionSuccessMsg, setObjectionSuccessMsg] = useState('');

    const [objectionActiveMonth, setObjectionActiveMonth] = useState<string | null>(null);
    const [selectedObjectionFile, setSelectedObjectionFile] = useState<{url: string, name: string, type: string} | null>(null);
    const objectionFileInputRef = useRef<HTMLInputElement>(null);
    
    // --- DEBT WARNING STATES ---
    const [showDebtWarning, setShowDebtWarning] = useState(false);
    const [debtWarningMessage, setDebtWarningMessage] = useState('');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    // --- PAYMENT NOTE DYNAMIC GENERATION ---
    const paymentNote = useMemo(() => {
        if (!siteInfo.note) return "";

        // 1. Find Location
        let blockName = "[Blok?]";
        let aptNo = "[No?]";

        for (const b of blocks) {
            const apt = b.apartments.find(a => a.residentId === currentUser.id);
            if (apt) {
                blockName = b.name;
                aptNo = apt.number;
                break;
            }
        }

        // 2. Date
        const date = new Date();
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const currentMonth = months[date.getMonth()];
        const currentYearStr = date.getFullYear().toString();

        // 3. Replace Placeholders (Case-insensitive)
        let text = siteInfo.note;
        text = text.replace(/\[Blok\]/gi, blockName);
        text = text.replace(/\[Daire\]/gi, aptNo); // Handle possible aliases
        text = text.replace(/\[No\]/gi, aptNo);
        text = text.replace(/\[İsim\]/gi, currentUser.name);
        text = text.replace(/\[Ay\]/gi, currentMonth);
        text = text.replace(/\[Yıl\]/gi, currentYearStr);

        return text;
    }, [siteInfo.note, blocks, currentUser]);

    // --- AUTOMATIC DEBT CHECK ---
    useEffect(() => {
        // Only run check if not exempt, settings allow it, and KVKK is approved (user has passed profile screen)
        if (currentUser.isDuesExempt || siteInfo.showLoginDuesModal === false || !currentUser.kvkkApproved) return;

        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const pastLookback = siteInfo.pastDebtLookbackYears || 2;
        const checkStartYear = currentYear - pastLookback; 
        
        let pastYearDebtFound = false;
        let currentYearDebtCount = 0;

        // 1. Check past years
        for (let y = checkStartYear; y < currentYear; y++) {
            if (pastYearDebtFound) break;
            for (const m of months) {
                const monthStr = `${m} ${y}`;
                const record = dues.find(d => d.userId === currentUser.id && d.month === monthStr);
                // If record doesn't exist or isn't 'Ödendi', it's a debt for past years
                if (!record || record.status !== 'Ödendi') {
                    // Check if objected (skip if actively objected, but normally past debt is debt)
                    const hasObjection = feedbacks.some(f => f.userId === currentUser.id && f.type === 'İtiraz' && f.subject.includes(monthStr) && f.status !== 'Arşivlendi');
                    if (!hasObjection) {
                        pastYearDebtFound = true;
                        break;
                    }
                }
            }
        }

        // 2. Check current year (up to current month)
        for (let i = 0; i <= currentMonthIdx; i++) {
            const monthStr = `${months[i]} ${currentYear}`;
            const record = dues.find(d => d.userId === currentUser.id && d.month === monthStr);
            if (!record || record.status !== 'Ödendi') {
                 const hasObjection = feedbacks.some(f => f.userId === currentUser.id && f.type === 'İtiraz' && f.subject.includes(monthStr) && f.status !== 'Arşivlendi');
                 if (!hasObjection) {
                     currentYearDebtCount++;
                 }
            }
        }

        if (pastYearDebtFound) {
            setDebtWarningMessage('Geçmiş yıllara ait ödenmemiş aidat borçlarınız bulunmaktadır.');
            setShowDebtWarning(true);
        } else if (currentYearDebtCount >= 3) { // Trigger only if 3 or more debts in current year to avoid annoyance on single miss
            setDebtWarningMessage(`${currentYear} yılı içerisinde ${currentYearDebtCount} adet ödenmemiş aidatınız bulunmaktadır.`);
            setShowDebtWarning(true);
        }

    }, [dues, currentUser, feedbacks, siteInfo.showLoginDuesModal, siteInfo.pastDebtLookbackYears]);


    useEffect(() => {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setRole(currentUser.role === 'Yönetici' ? 'Daire Sahibi' : currentUser.role);
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
        onUpdateUser({ ...currentUser, name, email, role, vehiclePlate1: plate1, vehiclePlate2: plate2, contactNumber1: phone1, contactNumber2: phone2 });
        setTimeout(() => {
            setSaveStatus('success');
            setIsEditing(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 500);
    };

    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const yearlyDuesStatus = useMemo(() => {
        return months.map((monthName, idx) => {
            const monthStr = `${monthName} ${selectedYear}`;
            const record = dues.find(d => d.userId === currentUser.id && d.month === monthStr);
            
            const isPast = selectedYear < currentYear || (selectedYear === currentYear && idx < currentMonthIdx);
            const isCurrent = selectedYear === currentYear && idx === currentMonthIdx;
            
            let status: 'Ödendi' | 'Ödenmedi' | 'Bekliyor' | 'İtiraz Edildi' = 'Bekliyor';
            
            if (record?.status === 'Ödendi') {
                status = 'Ödendi';
            } else {
                const hasObjection = feedbacks.some(f => 
                    f.userId === currentUser.id && 
                    f.type === 'İtiraz' && 
                    f.subject.includes(monthStr) &&
                    f.status !== 'Arşivlendi'
                );
                
                if (hasObjection) {
                    status = 'İtiraz Edildi';
                } else if (isPast || (isCurrent && record?.status === 'Ödenmedi')) {
                    status = 'Ödenmedi';
                }
            }
            
            return { monthName, status, amount: record?.amount || siteInfo.duesAmount };
        });
    }, [dues, currentUser, selectedYear, currentYear, currentMonthIdx, siteInfo.duesAmount, feedbacks, months]);

    const totalDebt = useMemo(() => {
        if (currentUser.isDuesExempt) return 0;

        const allPaidMonths = new Set(
            dues
                .filter(d => d.userId === currentUser.id && d.status === 'Ödendi')
                .map(d => d.month)
        );

        const allObjectedMonths = new Set(
            feedbacks
                .filter(f => f.userId === currentUser.id && f.type === 'İtiraz' && f.status !== 'Arşivlendi')
                .map(f => f.subject.split(': ')[1]?.trim())
                .filter(Boolean) as string[]
        );

        let debt = 0;
        const today = new Date();
        const pastLookback = siteInfo.pastDebtLookbackYears || 2;
        const startYear = today.getFullYear() - pastLookback;

        for (let year = startYear; year <= today.getFullYear(); year++) {
            const endMonth = (year === today.getFullYear()) ? today.getMonth() : 11;
            for (let monthIdx = 0; monthIdx <= endMonth; monthIdx++) {
                const monthStr = `${months[monthIdx]} ${year}`;
                if (!allPaidMonths.has(monthStr) && !allObjectedMonths.has(monthStr)) {
                    const dueRecord = dues.find(d => d.userId === currentUser.id && d.month === monthStr);
                    debt += dueRecord?.amount || siteInfo.duesAmount;
                }
            }
        }
        
        return debt;
    }, [dues, feedbacks, currentUser.id, currentUser.isDuesExempt, siteInfo.duesAmount, months, siteInfo.pastDebtLookbackYears]);

    const currentYearDuesStatus = useMemo(() => {
        return months.map((monthName, idx) => {
            const monthStr = `${monthName} ${currentYear}`;
            const record = dues.find(d => d.userId === currentUser.id && d.month === monthStr);
            const isPast = idx < currentMonthIdx;
            let status: 'Ödendi' | 'Ödenmedi' | 'Bekliyor' = 'Bekliyor';
            if (record?.status === 'Ödendi') status = 'Ödendi';
            else if (isPast) status = 'Ödenmedi';
            return { monthName, status, amount: record?.amount || siteInfo.duesAmount };
        });
    }, [dues, currentUser.id, currentYear, currentMonthIdx, siteInfo.duesAmount, months]);
    
    const hasPastUnpaid = useMemo(() => currentYearDuesStatus.some((item, idx) => idx < currentMonthIdx && item.status === 'Ödenmedi'), [currentYearDuesStatus, currentMonthIdx]);
    const isCurrentPaid = currentYearDuesStatus[currentMonthIdx].status === 'Ödendi';

    const handleObjectionClick = (monthName: string) => {
        setObjectionActiveMonth(monthName);
    };

    const handleObjectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) { // 1MB limit
            alert("Dosya boyutu çok büyük (Maksimum 1MB)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setSelectedObjectionFile({
                    url: ev.target.result as string,
                    name: file.name,
                    type: file.type
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleConfirmObjection = () => {
        if(!onAddFeedback || !objectionActiveMonth) return;
        
        setObjectionSuccessMsg(`${objectionActiveMonth} ayı için itiraz talebiniz oluşturuluyor...`);
        
        setTimeout(() => {
            onAddFeedback(
                currentUser.id, 
                'İtiraz', 
                `Aidat Ödeme İtirazı: ${objectionActiveMonth} ${selectedYear}`, 
                `${objectionActiveMonth} ${selectedYear} dönemine ait aidat borcum için itiraz ediyorum. ${selectedObjectionFile ? 'Dekont ekte sunulmuştur.' : 'Ödemenin kontrol edilmesini rica ederim.'}`,
                selectedObjectionFile || undefined
            );
            setObjectionSuccessMsg(`${objectionActiveMonth} ayı için itirazınız başarıyla mavi renkli olarak kaydedildi ve yönetime iletildi.`);
            setObjectionActiveMonth(null);
            setSelectedObjectionFile(null);
            setTimeout(() => setObjectionSuccessMsg(''), 4000);
        }, 1000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2">
            
            {/* --- DEBT WARNING MODAL --- */}
            {showDebtWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex justify-center items-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-rose-600"></div>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 border-4 border-rose-100">
                                <svg className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Ödenmemiş Aidat Uyarısı</h3>
                            <p className="text-sm font-medium text-gray-600 mb-8 leading-relaxed">
                                {debtWarningMessage}
                                <br/>
                                <span className="text-xs text-rose-500 mt-2 block font-bold">Lütfen ödemelerinizi kontrol ediniz.</span>
                            </p>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDebtWarning(false)}
                                    className="flex-1 py-3.5 text-gray-500 font-black text-xs uppercase hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Kapat
                                </button>
                                <button 
                                    onClick={() => { setShowDebtWarning(false); setCurrentPage('dues'); }}
                                    className="flex-[2] py-3.5 bg-rose-600 text-white font-black text-xs uppercase rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                                >
                                    Detayları İncele
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of the dashboard content... */}
            {isDuesModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Dues Modal Content... (Same as before) */}
                        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{selectedYear} Yılı Aidat Durumu</h3>
                                <p className="text-indigo-200 text-xs font-bold uppercase mt-2 tracking-widest italic">* Geçmiş aylarda kaydı bulunmayan aidatlar borç sayılır</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-indigo-500/50 p-1 rounded-xl">
                                    <span className="text-[10px] font-black text-indigo-100 uppercase ml-2">Yıl:</span>
                                    <select 
                                        value={selectedYear} 
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-indigo-500 border border-indigo-400 rounded-lg px-2 py-1 text-sm font-black text-white outline-none appearance-none"
                                        style={{ background: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23fff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E") no-repeat right 0.5rem center/1.5em 1.5em', paddingRight: '2rem' }}
                                    >
                                        {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                                            <option key={y} value={y} className="text-black">{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={() => setDuesModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        {currentUser.isDuesExempt && (
                            <div className="px-8 py-3 bg-indigo-50 text-indigo-700 text-xs font-black uppercase border-b border-indigo-100 flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Sayın Sakin, Aidat Ödemelerinden Muaf Durumdasınız.
                            </div>
                        )}
                        {objectionSuccessMsg && (
                            <div className="px-8 py-3 bg-blue-50 text-blue-800 text-[10px] font-black uppercase border-b border-blue-100 flex items-center">
                                <svg className="w-4 h-4 mr-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {objectionSuccessMsg}
                            </div>
                        )}
                        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {yearlyDuesStatus.map((item, idx) => (
                                    <div key={idx} className={`p-5 rounded-3xl border flex flex-col shadow-sm transition-all hover:shadow-md bg-white ${item.status === 'Ödendi' ? 'border-green-300 ring-2 ring-green-100 bg-green-50/20 scale-[1.01]' : item.status === 'İtiraz Edildi' ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100 scale-[1.02] shadow-blue-100 shadow-lg' : item.status === 'Ödenmedi' ? 'border-rose-100 ring-1 ring-rose-50' : 'border-gray-100 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
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
                                                    {currentUser.isDuesExempt && item.status !== 'Ödendi' ? 'MUAF' : item.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {!currentUser.isDuesExempt && item.status === 'Ödenmedi' && objectionActiveMonth !== item.monthName && (
                                            <button onClick={() => handleObjectionClick(item.monthName)} className="mt-4 flex items-center justify-center gap-2 py-2 bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 uppercase rounded-xl hover:bg-rose-100 transition-all shadow-sm">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                İtiraz Et
                                            </button>
                                        )}

                                        {objectionActiveMonth === item.monthName && (
                                            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex flex-col gap-3">
                                                    <input type="file" ref={objectionFileInputRef} onChange={handleObjectionFileChange} className="hidden" accept="image/*,application/pdf" />
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">İtiraz Talebi</p>
                                                        <button onClick={() => setObjectionActiveMonth(null)} className="text-gray-400 hover:text-rose-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                    </div>
                                                    
                                                    {selectedObjectionFile ? (
                                                        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-indigo-100">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                                            <p className="text-[10px] font-black text-gray-700 truncate flex-1 uppercase">{selectedObjectionFile.name}</p>
                                                            <button onClick={() => setSelectedObjectionFile(null)} className="text-rose-500 font-bold text-[10px] hover:underline uppercase">Sil</button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => objectionFileInputRef.current?.click()}
                                                            className="flex items-center justify-center gap-2 py-2 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-xl hover:border-indigo-400 hover:bg-white transition-all text-[10px] font-black uppercase"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                            Dekont Ekle
                                                        </button>
                                                    )}

                                                    <button 
                                                        onClick={handleConfirmObjection}
                                                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                                    >
                                                        Talebi Gönder
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                <StatCard title="Aidat Durumu" value={currentUser.isDuesExempt ? 'Muaf' : (isCurrentPaid && !hasPastUnpaid ? 'Ödendi' : `₺${totalDebt.toLocaleString()}`)} icon={<CashIcon />} onClick={() => setDuesModalOpen(true)} trend={isCurrentPaid && !hasPastUnpaid ? 'up' : 'down'} trendValue={isCurrentPaid && !hasPastUnpaid ? 'Güncel' : (totalDebt > 0 ? 'Borcunuz bulunmaktadır' : 'Ödeme Bekliyor')} colorClass={isCurrentPaid && !hasPastUnpaid ? 'bg-green-600' : 'bg-rose-600'} />
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
                        
                        {/* ... Plate results ... */}
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
                        {/* ... Error message ... */}
                        {plateSearchError && (
                            <div className="mt-6 bg-rose-50 border-l-8 border-rose-500 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center text-rose-700">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="text-[11px] font-black uppercase tracking-tight">Kayıt Bulunamadı</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Bank Info Card */}
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-700/50">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-6 flex items-center gap-2">
                                <CashIcon className="w-4 h-4" />
                                Banka & Ödeme
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Banka</p>
                                    <p className="font-black text-xl tracking-tight">{siteInfo.bankName}</p>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">IBAN</p>
                                    <div 
                                        onClick={() => handleCopy(siteInfo.iban, 'iban')}
                                        className="bg-white/10 hover:bg-white/20 transition-all cursor-pointer rounded-2xl p-4 border border-white/5 group relative"
                                    >
                                        <p className="font-mono text-sm font-bold tracking-widest break-all leading-relaxed">{siteInfo.iban}</p>
                                        {copiedField === 'iban' ? (
                                            <span className="absolute right-2 top-2 text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-md font-bold">Kopyalandı</span>
                                        ) : (
                                            <ClipboardIcon className="w-4 h-4 absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-200" />
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Ödeme Açıklaması</p>
                                        <span className="text-[9px] bg-indigo-500/30 px-2 py-0.5 rounded text-indigo-200 font-bold">Otomatik</span>
                                    </div>
                                    <div 
                                        onClick={() => handleCopy(paymentNote, 'note')}
                                        className="bg-indigo-950/50 hover:bg-indigo-900/50 transition-all cursor-pointer rounded-2xl p-4 border border-indigo-700/50 group relative"
                                    >
                                        <p className="font-mono text-xs font-bold text-indigo-100 leading-relaxed">{paymentNote}</p>
                                        {copiedField === 'note' ? (
                                            <span className="absolute right-2 bottom-2 text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-md font-bold">Kopyalandı</span>
                                        ) : (
                                            <ClipboardIcon className="w-4 h-4 absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                                        )}
                                    </div>
                                    <p className="text-[9px] mt-3 text-indigo-300/60 font-medium leading-relaxed">
                                        * Banka uygulamanızda açıklama kısmına bu metni yapıştırmanız ödemenizin anında onaylanmasını sağlar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = (props) => {
    if (props.currentUser.role === 'Yönetici' && !props.isResidentViewMode) {
        return <ManagerDashboard {...props} />;
    }
    return <ResidentDashboard {...props} />;
};

export default Dashboard;
