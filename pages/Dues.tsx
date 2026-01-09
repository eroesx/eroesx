import React, { useMemo, useState, useRef } from 'react';
import { Dues as DuesType, User, SiteInfo, Feedback, FeedbackType } from '../types';

interface DuesProps {
    currentUser: User;
    allDues: DuesType[];
    siteInfo: SiteInfo;
    feedbacks: Feedback[];
    onAddFeedback?: (userId: number, type: FeedbackType, subject: string, content: string, fileData?: {url: string, name: string, type: string}) => void;
}

const Dues: React.FC<DuesProps> = ({ currentUser, allDues, siteInfo, feedbacks, onAddFeedback }) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [objectionSuccessMsg, setObjectionSuccessMsg] = useState('');
    const [objectionActiveMonth, setObjectionActiveMonth] = useState<string | null>(null);
    const [selectedObjectionFile, setSelectedObjectionFile] = useState<{url: string, name: string, type: string} | null>(null);
    const objectionFileInputRef = useRef<HTMLInputElement>(null);

    // 12-Month Status Calculation
    const yearlyDuesStatus = useMemo(() => {
        return months.map((monthName, idx) => {
            const monthStr = `${monthName} ${selectedYear}`;
            const record = allDues.find(d => d.userId === currentUser.id && d.month === monthStr);
            
            const isPast = selectedYear < currentYear || (selectedYear === currentYear && idx < currentMonthIdx);
            const isCurrent = selectedYear === currentYear && idx === currentMonthIdx;
            
            let status: 'Ödendi' | 'Ödenmedi' | 'Bekliyor' | 'İtiraz Edildi' = 'Bekliyor';
            
            // Check for record "Ödendi" first (takes priority)
            if (record?.status === 'Ödendi') {
                status = 'Ödendi';
            } else {
                // Check for objection in feedbacks
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

    const previousYearsDebt = useMemo(() => {
        if (currentUser.isDuesExempt) return 0;

        const allPaidMonths = new Set(
            allDues
                .filter(d => d.userId === currentUser.id && d.status === 'Ödendi')
                .map(d => d.month)
        );

        const allObjectedMonths = new Set(
            (feedbacks || [])
                .filter(f => f.userId === currentUser.id && f.type === 'İtiraz' && f.status !== 'Arşivlendi')
                .map(f => f.subject.split(': ')[1]?.trim())
                .filter(Boolean) as string[]
        );

        let debt = 0;
        const startYear = 2023; // Assuming start year

        for (let year = startYear; year < selectedYear; year++) {
            for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
                const monthStr = `${months[monthIdx]} ${year}`;
                if (!allPaidMonths.has(monthStr) && !allObjectedMonths.has(monthStr)) {
                    const dueRecord = allDues.find(d => d.userId === currentUser.id && d.month === monthStr);
                    debt += dueRecord?.amount || siteInfo.duesAmount;
                }
            }
        }
        
        return debt;
    }, [allDues, feedbacks, currentUser.id, currentUser.isDuesExempt, siteInfo.duesAmount, selectedYear, months]);

    const handleObjectionClick = (monthName: string) => {
        setObjectionActiveMonth(monthName);
    };

    const handleObjectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) { // 1MB limit for base64 efficiency
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

            {objectionSuccessMsg && (
                <div className="px-8 py-3 bg-blue-50 text-blue-800 text-[10px] font-black uppercase rounded-2xl border border-blue-100 flex items-center shadow-sm animate-in slide-in-from-top-2">
                    <svg className="w-4 h-4 mr-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {objectionSuccessMsg}
                </div>
            )}

            {/* Summary Cards */}
            <div className={`grid grid-cols-1 ${previousYearsDebt > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                {previousYearsDebt > 0 && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-amber-500">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Geçmiş Yıllardan Borç</p>
                        <h3 className="text-3xl font-black text-amber-600">₺{previousYearsDebt.toLocaleString()}</h3>
                    </div>
                )}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{selectedYear} Yılı Toplam Ödenen</p>
                    <h3 className="text-3xl font-black text-green-600">₺{totalPaid.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-rose-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{selectedYear} Yılı Toplam Borç</p>
                    <h3 className="text-3xl font-black text-rose-600">₺{totalDebt.toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50/50">
                            <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="p-4">Ay</th>
                                <th className="p-4">Tutar</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4">Kayıt Durumu</th>
                                <th className="p-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {yearlyDuesStatus.map((item, index) => (
                                <tr key={index} className={`group transition-colors ${
                                    item.status === 'İtiraz Edildi' 
                                    ? 'bg-blue-50/50 hover:bg-blue-100/60' 
                                    : 'hover:bg-gray-50/30'
                                }`}>
                                    <td className="p-4 font-black text-gray-800 uppercase tracking-tight">{item.monthName}</td>
                                    <td className="p-4 text-sm font-bold text-gray-500">₺{item.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            item.status === 'Ödendi' ? 'bg-green-600 text-white shadow-sm' : 
                                            item.status === 'İtiraz Edildi' ? 'bg-blue-600 text-white shadow-md' :
                                            item.status === 'Ödenmedi' ? 'bg-rose-50 text-rose-600' : 
                                            'bg-gray-50 text-gray-400'
                                        }`}>{item.status}</span>
                                    </td>
                                    <td className="p-4 text-[10px] font-bold text-gray-400 uppercase">{item.date}</td>
                                    <td className="p-4 text-right">
                                        {item.status === 'Ödenmedi' && (
                                            <button 
                                                onClick={() => handleObjectionClick(item.monthName)}
                                                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
                                            >
                                                İtiraz Et
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Objection Modal */}
            {objectionActiveMonth && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">İtiraz Talebi</h3>
                            <button onClick={() => setObjectionActiveMonth(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-6">{objectionActiveMonth} ${selectedYear} dönemine ait ödemeniz için dekont yükleyebilirsiniz.</p>
                        
                        <div className="space-y-4">
                            <input type="file" ref={objectionFileInputRef} onChange={handleObjectionFileChange} className="hidden" accept="image/*,application/pdf" />
                            {selectedObjectionFile ? (
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                    <p className="text-xs font-black text-gray-700 truncate flex-1 uppercase">{selectedObjectionFile.name}</p>
                                    <button onClick={() => setSelectedObjectionFile(null)} className="text-rose-500 font-bold text-xs hover:underline uppercase">SİL</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => objectionFileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-xs font-black uppercase"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Dekont Ekle (Opsiyonel)
                                </button>
                            )}
                            <button 
                                onClick={handleConfirmObjection}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                                Talebi Gönder
                            </button>
                        </div>
                    </div>
                 </div>
            )}

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