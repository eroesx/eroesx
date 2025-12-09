
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
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Araç Plaka Sorgulama</h2>
        <p className="text-sm text-gray-600 mb-4">
            Belirli bir araç aramak için plaka giriniz. Tüm kayıtlı araçları listelemek için kutuyu boş bırakıp "Sorgula" butonuna basınız.
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-4">
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Plaka giriniz (örn: 34 ABC 123)" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button 
                type="submit" 
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Sorgula
            </button>
        </form>
      </div>

      {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in-up">
            {searchResults.map((result, index) => (
                <div key={index} className="bg-white border-l-4 border-indigo-500 rounded-lg shadow-md p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 break-all">{result.matchedPlate}</h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mt-2 sm:mt-0 whitespace-nowrap">
                            Kayıt Bulundu
                        </span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-semibold">Araç Sahibi</label>
                                <p className="text-base font-medium text-gray-900">{result.user.name}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-semibold">Konum</label>
                                <p className="text-sm text-gray-800 font-medium">{result.blockName} - Daire: {result.apartmentNumber}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                            <h4 className="text-xs font-semibold text-gray-700 border-b pb-1 mb-1">İletişim</h4>
                            
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                {result.user.contactNumber1 ? (
                                    <a href={`tel:${result.user.contactNumber1}`} className="text-indigo-600 hover:underline text-sm font-medium">
                                        {result.user.contactNumber1}
                                    </a>
                                ) : (
                                    <span className="text-gray-400 italic text-sm">Yok</span>
                                )}
                            </div>

                            {result.user.contactNumber2 && (
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <a href={`tel:${result.user.contactNumber2}`} className="text-indigo-600 hover:underline text-sm font-medium">
                                        {result.user.contactNumber2}
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
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">Sonuç Bulunamadı</p>
            </div>
            <p className="mt-1 ml-8">Kriterlerinize uygun araç kaydı sistemde bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
};

export default PlateInquiry;
