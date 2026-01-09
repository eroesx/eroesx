
import React, { useState, useMemo, useEffect } from 'react';
import { Expense } from '../types';

interface ExpensesProps {
    expenses: Expense[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onUpdateExpense: (expense: Expense) => void;
    onDeleteExpense: (id: number) => void;
}

const ExpenseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
    expenseToEdit?: Expense | null;
    availableCategories: string[];
}> = ({ isOpen, onClose, onSave, expenseToEdit, availableCategories }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Genel');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState('');
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (expenseToEdit) {
            setTitle(expenseToEdit.title);
            setAmount(expenseToEdit.amount.toString());
            setCategory(expenseToEdit.category);
            setDate(expenseToEdit.date);
            setDescription(expenseToEdit.description || '');
        } else {
            setTitle('');
            setAmount('');
            setCategory('Genel');
            setDate(new Date().toISOString().slice(0, 10));
            setDescription('');
        }
        setIsAddingNewCategory(false);
        setNewCategoryName('');
    }, [expenseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalCategory = isAddingNewCategory ? newCategoryName.trim() : category;

        if (!title.trim() || !amount || !finalCategory.trim()) {
            alert("Lütfen zorunlu alanları doldurunuz.");
            return;
        }

        const data = {
            title: title.trim(),
            amount: parseFloat(amount),
            category: finalCategory,
            date,
            description: description.trim()
        };

        if (expenseToEdit) {
            onSave({ ...expenseToEdit, ...data });
        } else {
            onSave(data);
        }
        onClose();
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'ADD_NEW') {
            setIsAddingNewCategory(true);
        } else {
            setIsAddingNewCategory(false);
            setCategory(value);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                        {expenseToEdit ? 'Gider Kaydını Düzenle' : 'Yeni Gider Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gider Başlığı</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" placeholder="Örn: Asansör Bakımı" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tutar (₺)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" placeholder="0.00" min="0" step="0.01" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                            <select value={isAddingNewCategory ? 'ADD_NEW' : category} onChange={handleCategoryChange} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm">
                                {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                <option value="ADD_NEW" className="font-black text-indigo-600">+ Yeni Kategori...</option>
                            </select>
                            {isAddingNewCategory && (
                                <input autoFocus type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Kategori Adı" className="w-full mt-2 px-5 py-2.5 border border-indigo-100 bg-indigo-50/30 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-xs" required />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tarih</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" required />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Açıklama</label>
                        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm" placeholder="Gider hakkında detaylar..." />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Vazgeç</button>
                        <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                            {expenseToEdit ? 'Güncellemeleri Kaydet' : 'Gideri Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // --- Filter States ---
    const [filterCategory, setFilterCategory] = useState('Tümü');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterMinAmount, setFilterMinAmount] = useState('');
    const [filterMaxAmount, setFilterMaxAmount] = useState('');
    const [searchTitle, setSearchTitle] = useState('');

    const availableCategories = useMemo(() => {
        const defaultCats = ['Genel', 'Bakım & Onarım', 'Personel', 'Faturalar', 'Temizlik', 'Demirbaş'];
        const existingCats = Array.from(new Set(expenses.map(e => e.category)));
        return [...new Set([...defaultCats, ...existingCats])].sort();
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            if (filterCategory !== 'Tümü' && exp.category !== filterCategory) return false;
            if (searchTitle && !exp.title.toLocaleLowerCase('tr-TR').includes(searchTitle.toLocaleLowerCase('tr-TR'))) return false;
            if (filterStartDate && exp.date < filterStartDate) return false;
            if (filterEndDate && exp.date > filterEndDate) return false;
            if (filterMinAmount && exp.amount < parseFloat(filterMinAmount)) return false;
            if (filterMaxAmount && exp.amount > parseFloat(filterMaxAmount)) return false;
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, filterCategory, searchTitle, filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount]);

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const filteredTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

    const handleSaveExpense = (data: Omit<Expense, 'id'> | Expense) => {
        if ('id' in data) {
            onUpdateExpense(data);
        } else {
            onAddExpense(data);
        }
    };

    const handleEditClick = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const clearFilters = () => {
        setFilterCategory('Tümü');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterMinAmount('');
        setFilterMaxAmount('');
        setSearchTitle('');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            <ExpenseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveExpense} 
                expenseToEdit={editingExpense} 
                availableCategories={availableCategories} 
            />

            {/* Header and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Gider Yönetimi</h2>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Site harcamalarını detaylı takip edin</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddClick}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center shrink-0"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Yeni Gider Girişi
                    </button>
                </div>
                
                <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center border border-rose-500 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Toplam Harcama</p>
                    <p className="text-3xl font-black tracking-tighter leading-none">₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Quick Category Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        Kategoriye Göre Hızlı Filtrele
                    </h3>
                </div>
                
                <div className="flex flex-wrap gap-2 px-2">
                    <button 
                        onClick={() => setFilterCategory('Tümü')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === 'Tümü' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'}`}
                    >
                        Tümü ({expenses.length})
                    </button>
                    {availableCategories.map(cat => {
                        const count = expenses.filter(e => e.category === cat).length;
                        if (count === 0 && filterCategory !== cat) return null;
                        return (
                            <button 
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'}`}
                            >
                                {cat} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gelişmiş Arama</h3>
                        {(filterStartDate || filterEndDate || filterMinAmount || filterMaxAmount || searchTitle) && (
                            <button onClick={clearFilters} className="text-[10px] font-black text-rose-600 uppercase hover:underline">Filtreleri Temizle</button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Hızlı Arama</label>
                            <input type="text" value={searchTitle} onChange={e => setSearchTitle(e.target.value)} placeholder="Başlıkta ara..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Başlangıç Tarihi</label>
                            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bitiş Tarihi</label>
                            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Min. Tutar</label>
                            <input type="number" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Max. Tutar</label>
                            <input type="number" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} placeholder="∞" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List and Results */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight">Harcama Listesi</h3>
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-gray-400 uppercase">{filteredExpenses.length} Kayıt</span>
                    </div>
                    {filteredExpenses.length !== expenses.length && (
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-rose-100 shadow-sm animate-in fade-in">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrelenen Toplam:</span>
                            <span className="text-xs font-black text-rose-600">₺{filteredTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50/30">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Gider Başlığı</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tutar</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-indigo-50/10 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-gray-500">
                                            {new Date(expense.date).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{expense.title}</span>
                                                {expense.description && <span className="text-[10px] text-gray-400 font-medium truncate max-w-xs">{expense.description}</span>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border ${filterCategory === expense.category ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-rose-600">
                                            -₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right space-x-2">
                                            <button 
                                                onClick={() => handleEditClick(expense)}
                                                className="p-2.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Düzenle"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => { if(window.confirm('Bu harcamayı silmek istediğinize emin misiniz?')) onDeleteExpense(expense.id); }}
                                                className="p-2.5 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Sil"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-6 bg-gray-50 rounded-full mb-4 text-gray-300">
                                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            </div>
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Filtreye uygun harcama kaydı bulunmuyor.</p>
                                            <button onClick={clearFilters} className="mt-4 text-indigo-600 font-black text-xs uppercase hover:underline">Tüm Filtreleri Kaldır</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
