
import React, { useState, useEffect, useMemo } from 'react';
import { SiteInfo, Expense, Dues, User, Page } from '../types';

interface CashManagementProps {
    siteInfo: SiteInfo;
    expenses: Expense[];
    dues: Dues[];
    onUpdateSiteInfo: (info: SiteInfo) => void;
    setCurrentPage: (page: Page) => void;
}

const CashManagement: React.FC<CashManagementProps> = ({ siteInfo, expenses, dues, onUpdateSiteInfo, setCurrentPage }) => {
    const [localInitialBalance, setLocalInitialBalance] = useState(siteInfo.initialBalance || 0);
    const [bankName, setBankName] = useState(siteInfo.bankName || '');
    const [iban, setIban] = useState(siteInfo.iban || '');
    const [note, setNote] = useState(siteInfo.note || '');
    const [duesAmount, setDuesAmount] = useState(siteInfo.duesAmount || 0);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        setLocalInitialBalance(siteInfo.initialBalance || 0);
        setBankName(siteInfo.bankName);
        setIban(siteInfo.iban);
        setNote(siteInfo.note || '');
        setDuesAmount(siteInfo.duesAmount);
    }, [siteInfo]);

    const totalCollected = useMemo(() => dues.filter(d => d.status === 'Ödendi').reduce((acc, d) => acc + d.amount, 0), [dues]);
    const totalExpense = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
    const netBalance = (totalCollected + (siteInfo.initialBalance || 0)) - totalExpense;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await onUpdateSiteInfo({
            ...siteInfo,
            initialBalance: localInitialBalance,
            bankName,
            iban,
            note,
            duesAmount
        });
        setSuccessMsg('Kasa ve banka bilgileri başarıyla güncellendi.');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 1. Mali Özet Paneli */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-48">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70">Net Kasa Bakiyesi</h3>
                    <div>
                        <p className="text-4xl font-black">₺{netBalance.toLocaleString()}</p>
                        <p className="text-[10px] font-bold mt-2 opacity-80 uppercase">Gelir + Açılış - Gider</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Toplam Tahsilat</h3>
                    <div>
                        <p className="text-3xl font-black text-emerald-600">+ ₺{totalCollected.toLocaleString()}</p>
                        <p className="text-[10px] font-bold mt-2 text-gray-400 uppercase">Ödenen Aidat Toplamı</p>
                    </div>
                </div>

                <div 
                    onClick={() => setCurrentPage('expenses')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-48 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all active:scale-[0.98] group"
                >
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-500 transition-colors">Toplam Gider</h3>
                    <div>
                        <p className="text-3xl font-black text-rose-600">- ₺{totalExpense.toLocaleString()}</p>
                        <p className="text-[10px] font-bold mt-2 text-gray-400 uppercase">İşlenen Tüm Giderler (Görmek için tıklayın)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2. Kasa & Banka Formu */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-8">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mr-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Kasa ve Hesap Yönetimi</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Sistem ayarlarını güncelleyin</p>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-xs font-black uppercase rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Açılış Bakiyesi (₺)</label>
                                <input 
                                    type="number" 
                                    value={localInitialBalance}
                                    onChange={(e) => setLocalInitialBalance(Number(e.target.value))}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aylık Aidat (₺)</label>
                                <input 
                                    type="number" 
                                    value={duesAmount}
                                    onChange={(e) => setDuesAmount(Number(e.target.value))}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banka Adı</label>
                            <input 
                                type="text" 
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
                                placeholder="Örn: X Bankası"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">IBAN Numarası</label>
                            <input 
                                type="text" 
                                value={iban}
                                onChange={(e) => setIban(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-xs font-bold"
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ödeme Notu / Bilgi</label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm"
                                placeholder="Aidat ödemesi yaparken daire no belirtiniz..."
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            Bilgileri Kaydet
                        </button>
                    </form>
                </div>

                {/* 3. Açıklayıcı Kartlar */}
                <div className="space-y-6">
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                        <h4 className="text-sm font-black text-amber-800 uppercase tracking-tight mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Açılış Bakiyesi Nedir?
                        </h4>
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            Uygulamayı kullanmaya başladığınızda kasada devreden mevcut parayı bu alana girmelisiniz. Sistem, toplam geliri hesaplarken bu tutarı baz alacaktır.
                        </p>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                        <h4 className="text-sm font-black text-indigo-800 uppercase tracking-tight mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Finansal Hesaplama Formülü
                        </h4>
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                                <span>Açılış Bakiyesi</span>
                                <span>₺{siteInfo.initialBalance?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-emerald-600">
                                <span>+ Toplam Aidat Geliri</span>
                                <span>₺{totalCollected.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-rose-600">
                                <span>- Toplam Giderler</span>
                                <span>₺{totalExpense.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between text-xs font-black uppercase text-indigo-600">
                                <span>= Net Durum</span>
                                <span>₺{netBalance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashManagement;
