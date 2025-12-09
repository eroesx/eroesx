
import React, { useMemo, useState } from 'react';
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

// --- UI COMPONENTS ---

const CircularProgress: React.FC<{ percentage: number; color: string; size?: number; strokeWidth?: number; children?: React.ReactNode }> = ({ 
    percentage, 
    color, 
    size = 120, 
    strokeWidth = 10,
    children 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-gray-100"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-gray-700">
                {children}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    colorClass: string;
}> = ({ title, value, icon, trend, trendValue, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow duration-300">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            {trend && (
                <div className={`flex items-center mt-2 text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} 
                    <span className="ml-1">{trendValue}</span>
                </div>
            )}
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
            {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${colorClass.replace('bg-', 'text-')}` })}
        </div>
    </div>
);

const ActivityItem: React.FC<{ title: string; desc: string; time: string; type: 'payment' | 'user' | 'alert' }> = ({ title, desc, time, type }) => {
    const bgColors = {
        payment: 'bg-green-100 text-green-600',
        user: 'bg-blue-100 text-blue-600',
        alert: 'bg-orange-100 text-orange-600'
    };
    const icons = {
        payment: <CashIcon />,
        user: <UserAddIcon />,
        alert: <MegaphoneIcon />
    };

    return (
        <div className="flex items-start space-x-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
            <div className={`flex-shrink-0 p-2 rounded-full ${bgColors[type]}`}>
                {React.cloneElement(icons[type] as React.ReactElement, { className: "w-4 h-4" })}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                <p className="text-xs text-gray-500 truncate">{desc}</p>
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">{time}</div>
        </div>
    );
};

const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
    const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
    return (
        <div className="mb-3 last:mb-0">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-semibold text-gray-600">{label}</span>
                <span className="text-xs text-gray-500">{value}/{total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

// --- SUB-DASHBOARDS ---

const ManagerDashboard: React.FC<{ 
    users: User[]; 
    blocks: Block[]; 
    dues: Dues[]; 
    announcements: Announcement[];
    siteInfo: SiteInfo;
    feedbacks: Feedback[];
    setCurrentPage: (page: Page) => void;
}> = ({ users, blocks, dues, announcements, siteInfo, feedbacks, setCurrentPage }) => {
    
    // 1. Statistics
    const totalApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.length, 0), [blocks]);
    const occupiedApartments = useMemo(() => blocks.reduce((acc, b) => acc + b.apartments.filter(a => a.status === 'Dolu').length, 0), [blocks]);
    const occupancyRate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;

    const totalResidents = useMemo(() => users.filter(u => u.role !== 'Yönetici').length, [users]);
    
    // Financials (Simple approximation)
    const totalDuesExpected = dues.length * siteInfo.duesAmount; // Rough estimate based on generated records
    const totalCollected = useMemo(() => dues.filter(d => d.status === 'Ödendi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const totalPending = useMemo(() => dues.filter(d => d.status === 'Ödenmedi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const collectionRate = (totalCollected + totalPending) > 0 ? Math.round((totalCollected / (totalCollected + totalPending)) * 100) : 0;

    const newFeedbacks = useMemo(() => feedbacks.filter(f => f.status === 'Yeni').length, [feedbacks]);

    // 2. Activity Feed Generation (Mocking realtime feel from static data)
    const activityFeed = useMemo(() => {
        const activities = [];
        
        // Add recent users
        [...users].sort((a, b) => b.id - a.id).slice(0, 3).forEach(u => {
            activities.push({
                id: `u-${u.id}`,
                title: 'Yeni Sakin Kaydı',
                desc: `${u.name} sisteme eklendi.`,
                time: 'Bugün',
                type: 'user' as const,
                date: new Date().getTime() // Mock timestamp
            });
        });

        // Add recent payments (mock based on paid status)
        dues.filter(d => d.status === 'Ödendi').slice(0, 3).forEach((d, idx) => {
            const u = users.find(user => user.id === d.userId);
            activities.push({
                id: `d-${d.id}`,
                title: 'Aidat Ödemesi',
                desc: `${u?.name || 'Bilinmeyen'} ödeme yaptı.`,
                time: `${idx + 1} saat önce`,
                type: 'payment' as const,
                date: new Date().getTime() - (idx * 3600000)
            });
        });

        // Add recent announcements
        announcements.slice(0, 2).forEach(a => {
             activities.push({
                id: `a-${a.id}`,
                title: 'Duyuru Yayınlandı',
                desc: a.title,
                time: a.date,
                type: 'alert' as const,
                date: new Date().getTime() // Mock
            });
        });

        return activities.sort(() => 0.5 - Math.random()).slice(0, 6); // Shuffle for dynamic look
    }, [users, dues, announcements]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Toplam Sakin" 
                    value={totalResidents} 
                    icon={<UsersIcon />} 
                    trend="up" 
                    trendValue="%5 Artış" 
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatCard 
                    title="Tahsilat Oranı" 
                    value={`%${collectionRate}`} 
                    icon={<CashIcon />} 
                    trend={collectionRate > 80 ? 'up' : 'down'}
                    trendValue="Bu Ay" 
                    colorClass="bg-green-500 text-green-500"
                />
                <StatCard 
                    title="Bekleyen Ödeme" 
                    value={`₺${totalPending.toLocaleString()}`} 
                    icon={<ExclamationIcon />} 
                    trend="neutral"
                    trendValue={`${dues.filter(d => d.status === 'Ödenmedi').length} Kişi`}
                    colorClass="bg-red-500 text-red-500"
                />
                <div 
                    onClick={() => setCurrentPage('feedback')}
                    className="cursor-pointer transform transition hover:scale-105"
                >
                    <StatCard 
                        title="Yeni Bildirim" 
                        value={newFeedbacks} 
                        icon={<InboxIcon />} 
                        trend="neutral"
                        trendValue="Okunmamış" 
                        colorClass="bg-orange-500 text-orange-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Occupancy & Financials */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Main Chart Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Site Durum Özeti</h3>
                            <div className="flex space-x-2">
                                <span className="px-3 py-1 bg-gray-100 text-xs rounded-full text-gray-600 font-medium">Bu Ay</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* Occupancy Donut */}
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Doluluk Oranı</h4>
                                <CircularProgress percentage={occupancyRate} color="text-indigo-600" size={160} strokeWidth={12}>
                                    <span className="text-3xl font-bold text-indigo-700">%{occupancyRate}</span>
                                    <span className="text-xs text-gray-500 font-medium mt-1">{occupiedApartments} / {totalApartments} Dolu</span>
                                </CircularProgress>
                            </div>

                            {/* Financial Bars */}
                            <div className="flex flex-col justify-center h-full">
                                <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Finansal Denge</h4>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">Toplanan Aidat</span>
                                            <span className="font-bold text-gray-900">₺{totalCollected.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(totalCollected / (totalCollected + totalPending + 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">Bekleyen Alacak</span>
                                            <span className="font-bold text-gray-900">₺{totalPending.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div className="bg-red-500 h-3 rounded-full" style={{ width: `${(totalPending / (totalCollected + totalPending + 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
                                        <p className="text-xs text-blue-700">
                                            <span className="font-bold">Bilgi:</span> Aidat ödemeleri her ayın 1'i ile 15'i arasında yapılmalıdır.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Block Occupancy List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Blok Bazlı Doluluk</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {blocks.map(block => (
                                <ProgressBar 
                                    key={block.id} 
                                    label={block.name} 
                                    total={block.apartments.length} 
                                    value={block.apartments.filter(a => a.status === 'Dolu').length} 
                                    color="bg-indigo-500"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity & Quick Actions */}
                <div className="space-y-6">
                    
                    {/* Activity Feed */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Son Aktiviteler</h3>
                        <div className="max-h-[300px] overflow-y-auto pr-1">
                            {activityFeed.map((activity, idx) => (
                                <ActivityItem 
                                    key={idx}
                                    title={activity.title}
                                    desc={activity.desc}
                                    time={activity.time}
                                    type={activity.type}
                                />
                            ))}
                        </div>
                        <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">Tümünü Gör</button>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Hızlı Menü</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setCurrentPage('users')} className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex flex-col items-center text-center">
                                <UserAddIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Üye Ekle</span>
                            </button>
                            <button onClick={() => setCurrentPage('admin')} className="p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition flex flex-col items-center text-center">
                                <MegaphoneIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Duyuru</span>
                            </button>
                            <button onClick={() => setCurrentPage('duesManagement')} className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex flex-col items-center text-center">
                                <CashIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Aidat</span>
                            </button>
                            <button onClick={() => setCurrentPage('blockManagement')} className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition flex flex-col items-center text-center">
                                <BuildingIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Bloklar</span>
                            </button>
                        </div>
                    </div>

                    {/* Bank Info Mini Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-sm opacity-90">Site Hesabı</h4>
                            <CashIcon className="w-5 h-5 opacity-70" />
                        </div>
                        <p className="text-xs opacity-70 mb-1">{siteInfo.bankName}</p>
                        <p className="font-mono text-sm truncate opacity-95">{siteInfo.iban}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResidentDashboard: React.FC<{ 
    user: User; 
    users: User[];
    blocks: Block[];
    dues: Dues[]; 
    announcements: Announcement[];
    siteInfo: SiteInfo;
    setCurrentPage: (page: Page) => void;
}> = ({ user, users, blocks, dues, announcements, siteInfo, setCurrentPage }) => {
    
    const myUnpaidDues = useMemo(() => dues.filter(d => d.userId === user.id && d.status === 'Ödenmedi'), [dues, user]);
    const totalDebt = myUnpaidDues.reduce((acc, curr) => acc + curr.amount, 0);
    const latestAnnouncement = announcements[0];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Plate Inquiry for Resident Dashboard */}
            <div className="mb-6">
                <PlateInquiry users={users} blocks={blocks} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Debt Card */}
                <div className={`p-6 rounded-xl shadow-sm border relative overflow-hidden ${totalDebt > 0 ? 'bg-white border-red-200' : 'bg-white border-green-200'}`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full opacity-10 ${totalDebt > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-lg font-bold text-gray-800">Finansal Durum</h3>
                        <div className={`p-2 rounded-full ${totalDebt > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {totalDebt > 0 ? <CashIcon className="w-6 h-6" /> : <ShieldCheckIcon className="w-6 h-6" />}
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        {totalDebt > 0 ? (
                            <>
                                <p className="text-3xl font-bold text-red-600 mb-1">₺{totalDebt.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 mb-4">Toplam {myUnpaidDues.length} adet ödenmemiş faturanız bulunmaktadır.</p>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                                </div>
                                <button 
                                    onClick={() => setCurrentPage('dues')} 
                                    className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm flex items-center justify-center"
                                >
                                    <span>Ödeme Yap</span>
                                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-green-600 mb-1">Borcunuz Yok</p>
                                <p className="text-sm text-gray-500 mb-4">Tüm ödemeleriniz güncel. Teşekkürler!</p>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                                <button 
                                    onClick={() => setCurrentPage('dues')} 
                                    className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                                >
                                    Geçmişi Görüntüle
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Announcement Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <MegaphoneIcon className="w-5 h-5 mr-2 text-indigo-600" />
                                Son Duyuru
                            </h3>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{latestAnnouncement?.date}</span>
                        </div>
                        {latestAnnouncement ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-2 text-lg">{latestAnnouncement.title}</h4>
                                <p className="text-gray-600 line-clamp-2">{latestAnnouncement.content}</p>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">Henüz bir duyuru bulunmuyor.</p>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={() => setCurrentPage('announcements')} 
                            className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center text-sm"
                        >
                            Tüm Duyurular <ArrowRightIcon className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dues Info Card */}
                <div className="md:col-span-1">
                    <DuesInfoCard siteInfo={siteInfo} />
                </div>
                
                {/* Quick Info */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center h-full justify-between px-8">
                        <div className="flex items-center">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-full mr-4">
                                <TruckIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Kayıtlı Araç</p>
                                <p className="text-xl font-bold text-gray-800">{user.vehiclePlate1 || 'Araç Yok'}</p>
                            </div>
                        </div>
                        <div className="h-12 w-px bg-gray-200 mx-4 hidden sm:block"></div>
                        <div className="flex items-center hidden sm:flex">
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-full mr-4">
                                <BuildingIcon />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Blok / Daire</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {/* Logic to find block info would go here, passed as prop optimally */}
                                    Kayıtlı
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser, users, blocks, dues, announcements, siteInfo, setCurrentPage, isResidentViewMode, feedbacks } = props;

    // Determine if we should show the Manager Dashboard
    // It is shown ONLY if user is Manager AND not in forced resident view mode.
    const showManagerView = currentUser.role === 'Yönetici' && !isResidentViewMode;

  return (
    <div>
        {/* Only show PlateInquiry if we are in the Manager View */}
        {showManagerView && (
            <div className="mb-8">
                <PlateInquiry users={users} blocks={blocks} />
            </div>
        )}

        {showManagerView ? (
            <ManagerDashboard 
                users={users} 
                blocks={blocks} 
                dues={dues} 
                announcements={announcements} 
                siteInfo={siteInfo}
                setCurrentPage={setCurrentPage}
                feedbacks={feedbacks || []}
            />
        ) : (
            <ResidentDashboard 
                user={currentUser} 
                users={users}
                blocks={blocks}
                dues={dues} 
                announcements={announcements} 
                siteInfo={siteInfo}
                setCurrentPage={setCurrentPage}
            />
        )}
    </div>
  );
};

// Reused Components (DuesInfoCard etc.)
const DuesInfoCard: React.FC<{ siteInfo: SiteInfo }> = ({ siteInfo }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(siteInfo.iban);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col justify-between">
             {/* Decorative Circles */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-indigo-500 opacity-20 blur-xl"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-100">Aidat Bilgileri</h3>
                        <p className="text-xs text-gray-400">Ödeme Detayları</p>
                    </div>
                    <div className="p-2 bg-white/10 rounded-lg">
                        <CashIcon />
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Aylık Tutar</p>
                    <p className="text-3xl font-bold text-white">₺{siteInfo.duesAmount}</p>
                </div>

                <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/5 mb-4 group">
                    <p className="text-xs text-gray-400 mb-1">{siteInfo.bankName}</p>
                    <div className="flex items-center justify-between">
                         <p className="font-mono text-sm tracking-wide truncate mr-2 opacity-90">{siteInfo.iban}</p>
                         <button 
                            onClick={handleCopy} 
                            className="p-1.5 hover:bg-white/20 rounded transition-colors"
                            title="IBAN Kopyala"
                         >
                            {copied ? (
                                <span className="text-green-400 text-xs font-bold">OK</span>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            )}
                         </button>
                    </div>
                </div>
                
                {siteInfo.note && (
                    <div className="text-xs text-yellow-200/80 mt-auto bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                       {siteInfo.note}
                    </div>
                )}
            </div>
        </div>
    );
};

// Icons (Tailwind Heroicons)
const BuildingIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const CashIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MegaphoneIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>;
const UserAddIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const ShieldCheckIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 018.618-3.04 11.955 11.955 0 018.618 3.04A12.02 12.02 0 0021 5.944a11.955 11.955 0 01-2.382-1.008z" /></svg>;
const ArrowRightIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const TruckIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2v0" /></svg>;
const UsersIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 13a5.995 5.995 0 003-1.197" /></svg>;
const ExclamationIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const InboxIcon = ({ className = "h-6 w-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;

export default Dashboard;
