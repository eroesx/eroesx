
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
    const [timeFrame, setTimeFrame] = useState<3 | 6 | 12>(3);
    const [defaultAmount, setDefaultAmount] = useState<number>(siteInfo.duesAmount);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
    
    const [debtorFilterBlockId, setDebtorFilterBlockId] = useState<string>('all');

    const fullMonthString = `${selectedMonth} ${selectedYear}`;

    // Dinamik ay dizisi oluştur (Seçilen timeFrame'e göre)
    const dynamicMonths = useMemo(() => {
        const result = [];
        for (let i = timeFrame - 1; i >= 0; i--) {
            let mIdx = currentMonthIdx - i;
            let y = currentYear;
            while (mIdx < 0) {
                mIdx += 12;
                y -= 1;
            }
            result.push(`${months[mIdx]} ${y}`);
        }
        return result;
    }, [currentMonthIdx, currentYear, timeFrame]);

    const getUserLocationInfo = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) return { text: `${block.name} - No: ${apt.number}`, blockId: block.id, blockName: block.name, aptNumber: apt.number };
        }
        return { text: 'Atanmamış', blockId: -1, blockName: '-', aptNumber: '-' };
    };

    // Blok bazlı istatistikleri hesapla
    const analyticsData = useMemo(() => {
        if (!blocks || blocks.length === 0) return [];

        return blocks.map(block => {
            const blockStats = dynamicMonths.map(monthStr => {
                const blockApts = block.apartments || [];
                const residentIds = blockApts
                    .map(a => a.residentId)
                    .filter((id): id is number => id !== undefined && id !== null);
                
                const monthDues = allDues.filter(d => d.month === monthStr && residentIds.includes(d.userId));
                // Sadece "Ödendi" olanları başarı sayıyoruz. 
                // Geçmiş aylarda kayıt yoksa (yani girilmediyse) ödenmedi sayılmış olur çünkü paidCount'a girmez.
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
    }, [blocks, allDues, dynamicMonths]);

    // ZAMAN BAZLI BORÇ HESAPLAMA MANTIĞI
    const topDebtors = useMemo(() => {
        let debtorList = users
            .filter(u => u.isActive && u.role !== 'Yönetici')
            .map(user => {
                // Bu kullanıcı için seçili yıldaki tüm ayları kontrol et
                let unpaidCount = 0;
                
                // 0'dan currentMonthIdx-1'e kadar olan aylar "Geçmiş Ay"dır ve ödeme zorunludur.
                // Eğer selectedYear < currentYear ise tüm 12 ay zorunludur.
                const monthsToControl = selectedYear < currentYear ? 12 : currentMonthIdx;

                for (let m = 0; m < monthsToControl; m++) {
                    const monthName = `${months[m]} ${selectedYear}`;
                    const record = allDues.find(d => d.userId === user.id && d.month === monthName);
                    
                    // Geçmiş bir ay için "Ödendi" kaydı yoksa BORÇLU sayılır.
                    if (!record || record.status === 'Ödenmedi') {
                        unpaidCount++;
                    }
                }

                // Güncel Ay Kontrolü: Güncel ay beklemededir, ancak manuel "Ödenmedi" girildiyse borç sayalım.
                if (selectedYear === currentYear) {
                    const currentMonthName = `${months[currentMonthIdx]} ${currentYear}`;
                    const currentRecord = allDues.find(d => d.userId === user.id && d.month === currentMonthName);
                    if (currentRecord && currentRecord.status === 'Ödenmedi') {
                        unpaidCount++;
                    }
                }
                
                const loc = getUserLocationInfo(user.id);
                return {
                    id: user.id,
                    name: user.name,
                    unpaidCount,
                    totalDebt: unpaidCount * (siteInfo.duesAmount || 0),
                    location: loc.text,
                    blockId: loc.blockId
                };
            })
            .filter(d => d.unpaidCount > 0);

        if (debtorFilterBlockId !== 'all') {
            debtorList = debtorList.filter(d => d.blockId === parseInt(debtorFilterBlockId));
        }

        return debtorList
            .sort((a, b) => b.unpaidCount - a.unpaidCount)
            .slice(0, 10); // Her zaman en fazla 10 kişi
    }, [users, allDues, selectedYear, siteInfo.duesAmount, debtorFilterBlockId, currentMonthIdx, currentYear]);

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
                // "Liste" görünümünde de aynı mantığı uygula: Kayıt yoksa ve geçmiş aysa ödenmedi say.
                const isPastMonth = selectedYear < currentYear || (selectedYear === currentYear && months.indexOf(selectedMonth) < currentMonthIdx);
                const isPaid = dueRecord?.status === 'Ödendi';
                const effectiveStatus = (dueRecord?.status === 'Ödendi') ? 'paid' : (isPastMonth ? 'unpaid' : 'waiting');
                
                if (filterStatus === 'paid') return effectiveStatus === 'paid';
                if (filterStatus === 'unpaid') return effectiveStatus === 'unpaid';
                return true;
            });
        }
        return result;
    }, [users, blocks, allDues, filterBlockId, filterStatus, fullMonthString, searchTerm, selectedMonth, selectedYear, currentYear, currentMonthIdx]);

    const handleToggleStatus = (userId: number, currentStatus: 'Ödendi' | 'Ödenmedi' | 'Yok') => {
        const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';
        onUpdateDues(userId, fullMonthString, newStatus, defaultAmount);
    };

    const handleBatchCollect = (userList: User[], monthStr: string) => {
        const unpaidUsers = userList.filter(u => {
            const due = allDues.find(d => d.userId === u.id && d.month === monthStr);
            return !due || due.status === 'Ödenmedi';
        });

        if (unpaidUsers.length === 0) {
            alert("Tahsil edilecek ödenmemiş aidat bulunamadı.");
            return;
        }

        if (window.confirm(`${monthStr} dönemi için ${unpaidUsers.length} dairenin aidatı toplu olarak tahsil edilecektir. Onaylıyor musunuz?`)) {
            unpaidUsers.forEach(u => onUpdateDues(u.id, monthStr, 'Ödendi', defaultAmount));
            alert("İşlem başarıyla tamamlandı.");
        }
    };

    const handleQuickFilter = (blockId: number, monthStr: string, status: 'paid' | 'unpaid' | 'all' = 'all') => {
        const [month, year] = monthStr.split(' ');
        setSelectedMonth(month);
        setSelectedYear(parseInt(year));
        setFilterBlockId(blockId.toString());
        setFilterStatus(status);
        setViewMode('list');
    };

    const handleDebtorClick = (name: string) => {
        setSearchTerm(name);
        setFilterBlockId('all');
        setFilterStatus('unpaid');
        setViewMode('list');
    };

    const overallPercentage = useMemo(() => {
        if (!analyticsData || analyticsData.length === 0) return 0;
        const totalP = analyticsData.reduce((acc, b) => acc + b.totalPaid, 0);
        const totalE = analyticsData.reduce((acc, b) => acc + b.totalExpected, 0);
        return totalE > 0 ? Math.round((totalP / totalE) * 100) : 0;
    }, [analyticsData]);

    return (
        <div className="space-y-6">
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
                        Analiz
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex-1 md:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Liste
                    </button>
                </div>
            </div>

            {viewMode === 'analysis' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Genel Özet Kartı */}
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden flex flex-col justify-center items-center h-[400px]">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Seçili Dönem Ortalaması</h3>
                            <div className="relative z-10 flex items-center">
                                <span className={`text-7xl font-black ${overallPercentage >= 50 ? 'text-green-600' : 'text-rose-600'}`}>%{overallPercentage}</span>
                            </div>
                            <div className="w-full mt-6 h-4 bg-rose-100 rounded-full overflow-hidden flex border border-rose-200">
                                <div style={{ width: `${overallPercentage}%` }} className="bg-green-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                            </div>
                            <p className="text-[9px] font-bold mt-4 text-gray-400 uppercase tracking-widest text-center">
                                Son {timeFrame} ayın genel<br/>tahsilat başarısı
                            </p>
                            <div className="mt-6 flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {[3, 6, 12].map(num => (
                                    <button 
                                        key={num}
                                        onClick={() => setTimeFrame(num as any)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${timeFrame === num ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        {num} Ay
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Aylık Tahsilat Trendi (Dinamik & İnteraktif) */}
                        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Aylık Tahsilat Trendi (Blok Bazlı)</h3>
                                    <p className="text-[9px] text-gray-300 font-bold uppercase mt-1">Detay için sütunlara tıklayabilirsiniz</p>
                                </div>
                                <div className="hidden sm:flex items-center space-x-3">
                                    <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[8px] font-black text-gray-400 uppercase">Tahsilat</span></div>
                                    <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-rose-500/30"></div><span className="text-[8px] font-black text-gray-400 uppercase">Bekleyen</span></div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-x-auto overflow-y-visible custom-scrollbar">
                                <div className="flex items-end justify-around gap-4 px-2 h-full min-w-full pb-4 pt-28">
                                    {dynamicMonths.map(month => {
                                        let monthPaid = 0;
                                        let monthExp = 0;
                                        analyticsData.forEach(b => {
                                            const s = b.stats.find(stat => stat.month === month);
                                            if(s) { monthPaid += s.paidCount; monthExp += s.totalExpected; }
                                        });
                                        const monthAvg = monthExp > 0 ? Math.round((monthPaid / monthExp) * 100) : 0;

                                        return (
                                            <div key={month} className="flex-1 flex flex-col items-center h-full min-w-[60px] max-w-[120px]">
                                                <div className="relative w-full flex-1 flex items-end justify-center gap-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100/50">
                                                    {analyticsData.map(block => {
                                                        const stat = block.stats.find(s => s.month === month);
                                                        const blockPct = stat ? stat.percentage : 0;
                                                        const unpaidCount = stat ? (stat.totalExpected - stat.paidCount) : 0;
                                                        
                                                        return (
                                                            <div 
                                                                key={block.id} 
                                                                onClick={() => handleQuickFilter(block.id, month, 'all')}
                                                                className="flex-1 h-full flex flex-col justify-end group/bar relative bg-rose-500/5 rounded-t-md overflow-visible cursor-pointer hover:bg-rose-500/10 transition-colors"
                                                            >
                                                                <div className="flex-1 w-full" />
                                                                <div 
                                                                    style={{ height: `${blockPct}%` }}
                                                                    className={`w-full transition-all duration-1000 group-hover/bar:scale-x-110 ${blockPct >= 70 ? 'bg-green-500 shadow-[0_-2px_4px_rgba(34,197,94,0.2)]' : blockPct >= 40 ? 'bg-amber-500 shadow-[0_-2px_4px_rgba(245,158,11,0.2)]' : 'bg-rose-50 shadow-[0_-2px_4px_rgba(244,63,94,0.2)]'}`}
                                                                />
                                                                
                                                                <div className="absolute -top-28 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-[100] scale-90 group-hover/bar:scale-100">
                                                                    <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] whitespace-nowrap min-w-[140px] border border-white/20">
                                                                        <div className="border-b border-white/10 pb-2 mb-2">
                                                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">{month}</p>
                                                                            <p className="text-[11px] font-black uppercase text-white tracking-tight leading-none">{block.name}</p>
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <div className="flex justify-between items-center gap-4">
                                                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Ödenen:</span>
                                                                                <span className="text-green-400 font-black text-[10px]">{stat?.paidCount} Daire</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center gap-4">
                                                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Bekleyen:</span>
                                                                                <span className="text-rose-400 font-black text-[10px]">{unpaidCount} Daire</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center gap-4 pt-1.5 border-t border-white/5">
                                                                                <span className="text-[9px] text-gray-200 font-black uppercase tracking-widest">Başarı:</span>
                                                                                <span className={`font-black text-[11px] ${blockPct >= 70 ? 'text-green-400' : 'text-amber-400'}`}>%{blockPct}</span>
                                                                            </div>
                                                                            <div className="pt-1 mt-1 border-t border-white/5 flex justify-center">
                                                                                <p className="text-[9px] font-black uppercase text-indigo-300 tracking-tighter">{block.name}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-3 h-3 bg-gray-900 rotate-45 mx-auto -mt-1.5 border-r border-b border-white/20"></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="py-2 text-center w-full">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase truncate leading-tight">{month.split(' ')[0]}</p>
                                                    <p className={`text-[8px] font-bold uppercase tracking-tighter ${monthAvg >= 70 ? 'text-green-500' : 'text-indigo-500'}`}>%{monthAvg}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Top 10 Borçlu Listesi */}
                        <div className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                                <div>
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">En Çok Borcu Olanlar (Top 10)</h3>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{selectedYear} Yılı</p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select 
                                        value={debtorFilterBlockId} 
                                        onChange={(e) => setDebtorFilterBlockId(e.target.value)}
                                        className="text-[10px] font-black uppercase bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600 focus:ring-1 focus:ring-indigo-400"
                                    >
                                        <option value="all">Tüm Bloklar</option>
                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">Kritik</span>
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {topDebtors.map((debtor, idx) => (
                                    <div 
                                        key={debtor.id} 
                                        onClick={() => handleDebtorClick(debtor.name)}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-rose-50 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm border border-gray-100 group-hover:text-rose-600">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-gray-800 uppercase group-hover:text-rose-700">{debtor.name}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{debtor.location}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-black text-rose-600">₺{debtor.totalDebt.toLocaleString()}</p>
                                            <p className="text-[9px] text-rose-400 font-bold uppercase">{debtor.unpaidCount} Ay</p>
                                        </div>
                                    </div>
                                ))}
                                {topDebtors.length === 0 && (
                                    <div className="h-full flex flex-col justify-center items-center text-center p-8">
                                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Borçlu kaydı bulunamadı</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Blok Kartları */}
                        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {analyticsData.map(block => (
                                <div key={block.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">{block.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dönemlik Başarı</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${block.averagePercentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                            %{block.averagePercentage}
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {block.stats.slice(-3).map(s => (
                                            <div key={s.month} className="space-y-1.5">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-tight text-gray-500">
                                                    <span>{s.month}</span>
                                                    <div className="flex gap-3">
                                                        <span 
                                                            onClick={() => handleQuickFilter(block.id, s.month, 'paid')}
                                                            className="text-green-600 cursor-pointer hover:underline hover:font-black transition-all"
                                                        >
                                                            {s.paidCount} Ödendi
                                                        </span>
                                                        <span 
                                                            onClick={() => handleQuickFilter(block.id, s.month, 'unpaid')}
                                                            className="text-rose-500 cursor-pointer hover:underline hover:font-black transition-all"
                                                        >
                                                            {s.totalExpected - s.paidCount} Borç
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-rose-500/10 rounded-full overflow-hidden border border-rose-50">
                                                    <div 
                                                        style={{ width: `${s.percentage}%` }} 
                                                        className={`h-full transition-all duration-700 ${s.percentage >= 70 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <button 
                                            onClick={() => { setViewMode('list'); setFilterBlockId(block.id.toString()); setFilterStatus('all'); }}
                                            className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                        >
                                            Sakin Listesi
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const targetBlock = blocks.find(b => b.id === block.id);
                                                if (targetBlock) {
                                                    const residentIds = targetBlock.apartments.map(a => a.residentId).filter(id => id !== undefined);
                                                    const blockUsers = users.filter(u => residentIds.includes(u.id));
                                                    handleBatchCollect(blockUsers, dynamicMonths[dynamicMonths.length - 1]);
                                                }
                                            }}
                                            className="flex-1 py-3 bg-green-50 text-green-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-colors border border-green-100"
                                        >
                                            Hızlı Tahsil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-4 border border-gray-100">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">İsimle Ara</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Sakin ismi..."
                                        className="w-full px-4 py-2 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2 text-gray-400 hover:text-rose-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Dönem</label>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Filtrele</label>
                                <div className="flex gap-2">
                                    <select value={filterBlockId} onChange={(e) => setFilterBlockId(e.target.value)} className="px-3 py-2 text-xs font-bold border-gray-200 rounded-xl outline-none bg-white">
                                        <option value="all">Tüm Bloklar</option>
                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 text-xs font-bold border-gray-200 rounded-xl outline-none bg-white">
                                        <option value="all">Tümü</option>
                                        <option value="paid">Ödenen</option>
                                        <option value="unpaid">Bekleyen</option>
                                    </select>
                                </div>
                            </div>
                            <div className="w-full md:w-auto">
                                <button 
                                    onClick={() => handleBatchCollect(filteredResidents, fullMonthString)}
                                    className="w-full md:w-auto px-6 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md"
                                >
                                    Toplu İşle
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
                                    
                                    // Liste durumunu zaman bazlı belirle
                                    const isPastMonth = selectedYear < currentYear || (selectedYear === currentYear && months.indexOf(selectedMonth) < currentMonthIdx);
                                    const isPaid = dueRecord?.status === 'Ödendi';
                                    const status = isPaid ? 'Ödendi' : (isPastMonth ? 'Ödenmedi' : (dueRecord?.status || 'Bekleniyor'));

                                    const locInfo = getUserLocationInfo(user.id);

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
                                                <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg ${isPaid ? 'bg-green-50 text-green-700 border border-green-100' : (status === 'Ödenmedi' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-gray-50 text-gray-400 border border-gray-100')}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => handleToggleStatus(user.id, isPaid ? 'Ödendi' : 'Ödenmedi')}
                                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                >
                                                    {isPaid ? 'Geri Al' : 'Tahsil'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredResidents.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic">Veri bulunamadı.</div>
                        )}
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </div>
    );
};

export default DuesManagement;
