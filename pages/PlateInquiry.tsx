
import React, { useState, useMemo } from 'react';
import { User, Block } from '../types';

interface PlateInquiryProps {
  currentUser: User;
  users: User[];
  blocks: Block[];
}

interface SearchResult {
    user: User;
    blockName: string;
    apartmentNumber: string;
    floor: string;
    matchedPlate: string;
}

const calculateFloorFallback = (blockName: string, aptNumber: string): string => {
    const num = parseInt(aptNumber);
    if (isNaN(num)) return '-';
    const block = blockName.toUpperCase().replace(/\s/g, '');

    if (block === 'A1') {
        if (num === 1) return '0';
        return Math.ceil((num - 1) / 2).toString();
    }
    if (block === 'A2' || block === 'B1') {
        return Math.ceil(num / 2).toString();
    }
    if (block === 'B2') {
        if (num === 1) return '0';
        return Math.ceil((num - 1) / 2).toString();
    }
    if (block === 'C1' || block === 'C2') {
        return (Math.ceil(num / 2) + 1).toString();
    }
    return '-';
};

const PlateInquiry: React.FC<PlateInquiryProps> = ({ currentUser, users, blocks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const formatPhoneNumber = (phone: string | undefined) => {
      if (!phone) return null;
      const cleanPhone = phone.trim().replace(/\s/g, '');
      if (cleanPhone.startsWith('0')) return cleanPhone;
      return `0${cleanPhone}`;
  };

  const allPlates = useMemo(() => {
        const usersWithPlates = users.filter(u => u.vehiclePlate1 || u.vehiclePlate2);
        
        return usersWithPlates.map(user => {
            let blockName = 'Bilinmiyor';
            let apartmentNumber = 'Bilinmiyor';
            let floor = '-';
            
            for (const block of blocks) {
                const apt = block.apartments.find(a => a.residentId === user.id);
                if (apt) {
                    blockName = block.name;
                    apartmentNumber = apt.number;
                    floor = apt.floor || calculateFloorFallback(block.name, apt.number);
                    break;
                }
            }

            const plate1 = user.vehiclePlate1 || '';
            const plate2 = user.vehiclePlate2 || '';
            const displayPlate = [plate1, plate2].filter(Boolean).join(' / ');

            return {
                user,
                blockName,
                apartmentNumber,
                floor,
                matchedPlate: displayPlate || 'Plaka Kaydı Yok'
            };
        }).sort((a, b) => {
            if (a.blockName !== b.blockName) return a.blockName.localeCompare(b.blockName);
            return parseInt(a.apartmentNumber) - parseInt(b.apartmentNumber);
        });
  }, [users, blocks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setSearchResults([]);

    const term = searchTerm.trim().toLocaleUpperCase('tr-TR');

    let results: SearchResult[] = [];

    if (!term) {
        results = allPlates;
    } else {
        const foundUsers = users.filter(user => {
            const plate1 = user.vehiclePlate1?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            const plate2 = user.vehiclePlate2?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            const name = user.name.toLocaleUpperCase('tr-TR') || '';
            const termNoSpace = term.replace(/\s/g, '');
            
            return plate1.includes(termNoSpace) || plate2.includes(termNoSpace) || name.includes(term);
        });

        results = foundUsers.map(user => {
            let blockName = 'Bilinmiyor';
            let apartmentNumber = 'Bilinmiyor';
            let floor = '-';
            
            for (const block of blocks) {
                const apt = block.apartments.find(a => a.residentId === user.id);
                if (apt) {
                    blockName = block.name;
                    apartmentNumber = apt.number;
                    floor = apt.floor || calculateFloorFallback(block.name, apt.number);
                    break;
                }
            }

            const plate1 = user.vehiclePlate1 || '';
            const plate2 = user.vehiclePlate2 || '';
            const displayPlate = [plate1, plate2].filter(Boolean).join(' / ') || 'Plaka Kaydı Yok';

            return {
                user,
                blockName,
                apartmentNumber,
                floor,
                matchedPlate: displayPlate
            };
        });
    }

    setSearchResults(results);
  };

  const handlePrint = () => {
      window.print();
  };

  const dataToDisplay = hasSearched && searchResults.length > 0 ? searchResults : (hasSearched ? [] : allPlates);
  const printData = hasSearched && searchResults.length > 0 ? searchResults : allPlates;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="print:hidden">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
            <h2 className="text-lg font-black text-gray-800 mb-4 uppercase tracking-tight">Araç / Sakin Sorgulama</h2>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Plaka veya İsim (örn: 34 ABC 123 veya Ahmet Yılmaz)" 
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-bold placeholder:font-normal"
                />
                <button 
                    type="submit" 
                    className="w-full sm:w-32 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 text-xs md:text-sm uppercase tracking-wider"
                >
                    Sorgula
                </button>
                {currentUser.role === 'Yönetici' && (
                    <button 
                        type="button" 
                        onClick={handlePrint}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 font-black rounded-xl hover:bg-gray-200 transition-all shadow-sm active:scale-95 text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Listeyi Yazdır
                    </button>
                )}
            </form>
        </div>

        {hasSearched && dataToDisplay.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {dataToDisplay.map((result, index) => (
                    <div key={index} className="bg-white border-l-8 border-indigo-500 rounded-2xl shadow-sm p-5 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0">
                                <h3 className="text-lg md:text-xl font-black text-gray-900 break-all leading-tight mb-1">{result.matchedPlate}</h3>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight">{result.user.name}</p>
                            </div>
                            <span className="shrink-0 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest ml-2 border border-green-100">
                                Kayıtlı
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="min-w-0">
                                    <label className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1 block">Konum</label>
                                    <p className="text-xs md:text-sm text-gray-800 font-bold truncate">
                                        {result.blockName} / Kat:{result.floor} / Daire:{result.apartmentNumber}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <label className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1 block">Durum</label>
                                    <p className="text-xs md:text-sm font-bold text-emerald-600 uppercase">Aktif Sakin</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                                <div>
                                    <label className="text-[9px] uppercase text-indigo-400 font-black tracking-widest mb-1 block">1. İrtibat Numarası</label>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        {result.user.contactNumber1 ? (
                                            <a href={`tel:${formatPhoneNumber(result.user.contactNumber1)}`} className="text-indigo-700 hover:underline text-lg md:text-xl font-black tracking-tight">
                                                {formatPhoneNumber(result.user.contactNumber1)}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 italic text-sm font-bold">Yok</span>
                                        )}
                                    </div>
                                </div>

                                {result.user.contactNumber2 && (
                                    <div className="pt-2 border-t border-gray-200/50">
                                        <label className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1 block">2. İrtibat Numarası</label>
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                            <a href={`tel:${formatPhoneNumber(result.user.contactNumber2)}`} className="text-gray-600 hover:underline text-xs font-bold">
                                                {formatPhoneNumber(result.user.contactNumber2)}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {hasSearched && searchResults.length === 0 && (
            <div className="bg-white border-l-8 border-rose-500 p-5 rounded-2xl shadow-sm animate-in zoom-in-95 duration-300">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-black text-gray-900 text-sm uppercase tracking-tight">Kayıt Bulunamadı</p>
                </div>
                <p className="mt-2 text-xs text-gray-500 font-medium">Girilen plaka veya isme ait bir sakin kaydı sistemde mevcut değil.</p>
            </div>
        )}
      </div>

      <div className="hidden print:block p-8 bg-white">
          <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-black uppercase text-gray-900">Site Araç Plaka Listesi</h1>
              <p className="text-sm font-bold text-gray-600 mt-2">{new Date().toLocaleDateString('tr-TR')} Tarihli Güncel Liste</p>
          </div>
          
          <table className="w-full text-left text-sm border-collapse">
              <thead>
                  <tr className="border-b-2 border-gray-800">
                      <th className="py-2 px-3 font-black uppercase text-gray-900 w-[15%]">Blok / Kat / Daire</th>
                      <th className="py-2 px-3 font-black uppercase text-gray-900 w-[25%]">İsim Soyisim</th>
                      <th className="py-2 px-3 font-black uppercase text-gray-900 w-[30%]">Plakalar</th>
                      <th className="py-2 px-3 font-black uppercase text-gray-900 w-[30%]">İletişim</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                  {printData.map((result, idx) => (
                      <tr key={idx} className="break-inside-avoid">
                          <td className="py-3 px-3 align-top font-bold text-gray-800">
                              {result.blockName} / K:{result.floor} / D:{result.apartmentNumber}
                          </td>
                          <td className="py-3 px-3 align-top text-gray-700 font-semibold uppercase">
                              {result.user.name}
                          </td>
                          <td className="py-3 px-3 align-top font-black text-gray-900">
                              {result.matchedPlate}
                          </td>
                          <td className="py-3 px-3 align-top text-gray-700 font-mono text-xs">
                              <div>{formatPhoneNumber(result.user.contactNumber1)}</div>
                              {result.user.contactNumber2 && <div>{formatPhoneNumber(result.user.contactNumber2)}</div>}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 font-medium italic">
              Bu liste site yönetimi tarafından oluşturulmuştur.
          </div>
      </div>
    </div>
  );
};

export default PlateInquiry;
