
import React, { useState } from 'react';
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

    const categories = ['Genel', 'Bakım & Onarım', 'Personel', 'Faturalar', 'Temizlik', 'Demirbaş'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount) return;

        onAddExpense({
            title,
            amount: parseFloat(amount),
            category,
            date,
            description
        });

        // Reset Form
        setTitle('');
        setAmount('');
        setDescription('');
    };

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Gider Yönetimi</h2>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gider Başlığı</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
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
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <button type="submit" className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                            Ekle
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Toplam Gider</h3>
                    <p className="text-3xl font-bold text-red-600">₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-gray-500 mt-1">{expenses.length} Kalem Harcama</p>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Son Harcamalar</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.length > 0 ? (
                                    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                        <tr key={expense.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(expense.date).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {expense.title}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                                -₺{expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => onDeleteExpense(expense.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                            Henüz kayıtlı gider bulunmuyor.
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
