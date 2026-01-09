import React, { useState, useMemo } from 'react';
import { User, Block } from '../types';

interface AllUsersProps {
  users: User[];
  blocks: Block[];
}

const AllUsers: React.FC<AllUsersProps> = ({ users, blocks }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const residentsWithLocation = useMemo(() => {
    return users
      .map(user => {
        let location = { blockName: 'ZZZ', aptNumber: '999' }; // Sort unassigned users to the end
        for (const block of blocks) {
          const apt = block.apartments.find(a => a.residentId === user.id);
          if (apt) {
            location = { blockName: block.name, aptNumber: apt.number };
            break;
          }
        }
        return { user, location };
      })
      .sort((a, b) => {
        const blockCompare = a.location.blockName.localeCompare(b.location.blockName, 'tr', { numeric: true });
        if (blockCompare !== 0) return blockCompare;
        return parseInt(a.location.aptNumber, 10) - parseInt(b.location.aptNumber, 10);
      });
  }, [users, blocks]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return residentsWithLocation;
    }
    const lowerSearch = searchTerm.toLocaleLowerCase('tr-TR');
    return residentsWithLocation.filter(({ user }) => {
      const nameMatch = user.name.toLocaleLowerCase('tr-TR').includes(lowerSearch);
      const plate1Match = user.vehiclePlate1?.toLocaleLowerCase('tr-TR').replace(/\s/g, '').includes(lowerSearch.replace(/\s/g, ''));
      const plate2Match = user.vehiclePlate2?.toLocaleLowerCase('tr-TR').replace(/\s/g, '').includes(lowerSearch.replace(/\s/g, ''));
      const phoneMatch = user.contactNumber1?.includes(lowerSearch) || user.contactNumber2?.includes(lowerSearch);
      return nameMatch || plate1Match || plate2Match || phoneMatch;
    });
  }, [residentsWithLocation, searchTerm]);

  const handlePrint = () => {
    window.print();
  };
  
  const formatPhoneNumber = (phone: string | undefined) => {
      if (!phone) return null;
      const cleanPhone = phone.trim().replace(/\s/g, '');
      if (cleanPhone.startsWith('0')) return cleanPhone;
      return `0${cleanPhone}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="print:hidden bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tüm Sakinler Listesi</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{filteredData.length} Kayıt Bulundu</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İsim, plaka veya telefon ile ara..." 
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm"
          />
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-indigo-50 text-indigo-600 font-black rounded-xl hover:bg-indigo-100 transition-all shadow-sm active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Yazdır
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/50">
              <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="p-4">Konum</th>
                <th className="p-4">İsim Soyisim</th>
                <th className="p-4">Rol</th>
                <th className="p-4">İletişim Numaraları</th>
                <th className="p-4">Araç Plakaları</th>
                <th className="p-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map(({ user, location }) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-black text-indigo-600 whitespace-nowrap">
                    {location.blockName !== 'ZZZ' ? `${location.blockName} / D:${location.aptNumber}` : 'Atanmamış'}
                  </td>
                  <td className="p-4 font-bold text-gray-800 uppercase tracking-tight whitespace-nowrap">{user.name}</td>
                  <td className="p-4">
                     <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${user.role === 'Yönetici' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : (user.role === 'Daire Sahibi' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200')}`}>{user.role}</span>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-600">
                    <div>{formatPhoneNumber(user.contactNumber1) || '-'}</div>
                    {user.contactNumber2 && <div className="mt-1">{formatPhoneNumber(user.contactNumber2)}</div>}
                  </td>
                  <td className="p-4 text-xs font-mono font-bold text-gray-800 uppercase">
                    <div>{user.vehiclePlate1 || '-'}</div>
                    {user.vehiclePlate2 && <div className="mt-1">{user.vehiclePlate2}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg ${user.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{user.isActive ? 'Aktif' : 'Pasif'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
              <div className="p-16 text-center text-gray-400 text-sm font-bold uppercase italic">
                  Kayıt bulunamadı.
              </div>
          )}
        </div>
      </div>
      
      {/* Print-only version */}
      <div className="hidden print:block">
            <h1 className="text-xl font-bold mb-4 text-center">Tüm Sakinler Listesi ({new Date().toLocaleDateString('tr-TR')})</h1>
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="p-2 text-left font-bold">Konum</th>
                        <th className="p-2 text-left font-bold">İsim Soyisim</th>
                        <th className="p-2 text-left font-bold">İletişim</th>
                        <th className="p-2 text-left font-bold">Plakalar</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map(({ user, location }) => (
                        <tr key={user.id} className="border-b break-inside-avoid">
                            <td className="p-2 font-bold">{location.blockName !== 'ZZZ' ? `${location.blockName}/D:${location.aptNumber}` : 'Atanmamış'}</td>
                            <td className="p-2">{user.name}</td>
                            <td className="p-2">
                                <div>{formatPhoneNumber(user.contactNumber1)}</div>
                                <div>{formatPhoneNumber(user.contactNumber2)}</div>
                            </td>
                            <td className="p-2 uppercase">
                                <div>{user.vehiclePlate1}</div>
                                <div>{user.vehiclePlate2}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
      </div>
      <style>{`
          @media print {
              body {
                  background-color: white;
              }
              .print\\:hidden {
                  display: none;
              }
              .print\\:block {
                  display: block;
              }
              table {
                  font-size: 10px;
              }
              td, th {
                  padding: 6px 4px;
              }
          }
      `}</style>
    </div>
  );
};

export default AllUsers;
