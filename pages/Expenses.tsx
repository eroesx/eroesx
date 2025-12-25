
import React, { useState, useMemo, useEffect } from 'react';
import { Expense } from '../types';

interface ExpensesProps {
    expenses: Expense[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onDeleteExpense: (id: number) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Genel');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState('');

    // Categories state
    const [availableCategories, setAvailableCategories] = useState([
        'Genel', 
        'Bakım & Onarım', 
        'Personel', 
        'Faturalar', 
        'Temizlik', 
        'Demirbaş'
    ]);
    
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Sync categories with existing expenses on load
    useEffect(() => {
        const uniqueExistingCategories = Array.from(new Set(expenses.map(e => e.category)));
        setAvailableCategories(prev => {
            const combined = [...new Set([...prev, ...uniqueExistingCategories])];
            return combined;
        });
    }, [expenses]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'ADD_NEW') {
            setIsAddingNewCategory(true);
            setCategory('');
        } else {
            setIsAddingNewCategory(false);
            setCategory(value);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = isAddingNewCategory ? newCategoryName.trim() : category;

        if (!title || !amount || !finalCategory) {
            alert("Lütfen tüm alanları doldurunuz.");
            return;
        }

        onAddExpense({
            title,
            amount: parseFloat(amount),
            category: finalCategory,
            date,
            description
        });

        // If it was a new category, add it to the list for next time
        if (isAddingNewCategory && !availableCategories.includes(finalCategory)) {
            setAvailableCategories(prev => [...prev, finalCategory]);
        }

        // Reset Form
        setTitle('');
        setAmount('');
        setDescription('');
        setCategory(finalCategory); // Stay on the used category
        setIsAddingNewCategory(false);
        setNewCategoryName('');
    };

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Gider Yönetimi
                </h2>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gider Başlığı</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Örn: Elektrik Faturası"
                            required
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL)</label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select 
                            value={isAddingNewCategory ? 'ADD_NEW' : category} 
                            onChange={handleCategoryChange}
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm mb-2"
                        >
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="ADD_NEW" className="font-bold text-indigo-600">+ Yeni Kategori Ekle...</option>
                        </select>
                        
                        {isAddingNewCategory && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Kategori Adı Yazın"
                                    className="w-full p-2 border border-indigo-300 bg-indigo-50 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder:italic"
                                    required
                                />
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            required
                        />
                    </div>
                    <div className="lg:col-span-1 pt-6">
                        <button type="submit" className="w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-bold text-sm uppercase tracking-wide">
                            Gider Ekle
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-rose-500 flex flex-col justify-center">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Toplam Gider</h3>
                    <p className="text-3xl font-black text-rose-600 tracking-tight">₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center mt-4 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full w-fit">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        {expenses.length} Kalem Harcama
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight">Son Harcamalar</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Güncel Liste</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Başlık</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tutar</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {expenses.length > 0 ? (
                                    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">
                                                {new Date(expense.date).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {expense.title}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 inline-flex text-[9px] font-black uppercase rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-rose-600">
                                                -₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                <button 
                                                    onClick={() => { if(window.confirm('Bu harcamayı silmek istediğinize emin misiniz?')) onDeleteExpense(expense.id); }}
                                                    className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Sil"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400 italic">
                                            Henüz kayıtlı bir harcama bulunmuyor.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
