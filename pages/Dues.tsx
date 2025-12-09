import React, { useMemo } from 'react';
import { Dues as DuesType, User } from '../types';

interface DuesProps {
    currentUser: User;
    allDues: DuesType[];
}

const Dues: React.FC<DuesProps> = ({ currentUser, allDues }) => {

    const userDues = useMemo(() => {
        // Filter dues specifically for the current user
        return allDues.filter(due => due.userId === currentUser.id);
    }, [currentUser, allDues]);

    const statusClasses = {
        'Ödendi': 'bg-green-100 text-green-800',
        'Ödenmedi': 'bg-red-100 text-red-800'
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Aidat Geçmişim</h2>
            </div>
            
            {userDues.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Dönem</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Tutar</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {userDues.map(due => (
                        <tr key={due.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4">{due.month}</td>
                            <td className="py-3 px-4">₺{due.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[due.status]}`}>
                                {due.status}
                            </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            ) : (
                 <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p>Henüz kayıtlı aidat ödemeniz bulunmamaktadır.</p>
                </div>
            )}
        </div>
    );
};

export default Dues;