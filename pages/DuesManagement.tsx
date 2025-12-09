
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
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const [selectedMonth, setSelectedMonth] = useState<string>(months[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [defaultAmount, setDefaultAmount] = useState<number>(siteInfo.duesAmount);
    
    // New Filters
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

    const fullMonthString = `${selectedMonth} ${selectedYear}`;

    // Sync default amount with site info (if updated in admin panel)
    useEffect(() => {
        setDefaultAmount(siteInfo.duesAmount);
    }, [siteInfo.duesAmount]);

    // Helper to find apartment info and block ID for a user
    const getUserLocationInfo = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) {
                return { 
                    text: `${block.name} - No: ${apt.number}`, 
                    blockId: block.id 
                };
            }
        }
        return { text: 'Atanmamış', blockId: -1 };
    };

    // Filtered Residents Logic
    const filteredResidents = useMemo(() => {
        // 1. Base Filter: Active Users & Non-Admins (or admins with apartments)
        let result = users.filter(u => u.isActive && (u.role !== 'Yönetici' || (u.vehiclePlate1 || u.vehiclePlate2)));

        // 2. Block Filter
        if (filterBlockId !== 'all') {
            const targetBlockId = parseInt(filterBlockId);
            result = result.filter(u => {
                const loc = getUserLocationInfo(u.id);
                return loc.blockId === targetBlockId;
            });
        }

        // 3. Status Filter
        if (filterStatus !== 'all') {
            result = result.filter(u => {
                const dueRecord = allDues.find(d => d.userId === u.id && d.month === fullMonthString);
                const isPaid = dueRecord?.status === 'Ödendi';
                
                if (filterStatus === 'paid') return isPaid;
                if (filterStatus === 'unpaid') return !isPaid;
                return true;
            });
        }

        return result;
    }, [users, blocks, allDues, filterBlockId, filterStatus, fullMonthString]);

    const handleToggleStatus = (userId: number, currentStatus: 'Ödendi' | 'Ödenmedi' | 'Yok') => {
        const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';
        onUpdateDues(userId, fullMonthString, newStatus, defaultAmount);
    };

    const handleBulkUpdate = (status: 'Ödendi' | 'Ödenmedi') => {
        if (filteredResidents.length === 0) {
            alert("İşlem yapılacak kullanıcı bulunamadı.");
            return;
        }

        const confirmMessage = filterBlockId !== 'all' 
            ? `${fullMonthString} dönemi için SEÇİLİ BLOKTAKİ (${filteredResidents.length} kişi) durumu '${status}' olarak güncellenecek. Onaylıyor musunuz?`
            : `${fullMonthString} dönemi için LİSTELENEN (${filteredResidents.length} kişi) durumu '${status}' olarak güncellenecek. Onaylıyor musunuz?`;

        if (window.confirm(confirmMessage)) {
            filteredResidents.forEach(user => {
                onUpdateDues(user.id, fullMonthString, status, defaultAmount);
            });
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Aidat Yönetimi</h2>

            {/* Filters and Bulk Actions */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
                
                {/* Top Row: Period and Amount */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ay</label>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Varsayılan Tutar (TL)</label>
                        <input 
                            type="number" 
                            value={defaultAmount}
                            onChange={(e) => setDefaultAmount(Number(e.target.value))}
                            className="block w-32 px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 my-2"></div>

                {/* Bottom Row: Filters and Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blok Filtrele</label>
                            <select 
                                value={filterBlockId} 
                                onChange={(e) => setFilterBlockId(e.target.value)}
                                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Tüm Bloklar</option>
                                {blocks.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Durum Filtrele</label>
                            <select 
                                value={filterStatus} 
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Tümü</option>
                                <option value="paid">Ödenenler</option>
                                <option value="unpaid">Ödenmeyenler</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto justify-end">
                        <button 
                            onClick={() => handleBulkUpdate('Ödendi')}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm whitespace-nowrap"
                        >
                            Tümünü Ödendi Yap
                        </button>
                        <button 
                            onClick={() => handleBulkUpdate('Ödenmedi')}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm whitespace-nowrap"
                        >
                            Tümünü Ödenmedi Yap
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sakin</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blok / Daire</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResidents.map(user => {
                            const dueRecord = allDues.find(d => d.userId === user.id && d.month === fullMonthString);
                            const status = dueRecord ? dueRecord.status : 'Ödenmedi';
                            const isPaid = status === 'Ödendi';
                            const locInfo = getUserLocationInfo(user.id);

                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500 whitespace-nowrap">{user.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">{locInfo.text}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isPaid ? 'Ödendi' : 'Ödenmedi'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleToggleStatus(user.id, status)}
                                            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                                                isPaid 
                                                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' 
                                                : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
                                            }`}
                                        >
                                            {isPaid ? 'Ödenmedi Yap' : 'Ödendi Yap'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredResidents.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Kriterlere uygun kayıt bulunamadı.</p>
                )}
            </div>
        </div>
    );
};

export default DuesManagement;
