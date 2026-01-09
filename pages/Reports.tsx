
import React, { useState, useMemo } from 'react';
import { Expense, Dues, SiteInfo } from '../types';

interface ReportsProps {
    expenses: Expense[];
    dues: Dues[];
    siteInfo: SiteInfo;
}

type TimePeriod = 'last30' | 'thisYear' | 'allTime';

const COLORS = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#6b7280'];

const PieChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full text-gray-400">Veri Yok</div>;

    let currentAngle = 0;
    const gradientParts = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const color = COLORS[index % COLORS.length];
        const start = currentAngle;
        currentAngle += percentage;
        return `${color} ${start}% ${currentAngle}%`;
    });

    return (
        <div className="flex items-center justify-center h-full">
            <div 
                className="w-48 h-48 rounded-full shadow-inner border-4 border-white relative group"
                style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
            >
                {/* Center Hole for Donut Chart effect (Optional, keeps it cleaner) */}
                <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-black text-gray-400">TOPLAM</span>
                </div>
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    if (maxValue === 0) return <div className="flex items-center justify-center h-full text-gray-400">Veri Yok</div>;

    return (
        <div className="flex items-end justify-around h-full gap-2 px-4 pb-6 pt-4">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-8 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ₺{item.value.toLocaleString()}
                    </div>
                    <div
                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                        className="w-full bg-indigo-200 rounded-t-lg group-hover:bg-indigo-500 transition-colors"
                    />
                    <p className="text-[9px] font-black text-gray-400 uppercase mt-2">{item.label}</p>
                </div>
            ))}
        </div>
    );
};

const Reports: React.FC<ReportsProps> = ({ expenses }) => {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('thisYear');

    const filteredExpenses = useMemo(() => {
        const now = new Date();
        if (timePeriod === 'allTime') return expenses;
        if (timePeriod === 'last30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
        }
        if (timePeriod === 'thisYear') {
            return expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
        }
        return [];
    }, [expenses, timePeriod]);

    const totalExpense = filteredExpenses.reduce((sum, e) => {
        const amount = Number(e.amount) || 0;
        return sum + amount;
    }, 0);

    const expensesByCategory = useMemo(() => {
        const categoryMap = filteredExpenses.reduce((acc, exp) => {
            const current = acc[exp.category] || 0;
            const amount = Number(exp.amount) || 0;
            acc[exp.category] = current + amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categoryMap)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => Number(b.value) - Number(a.value));
    }, [filteredExpenses]);

    const expensesByMonth = useMemo(() => {
        const monthMap = new Array(12).fill(0) as number[];
        
        filteredExpenses.forEach(exp => {
            const dateObj = new Date(exp.date);
            const month = dateObj.getMonth();
            if (!isNaN(month) && month >= 0 && month < 12) {
                const currentVal = monthMap[month] || 0;
                const expenseAmount = Number(exp.amount) || 0;
                monthMap[month] = currentVal + expenseAmount;
            }
        });

        const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        return monthLabels.map((label, index) => ({ label, value: monthMap[index] ?? 0 }));
    }, [filteredExpenses]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Raporlar ve Analiz</h1>
                <div className="flex p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
                    {(['last30', 'thisYear', 'allTime'] as TimePeriod[]).map(period => (
                        <button
                            key={period}
                            onClick={() => setTimePeriod(period)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${timePeriod === period ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            {period === 'last30' ? 'Son 30 Gün' : period === 'thisYear' ? 'Bu Yıl' : 'Tüm Zamanlar'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Filtrelenen Toplam Gider</h3>
                <p className="text-2xl font-black text-rose-600">₺{totalExpense.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-4">Kategori Dağılımı</h3>
                    <div className="flex h-full -mt-10">
                        <div className="w-1/2 flex items-center justify-center">
                            <PieChart data={expensesByCategory} />
                        </div>
                        <div className="w-1/2 flex flex-col justify-center space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                            {expensesByCategory.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="flex justify-between w-full min-w-0">
                                        <span className="text-xs font-bold text-gray-600 truncate" title={item.label}>{item.label}</span>
                                        <span className="text-xs font-black text-gray-800 ml-2">{totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-4">Aylık Harcama Trendi</h3>
                    <BarChart data={expensesByMonth} />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Detaylı Gider Listesi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4 text-left">Tarih</th>
                                <th className="px-6 py-4 text-left">Başlık</th>
                                <th className="px-6 py-4 text-left">Kategori</th>
                                <th className="px-6 py-4 text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">{new Date(expense.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-black text-gray-800 uppercase">{expense.title}</p>
                                        {expense.description && <p className="text-xs text-gray-400 truncate max-w-xs">{expense.description}</p>}
                                    </td>
                                    <td className="px-6 py-4"><span className="px-3 py-1 text-[9px] font-black uppercase rounded-lg bg-gray-100 text-gray-600 border border-gray-200">{expense.category}</span></td>
                                    <td className="px-6 py-4 text-right font-black text-rose-600">-₺{(Number(expense.amount) || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredExpenses.length === 0 && (
                        <div className="p-16 text-center text-gray-300">
                            <p className="font-black uppercase tracking-widest text-xs">Filtreye uygun gider kaydı bulunamadı.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
