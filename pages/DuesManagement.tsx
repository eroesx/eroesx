
import React, { useState, useMemo, useEffect } from 'react';
import { User, Block, Dues, SiteInfo } from '../types';

interface DuesManagementProps {
    users: User[];
    blocks: Block[];
    allDues: Dues[];
    siteInfo: SiteInfo;
    onUpdateDues: (userId: number, month: string, status: 'Ödendi' | 'Ödenmedi', amount: number) => void;
}

const DuesManagement: React.FC<DuesManagementProps> = ({ users, blocks, allDues, siteInfo, onUpdateDues }) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const [viewMode, setViewMode] = useState<'analysis' | 'list'>('analysis');
    const [selectedMonth, setSelectedMonth] = useState<string>(months[currentMonthIdx]);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [defaultAmount, setDefaultAmount] = useState<number>(siteInfo.duesAmount);
    
    // Filters for list view
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

    const fullMonthString = `${selectedMonth} ${selectedYear}`;

    // Calculate Last 3 Months
    const last3Months = useMemo(() => {
        const result = [];
        for (let i = 0; i < 3; i++) {
            let mIdx = currentMonthIdx - i;
            let y = currentYear;
            if (mIdx < 0) {
                mIdx += 12;
                y -= 1;
            }
            result.push(`${months[mIdx]} ${y}`);
        }
        return result.reverse(); // Chronological order
    }, [currentMonthIdx, currentYear]);

    // Data Aggregation for Analysis
    const analyticsData = useMemo(() => {
        return blocks.map(block => {
            const blockStats = last3Months.map(monthStr => {
                const blockApts = block.apartments;
                const residentIds = blockApts.map(a => a.residentId).filter(id => id !== undefined);
                
                const monthDues = allDues.filter(d => d.month === monthStr && residentIds.includes(d.userId));
                const paidCount = monthDues.filter(d => d.status === 'Ödendi').length;
                const totalExpected = residentIds.length;
                const percentage = totalExpected > 0 ? Math.round((paidCount / totalExpected) * 100) : 0;
                
                return { month: monthStr, paidCount, totalExpected, percentage };
            });

            const totalPaid = blockStats.reduce((sum, s) => sum + s.paidCount, 0);
            const totalExpected = blockStats.reduce((sum, s) => sum + s.totalExpected, 0);
            const averagePercentage = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

            return {
                id: block.id,
                name: block.name,
                stats: blockStats,
                averagePercentage,
                totalPaid,
                totalExpected
            };
        });
    }, [blocks, allDues, last3Months]);

    const getUserLocationInfo = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) return { text: `${block.name} - No: ${apt.number}`, blockId: block.id };
        }
        return { text: 'Atanmamış', blockId: -1 };
    };

    const filteredResidents = useMemo(() => {
        let result = users.filter(u => u.isActive && (u.role !== 'Yönetici' || (u.vehiclePlate1 || u.vehiclePlate2)));
        if (searchTerm) {
            const lowerSearch = searchTerm.toLocaleLowerCase('tr-TR');
            result = result.filter(u => u.name.toLocaleLowerCase('tr-TR').includes(lowerSearch));
        }
        if (filterBlockId !== 'all') {
            const targetBlockId = parseInt(filterBlockId);
            result = result.filter(u => getUserLocationInfo(u.id).blockId === targetBlockId);
        }
        if (filterStatus !== 'all') {
            result = result.filter(u => {
                const dueRecord = allDues.find(d => d.userId === u.id && d.month === fullMonthString);
                const isPaid = dueRecord?.status === 'Ödendi';
                return filterStatus === 'paid' ? isPaid : !isPaid;
            });
        }
        return result;
    }, [users, blocks, allDues, filterBlockId, filterStatus, fullMonthString, searchTerm]);

    const handleToggleStatus = (userId: number, currentStatus: 'Ödendi' | 'Ödenmedi' | 'Yok') => {
        const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';
        onUpdateDues(userId, fullMonthString, newStatus, defaultAmount);
    };

    // Batch Collection Logic
    const handleBatchCollect = (userList: User[], monthStr: string) => {
        const unpaidUsers = userList.filter(u => {
            const due = allDues.find(d => d.userId === u.id && d.month === monthStr);
            return !due || due.status === 'Ödenmedi';
        });

        if (unpaidUsers.length === 0) {
            alert("Tahsil edilecek ödenmemiş aidat bulunamadı.");
            return;
        }

        const confirmMsg = `${monthStr} dönemi için ${unpaidUsers.length} dairenin aidatı (Toplam: ₺${(unpaidUsers.length * defaultAmount).toLocaleString()}) toplu olarak tahsil edilecektir. Onaylıyor musunuz?`;
        
        if (window.confirm(confirmMsg)) {
            unpaidUsers.forEach(u => {
                onUpdateDues(u.id, monthStr, 'Ödendi', defaultAmount);
            });
            alert(`${unpaidUsers.length} adet tahsilat başarıyla gerçekleştirildi.`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & View Switch */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Aidat Takibi & Analiz</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Sitenizin finansal performansı</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                    <button 
                        onClick={() => setViewMode('analysis')}
                        className={`flex-1 md:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Analiz Görünümü
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex-1 md:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Liste Görünümü
                    </button>
                </div>
            </div>

            {viewMode === 'analysis' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Genel Tahsilat (Son 3 Ay)</h3>
                            <p className="text-4xl font-black">
                                %{Math.round(analyticsData.reduce((acc, b) => acc + b.averagePercentage, 0) / (analyticsData.length || 1))}
                            </p>
                            <p className="text-xs font-bold mt-4 opacity-80">Toplam Bekleyen: ₺{(analyticsData.reduce((acc, b) => acc + (b.totalExpected - b.totalPaid), 0) * defaultAmount).toLocaleString()}</p>
                        </div>
                        
                        {/* 3 Months Micro Chart */}
                        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Aylık Tahsilat Trendi</h3>
                            <div className="flex items-end justify-between h-32 gap-4 px-2">
                                {last3Months.map(month => {
                                    const totalForMonth = analyticsData.reduce((acc, b) => acc + (b.stats.find(s => s.month === month)?.paidCount || 0), 0);
                                    const expectedForMonth = analyticsData.reduce((acc, b) => acc + (b.stats.find(s => s.month === month)?.totalExpected || 0), 0);
                                    const pct = expectedForMonth > 0 ? (totalForMonth / expectedForMonth) * 100 : 0;
                                    
                                    return (
                                        <div key={month} className="flex-1 flex flex-col items-center group">
                                            <div className="relative w-full flex justify-center items-end h-full">
                                                <div 
                                                    style={{ height: `${pct}%` }} 
                                                    className="w-12 md:w-20 bg-indigo-500 rounded-t-xl group-hover:bg-indigo-600 transition-all duration-500 relative"
                                                >
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded font-black">
                                                        %{Math.round(pct)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 mt-3 truncate w-full text-center">{month}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Block Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {analyticsData.map(block => (
                            <div key={block.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">{block.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performans</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${block.averagePercentage > 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        %{block.averagePercentage}
                                    </div>
                                </div>

                                <div className="space-y-4 flex-1">
                                    {block.stats.map(s => (
                                        <div key={s.month} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-gray-500">
                                                <span>{s.month}</span>
                                                <span className={s.percentage === 100 ? 'text-green-600' : 'text-gray-800'}>{s.paidCount} / {s.totalExpected} Daire</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    style={{ width: `${s.percentage}%` }} 
                                                    className={`h-full transition-all duration-700 ${s.percentage === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button 
                                        onClick={() => { setViewMode('list'); setFilterBlockId(block.id.toString()); }}
                                        className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                    >
                                        İncele
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const targetBlock = blocks.find(b => b.id === block.id);
                                            if (targetBlock) {
                                                const residentIds = targetBlock.apartments.map(a => a.residentId).filter(id => id !== undefined);
                                                const blockUsers = users.filter(u => residentIds.includes(u.id));
                                                // Son ayı (last3Months[2]) temel alarak toplu tahsilat yap
                                                handleBatchCollect(blockUsers, last3Months[2]);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-green-50 text-green-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-colors border border-green-100"
                                    >
                                        Toplu Tahsil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* List View Controls */}
                    <div className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-4 border border-gray-100">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">İsimle Ara</label>
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Sakin ismi..."
                                    className="w-full px-4 py-2 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Ay / Yıl</label>
                                <div className="flex gap-2">
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 text-xs font-bold border-gray-200 rounded-xl outline-none bg-white">
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 text-xs font-bold border-gray-200 rounded-xl outline-none bg-white">
                                        {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Blok & Durum</label>
                                <div className="flex gap-2">
                                    <select value={filterBlockId} onChange={(e) => setFilterBlockId(e.target.value)} className="px-3 py-2 text-xs font-bold border-gray-200 rounded-xl outline-none bg-white">
                                        <option value="all">Tüm Bloklar</option>
                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-xs font-bold border-gray-200 rounded-xl outline-none bg-white">
                                        <option value="all">Tümü</option>
                                        <option value="paid">Ödenenler</option>
                                        <option value="unpaid">Ödenmeyenler</option>
                                    </select>
                                </div>
                            </div>
                            <div className="w-full md:w-auto">
                                <button 
                                    onClick={() => handleBatchCollect(filteredResidents, fullMonthString)}
                                    className="w-full md:w-auto px-6 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md active:scale-95"
                                >
                                    Listeyi Tahsil Et
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sakin</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Blok / Daire</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Durum</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredResidents.map(user => {
                                    const dueRecord = allDues.find(d => d.userId === user.id && d.month === fullMonthString);
                                    const status = dueRecord ? dueRecord.status : 'Ödenmedi';
                                    const locInfo = getUserLocationInfo(user.id);
                                    const isPaid = status === 'Ödendi';

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-black text-gray-800">{user.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">{user.role}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-600">
                                                {locInfo.text}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${isPaid ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => handleToggleStatus(user.id, status)}
                                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                >
                                                    {isPaid ? 'Geri Al' : 'Tahsil Et'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredResidents.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic">Sonuç bulunamadı.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DuesManagement;
