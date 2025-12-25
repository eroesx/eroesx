
import React, { useMemo, useState } from 'react';
import { Dues as DuesType, User, SiteInfo, Feedback } from '../types';

interface DuesProps {
    currentUser: User;
    allDues: DuesType[];
    siteInfo: SiteInfo;
    feedbacks: Feedback[];
}

const Dues: React.FC<DuesProps> = ({ currentUser, allDues, siteInfo, feedbacks }) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    // 12-Month Status Calculation
    const yearlyDuesStatus = useMemo(() => {
        return months.map((monthName, idx) => {
            const monthStr = `${monthName} ${selectedYear}`;
            const record = allDues.find(d => d.userId === currentUser.id && d.month === monthStr);
            
            const isPast = selectedYear < currentYear || (selectedYear === currentYear && idx < currentMonthIdx);
            const isCurrent = selectedYear === currentYear && idx === currentMonthIdx;
            
            let status: 'Ödendi' | 'Ödenmedi' | 'Bekliyor' | 'İtiraz Edildi' = 'Bekliyor';
            
            // Check for objection
            const hasObjection = feedbacks.some(f => 
                f.userId === currentUser.id && 
                f.type === 'İtiraz' && 
                f.subject.includes(monthStr)
            );

            if (record?.status === 'Ödendi') {
                status = 'Ödendi';
            } else if (hasObjection) {
                status = 'İtiraz Edildi';
            } else if (isPast || (isCurrent && record?.status === 'Ödenmedi')) {
                status = 'Ödenmedi';
            }
            
            return { 
                monthName, 
                status, 
                amount: record?.amount || siteInfo.duesAmount,
                date: record?.id ? 'Kayıtlı' : (status === 'İtiraz Edildi' ? 'İncelemede' : '-')
            };
        });
    }, [allDues, currentUser, selectedYear, currentYear, currentMonthIdx, siteInfo.duesAmount, feedbacks]);

    const totalPaid = useMemo(() => {
        return yearlyDuesStatus.filter(s => s.status === 'Ödendi').reduce((acc, s) => acc + s.amount, 0);
    }, [yearlyDuesStatus]);

    const totalDebt = useMemo(() => {
        return yearlyDuesStatus.filter(s => s.status === 'Ödenmedi').reduce((acc, s) => acc + s.amount, 0);
    }, [yearlyDuesStatus]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Aidat Geçmişim</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ödeme kayıtlarınızı kontrol edin</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Yıl Seçin:</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                            <option key={y} value={y}>{y} Yılı</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Yıllık Toplam Ödenen</p>
                    <h3 className="text-3xl font-black text-green-600">₺{totalPaid.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-rose-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Yıllık Toplam Borç</p>
                    <h3 className="text-3xl font-black text-rose-600">₺{totalDebt.toLocaleString()}</h3>
                </div>
            </div>

            {/* 12-Month Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {yearlyDuesStatus.map((item, idx) => (
                    <div 
                        key={idx} 
                        className={`bg-white p-5 rounded-3xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between h-36 ${
                            item.status === 'Ödendi' ? 'border-green-100' : 
                            item.status === 'İtiraz Edildi' ? 'border-blue-100 bg-blue-50/30' :
                            item.status === 'Ödenmedi' ? 'border-rose-100' : 
                            'border-gray-100 opacity-60'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${
                                    item.status === 'Ödendi' ? 'bg-green-100 text-green-600' : 
                                    item.status === 'İtiraz Edildi' ? 'bg-blue-100 text-blue-600' :
                                    item.status === 'Ödenmedi' ? 'bg-rose-100 text-rose-600' : 
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.monthName}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">₺{item.amount.toLocaleString()}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                item.status === 'Ödendi' ? 'bg-green-50 text-green-600' : 
                                item.status === 'İtiraz Edildi' ? 'bg-blue-50 text-blue-600' :
                                item.status === 'Ödenmedi' ? 'bg-rose-50 text-rose-600' : 
                                'bg-gray-50 text-gray-400'
                            }`}>
                                {item.status}
                            </span>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Durum: {item.date}</span>
                            {item.status === 'Ödenmedi' && (
                                <span className="text-[9px] font-black text-rose-500 animate-pulse uppercase">Borçlu</span>
                            )}
                            {item.status === 'İtiraz Edildi' && (
                                <span className="text-[9px] font-black text-blue-500 uppercase">Beklemede</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Message */}
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest leading-relaxed">
                    * Geçmiş aylara ait ödeme kayıtlarınızda eksiklik varsa lütfen yönetici ile iletişime geçin. <br/>
                    * Her ayın 1'inden itibaren ilgili ayın aidatı tahakkuk eder.
                </p>
            </div>
        </div>
    );
};

export default Dues;
