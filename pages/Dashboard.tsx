
import React, { useMemo, useState, useEffect } from 'react';
import { User, Block, Dues, Announcement, Page, SiteInfo, Feedback } from '../types';
import PlateInquiry from './PlateInquiry';

interface DashboardProps {
    currentUser: User;
    users: User[];
    blocks: Block[];
    dues: Dues[];
    announcements: Announcement[];
    siteInfo: SiteInfo;
    setCurrentPage: (page: Page) => void;
    isResidentViewMode?: boolean;
    feedbacks?: Feedback[];
}

// --- SVG ICONS ---
// Added missing icons used in the dashboard
const UsersIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 13a5.995 5.995 0 003-1.197" /></svg>;
const CashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MegaphoneIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>;
const BuildingIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const ExclamationIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const InboxIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const UserAddIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;

// --- UI KÜÇÜK BİLEŞENLER ---

const LiveIndicator = () => (
    <div className="flex items-center space-x-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Canlı</span>
    </div>
);

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass: string;
}> = ({ title, value, icon, trend, trendValue, colorClass }) => (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all duration-300">
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{title}</p>
            <h3 className="text-xl md:text-3xl font-black text-gray-800">{value}</h3>
            {trend && (
                <div className={`hidden md:flex items-center mt-3 text-xs font-bold px-2 py-0.5 rounded-full w-fit ${trend === 'up' ? 'bg-green-50 text-green-600' : trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} 
                    <span className="ml-1">{trendValue}</span>
                </div>
            )}
        </div>
        <div className={`p-3 md:p-4 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0`}>
            {React.cloneElement(icon as React.ReactElement, { className: `w-5 h-5 md:w-7 md:h-7 ${colorClass.replace('bg-', 'text-')}` })}
        </div>
    </div>
);

// --- YÖNETİCİ GÖRÜNÜMÜ ---

const ManagerDashboard: React.FC<{ 
    users: User[]; 
    blocks: Block[]; 
    dues: Dues[]; 
    announcements: Announcement[];
    siteInfo: SiteInfo;
    feedbacks: Feedback[];
    setCurrentPage: (page: Page) => void;
}> = ({ users, blocks, dues, announcements, siteInfo, feedbacks, setCurrentPage }) => {
    
    const totalApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.length, 0), [blocks]);
    const occupiedApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.filter(a => a.status === 'Dolu').length, 0), [blocks]);
    const occupancyRate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;
    const totalResidents = useMemo(() => users.filter(u => u.role !== 'Yönetici').length, [users]);
    const totalCollected = useMemo(() => dues.filter(d => d.status === 'Ödendi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const totalPending = useMemo(() => dues.filter(d => d.status === 'Ödenmedi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const collectionRate = (totalCollected + totalPending) > 0 ? Math.round((totalCollected / (totalCollected + totalPending)) * 100) : 0;
    const newFeedbacks = useMemo(() => feedbacks.filter(f => f.status === 'Yeni').length, [feedbacks]);

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-2">
            {/* Stats Row - Mobil 2 Sütun */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard title="Toplam Sakin" value={totalResidents} icon={<UsersIcon />} trend="up" trendValue="%2 Artış" colorClass="bg-blue-600" />
                <StatCard title="Tahsilat" value={`%${collectionRate}`} icon={<CashIcon />} trend={collectionRate > 85 ? 'up' : 'down'} trendValue="Hedef %90" colorClass="bg-green-600" />
                <StatCard title="Bekleyen" value={`₺${totalPending.toLocaleString()}`} icon={<ExclamationIcon />} trend="neutral" trendValue="Son 30 Gün" colorClass="bg-rose-600" />
                <StatCard title="Bildirim" value={newFeedbacks} icon={<InboxIcon />} trend="up" trendValue="Acil" colorClass="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                {/* Main Visual Data Section */}
                <div className="lg:col-span-2 space-y-4 md:space-y-8">
                    <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6 md:mb-10">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-gray-900">Site Operasyon Özeti</h3>
                                <p className="text-[10px] md:text-sm text-gray-400 font-medium uppercase tracking-tight">Verimlilik Analizi</p>
                            </div>
                            <LiveIndicator />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {/* SVG Donut Chart */}
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <svg className="w-40 h-40 md:w-48 md:h-48 transform -rotate-90" viewBox="0 0 192 192">
                                        <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="16" fill="transparent" />
                                        <circle 
                                            cx="96" cy="96" r="80" stroke="url(#blueGradient)" strokeWidth="16" fill="transparent" 
                                            strokeDasharray={502.4} 
                                            strokeDashoffset={502.4 - (502.4 * occupancyRate) / 100}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#4f46e5" />
                                                <stop offset="100%" stopColor="#818cf8" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">%{occupancyRate}</span>
                                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dolu</span>
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Toplam</p>
                                        <p className="text-base md:text-lg font-black text-gray-800">{totalApartments}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Boş</p>
                                        <p className="text-base md:text-lg font-black text-indigo-600">{totalApartments - occupiedApartments}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Bars */}
                            <div className="space-y-6 md:space-y-8 flex flex-col justify-center">
                                <h4 className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Gelir Durumu</h4>
                                <div className="space-y-5 md:space-y-6">
                                    <div className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between">
                                            <span className="text-[10px] font-bold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">Ödenen</span>
                                            <div className="text-right"><span className="text-[10px] md:text-xs font-black inline-block text-green-600">₺{totalCollected.toLocaleString()}</span></div>
                                        </div>
                                        <div className="overflow-hidden h-1.5 md:h-2 mb-4 text-xs flex rounded-full bg-green-100">
                                            <div style={{ width: `${(totalCollected / (totalCollected + totalPending || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-1000"></div>
                                        </div>
                                    </div>
                                    <div className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between">
                                            <span className="text-[10px] font-bold inline-block py-1 px-2 uppercase rounded-full text-rose-600 bg-rose-100">Bekleyen</span>
                                            <div className="text-right"><span className="text-[10px] md:text-xs font-black inline-block text-rose-600">₺{totalPending.toLocaleString()}</span></div>
                                        </div>
                                        <div className="overflow-hidden h-1.5 md:h-2 mb-4 text-xs flex rounded-full bg-rose-100">
                                            <div style={{ width: `${(totalPending / (totalCollected + totalPending || 1)) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-500 transition-all duration-1000"></div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setCurrentPage('duesManagement')} className="w-full py-3 md:py-4 bg-gray-900 text-white rounded-2xl font-bold text-xs md:text-sm hover:bg-black transition-all shadow-md">
                                    Aidat Raporunu Detaylı Gör
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Announcements Highlights */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <MegaphoneIcon className="w-32 h-32 md:w-40 md:h-40" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl font-black mb-3">Son Duyuru</h3>
                            {announcements.length > 0 ? (
                                <>
                                    <h4 className="text-base md:text-xl font-bold opacity-90 mb-1">{announcements[0].title}</h4>
                                    <p className="text-xs md:text-sm opacity-75 line-clamp-2 max-w-md mb-4">{announcements[0].content}</p>
                                    <button onClick={() => setCurrentPage('announcements')} className="bg-white text-indigo-600 px-5 py-2 rounded-xl text-[10px] md:text-sm font-bold hover:shadow-lg transition-all">
                                        Tümünü Gör
                                    </button>
                                </>
                            ) : <p className="opacity-75">Henüz bir duyuru bulunmuyor.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Quick Info */}
                <div className="space-y-4 md:space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-5 md:mb-6">Hızlı İşlemler</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {[
                                { label: 'Üye Ekle', icon: <UserAddIcon />, page: 'users', color: 'bg-blue-50 text-blue-600' },
                                { label: 'Duyuru', icon: <MegaphoneIcon />, page: 'admin', color: 'bg-orange-50 text-orange-600' },
                                { label: 'Aidat', icon: <CashIcon />, page: 'duesManagement', color: 'bg-green-50 text-green-600' },
                                { label: 'Gider', icon: <ExclamationIcon />, page: 'expenses', color: 'bg-rose-50 text-rose-600' }
                            ].map((action, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentPage(action.page as Page)}
                                    className={`${action.color} p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 md:space-y-2 hover:scale-[1.03] transition-all font-bold border border-transparent`}
                                >
                                    {React.cloneElement(action.icon as React.ReactElement, { className: "w-5 h-5 md:w-6 md:h-6" })}
                                    <span className="text-[9px] md:text-[11px] uppercase tracking-tighter">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                         <h3 className="text-lg md:text-xl font-black text-gray-900 mb-5 md:mb-6">Site Bilgileri</h3>
                         <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="p-2 md:p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <BuildingIcon className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Banka</p>
                                    <p className="text-xs md:text-sm font-black text-gray-800 truncate">{siteInfo.bankName}</p>
                                </div>
                            </div>
                            <div className="p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">IBAN</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] md:text-xs font-mono font-bold text-gray-700 truncate">{siteInfo.iban}</p>
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(siteInfo.iban); alert('Kopyalandı!');}}
                                        className="p-1.5 md:p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SAKİN GÖRÜNÜMÜ ---

const ResidentDashboard: React.FC<{ 
    currentUser: User;
    dues: Dues[]; 
    announcements: Announcement[];
    siteInfo: SiteInfo;
    setCurrentPage: (page: Page) => void;
}> = ({ currentUser, dues, announcements, siteInfo, setCurrentPage }) => {
    const myDues = dues.filter(d => d.userId === currentUser.id);
    const unpaidDues = myDues.filter(d => d.status === 'Ödenmedi');
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Hoş Geldiniz, {currentUser.name}</h2>
                <p className="text-gray-500">Site yönetim paneline hoş geldiniz. Buradan aidatlarınızı takip edebilir ve duyuruları inceleyebilirsiniz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Aidat Durumu</h3>
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CashIcon className="w-6 h-6" />
                        </div>
                    </div>
                    {unpaidDues.length > 0 ? (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <p className="text-red-700 font-bold">{unpaidDues.length} adet ödenmemiş aidatınız bulunmaktadır.</p>
                            <button onClick={() => setCurrentPage('dues')} className="mt-2 text-red-600 font-bold hover:underline">Detayları Gör</button>
                        </div>
                    ) : (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <p className="text-green-700 font-bold">Tüm aidatlarınız ödenmiş görünüyor. Teşekkürler!</p>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Son Duyuru</h3>
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <MegaphoneIcon className="w-6 h-6" />
                        </div>
                    </div>
                    {announcements.length > 0 ? (
                        <div>
                            <h4 className="font-bold text-gray-900">{announcements[0].title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{announcements[0].content}</p>
                            <button onClick={() => setCurrentPage('announcements')} className="mt-2 text-indigo-600 font-bold hover:underline">Tümünü Gör</button>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Henüz bir duyuru bulunmuyor.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ANA DASHBOARD BİLEŞENİ ---

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser, isResidentViewMode } = props;
    const isAdmin = currentUser.role === 'Yönetici' && !isResidentViewMode;

    if (isAdmin) {
        return <ManagerDashboard {...props} feedbacks={props.feedbacks || []} />;
    }

    return <ResidentDashboard 
        currentUser={currentUser} 
        dues={props.dues} 
        announcements={props.announcements} 
        siteInfo={props.siteInfo} 
        setCurrentPage={props.setCurrentPage} 
    />;
};

export default Dashboard;
