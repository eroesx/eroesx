
import React, { useState } from 'react';
import { User, Block } from '../types';

interface PlateInquiryProps {
  users: User[];
  blocks: Block[];
}

interface SearchResult {
    user: User;
    blockName: string;
    apartmentNumber: string;
    matchedPlate: string; // Or "All Plates" string
}

const PlateInquiry: React.FC<PlateInquiryProps> = ({ users, blocks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const formatPhoneNumber = (phone: string | undefined) => {
      if (!phone) return null;
      const cleanPhone = phone.trim().replace(/\s/g, '');
      if (cleanPhone.startsWith('0')) return cleanPhone;
      return `0${cleanPhone}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setSearchResults([]);

    // Correct Turkish upper casing
    const term = searchTerm.trim().toLocaleUpperCase('tr-TR').replace(/\s/g, '');

    let results: SearchResult[] = [];

    if (!term) {
        // List ALL users with plates
        const usersWithPlates = users.filter(u => u.vehiclePlate1 || u.vehiclePlate2);
        
        results = usersWithPlates.map(user => {
            let blockName = 'Bilinmiyor';
            let apartmentNumber = 'Bilinmiyor';
            
            for (const block of blocks) {
                const apt = block.apartments.find(a => a.residentId === user.id);
                if (apt) {
                blockName = block.name;
                apartmentNumber = apt.number;
                break;
                }
            }

            // Display both plates if they exist
            const plates = [user.vehiclePlate1, user.vehiclePlate2].filter(Boolean).join(' / ');

            return {
                user,
                blockName,
                apartmentNumber,
                matchedPlate: plates
            };
        });
    } else {
        // Filter by specific plate
        const foundUsers = users.filter(user => {
            const plate1 = user.vehiclePlate1?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            const plate2 = user.vehiclePlate2?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            return plate1.includes(term) || plate2.includes(term);
        });

        results = foundUsers.map(user => {
            let blockName = 'Bilinmiyor';
            let apartmentNumber = 'Bilinmiyor';
            
            for (const block of blocks) {
                const apt = block.apartments.find(a => a.residentId === user.id);
                if (apt) {
                blockName = block.name;
                apartmentNumber = apt.number;
                break;
                }
            }

            // Determine which plate matched, or show both if just generic match logic
            const plate1 = user.vehiclePlate1?.toLocaleUpperCase('tr-TR').replace(/\s/g, '') || '';
            const plate1Clean = user.vehiclePlate1 || '';
            const plate2Clean = user.vehiclePlate2 || '';
            
            let displayPlate = '';
            if (plate1.includes(term)) {
                displayPlate = plate1Clean;
                if(plate2Clean) displayPlate += ` / ${plate2Clean} (Diğer)`;
            } else {
                displayPlate = plate2Clean;
                 if(plate1Clean) displayPlate += ` / ${plate1Clean} (Diğer)`;
            }

            return {
                user,
                blockName,
                apartmentNumber,
                matchedPlate: displayPlate
            };
        });
    }

    setSearchResults(results);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <h2 className="text-lg font-black text-gray-800 mb-4 uppercase tracking-tight">Araç Plaka Sorgulama</h2>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Plaka (örn: 34 ABC 123)" 
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-bold placeholder:font-normal"
            />
            <button 
                type="submit" 
                className="w-full sm:w-32 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 text-xs md:text-sm uppercase tracking-wider"
            >
                Sorgula
            </button>
        </form>
      </div>

      {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {searchResults.map((result, index) => (
                <div key={index} className="bg-white border-l-8 border-indigo-500 rounded-2xl shadow-sm p-5 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 break-all leading-tight">{result.matchedPlate}</h3>
                        <span className="shrink-0 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest ml-2 border border-green-100">
                            Kayıtlı
                        </span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="min-w-0">
                                <label className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1 block">Sahibi</label>
                                <p className="text-xs md:text-sm font-bold text-gray-800 truncate">{result.user.name}</p>
                            </div>
                            <div className="min-w-0">
                                <label className="text-[9px] uppercase text-gray-400 font-black tracking-widest mb-1 block">Konum</label>
                                <p className="text-xs md:text-sm text-gray-800 font-bold truncate">{result.blockName} / D:{result.apartmentNumber}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-100">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                {result.user.contactNumber1 ? (
                                    <a href={`tel:${formatPhoneNumber(result.user.contactNumber1)}`} className="text-indigo-600 hover:underline text-xs font-black">
                                        {formatPhoneNumber(result.user.contactNumber1)}
                                    </a>
                                ) : (
                                    <span className="text-gray-400 italic text-xs">Yok</span>
                                )}
                            </div>

                            {result.user.contactNumber2 && (
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <a href={`tel:${formatPhoneNumber(result.user.contactNumber2)}`} className="text-indigo-600 hover:underline text-xs font-black">
                                        {formatPhoneNumber(result.user.contactNumber2)}
                                    </a>
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
            <p className="mt-2 text-xs text-gray-500 font-medium">Girilen plakaya ait bir sakin kaydı sistemde mevcut değil.</p>
        </div>
      )}
    </div>
  );
};

export default PlateInquiry;
