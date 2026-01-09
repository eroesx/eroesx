
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Block, Apartment, User } from '../types';

interface BlockManagementProps {
    blocks: Block[];
    users: User[];
    onDeleteUser: (userId: number) => void;
    onUpdateUser: (user: User) => void;
    onAddBlock: (name: string, apartments?: Apartment[]) => void;
    onUpdateBlock: (id: number, name: string, apartments?: Apartment[]) => void;
    onDeleteBlock: (id: number) => void;
    onAddApartment: (blockId: number, apartment: Omit<Apartment, 'id'>) => void;
    onUpdateApartment: (blockId: number, apartment: Apartment) => void;
    onDeleteApartment: (blockId: number, apartmentId: number) => void;
    onVacateApartment: (blockId: number, apartmentId: number) => void;
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

const BlockManagement: React.FC<BlockManagementProps> = ({ 
    blocks, 
    users, 
    onDeleteUser, 
    onUpdateUser,
    onAddBlock,
    onUpdateBlock,
    onDeleteBlock,
    onAddApartment,
    onUpdateApartment,
    onDeleteApartment,
    onVacateApartment
}) => {
    // State for Block Modal
    const [isBlockModalOpen, setBlockModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [blockName, setBlockName] = useState('');

    // State for Apartment Modal
    const [isAptModalOpen, setAptModalOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<{ blockId: number, apt: Apartment | Partial<Apartment> } | null>(null);
    
    // Apartment Form States
    const [aptNumber, setAptNumber] = useState('');
    const [aptFloor, setAptFloor] = useState('');
    const [aptResidentId, setAptResidentId] = useState<string>('');
    const [isSpecial, setIsSpecial] = useState(false);
    const [aptDescription, setAptDescription] = useState('');
    const [customDuesAmount, setCustomDuesAmount] = useState('');
    
    // Change: Renamed logic from 'Passive' to 'Delete'
    const [shouldDeleteUser, setShouldDeleteUser] = useState(false);

    // UX States: Search & Accordion
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedBlockIds, setExpandedBlockIds] = useState<number[]>([]);
    
    // Track previous search term to handle clearing logic vs data update logic
    const prevSearchTermRef = useRef(searchTerm);

    // Initialize Apt Form when editingApt changes
    useEffect(() => {
        if (editingApt && editingApt.apt) {
            setAptNumber(editingApt.apt.number || '');
            setAptFloor(editingApt.apt.floor || '');
            setAptResidentId(editingApt.apt.residentId ? String(editingApt.apt.residentId) : '');
            setIsSpecial(editingApt.apt.isSpecial || false);
            setAptDescription(editingApt.apt.description || '');
            setCustomDuesAmount(editingApt.apt.customDuesAmount ? String(editingApt.apt.customDuesAmount) : '');
            setShouldDeleteUser(false);
        } else {
            setAptNumber('');
            setAptFloor('');
            setAptResidentId('');
            setIsSpecial(false);
            setAptDescription('');
            setCustomDuesAmount('');
            setShouldDeleteUser(false);
        }
    }, [editingApt]);

    // Handle Search Logic: Auto expand blocks with results
    // Updated Logic: Only collapse all if user explicitly cleared the search term.
    // If data updates (blocks/users change) while searchTerm is empty, DO NOT collapse.
    useEffect(() => {
        const currentSearchTrimmed = searchTerm.trim();
        const prevSearchTrimmed = prevSearchTermRef.current.trim();

        if (currentSearchTrimmed.length > 0) {
            const matchingBlockIds: number[] = [];
            blocks.forEach(block => {
                const hasMatch = block.apartments.some(apt => {
                    const resident = users.find(u => u.id === apt.residentId);
                    const nameMatch = resident?.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const numMatch = apt.number.includes(searchTerm);
                    return nameMatch || numMatch;
                });
                if (hasMatch) matchingBlockIds.push(block.id);
            });
            setExpandedBlockIds(matchingBlockIds);
        } else if (prevSearchTrimmed.length > 0 && currentSearchTrimmed.length === 0) {
            // User just cleared the search, collapse all
            setExpandedBlockIds([]); 
        }
        
        prevSearchTermRef.current = searchTerm;
    }, [searchTerm, blocks, users]);

    const handleSaveBlock = () => {
        if (!blockName.trim()) return;
        if (editingBlock) {
            onUpdateBlock(editingBlock.id, blockName);
        } else {
            onAddBlock(blockName);
        }
        setBlockModalOpen(false);
        setEditingBlock(null);
        setBlockName('');
    };

    const handleSaveApt = () => {
        if (!editingApt || !aptNumber.trim()) return;
    
        const oldResidentId = editingApt.apt.residentId;
        const newResidentId = aptResidentId ? Number(aptResidentId) : undefined;

        // 1. DELETE USER LOGIC
        // If there was a resident, we are unassigning them (newResidentId is undefined), AND delete checkbox is checked
        if (oldResidentId && !newResidentId && shouldDeleteUser) {
            // onDeleteUser in App.tsx handles removing the user AND clearing their apartment assignment
            onDeleteUser(oldResidentId);
            setAptModalOpen(false);
            setEditingApt(null);
            return; 
        }

        // 2. AUTO-ACTIVATE USER LOGIC
        // If assigning a user who is currently passive, make them active automatically
        if (newResidentId) {
            const userToAssign = users.find(u => u.id === newResidentId);
            if (userToAssign && !userToAssign.isActive) {
                onUpdateUser({ ...userToAssign, isActive: true });
            }
        }
    
        // 3. STANDARD UPDATE/ADD LOGIC
        if (editingApt.apt.id) { // Editing existing apartment
            const existingApt = editingApt.apt as Apartment;
            
            const updatedApt: Apartment = {
                id: existingApt.id,
                number: aptNumber,
                floor: aptFloor,
                status: newResidentId ? 'Dolu' : 'Boş',
                isSpecial: isSpecial,
                description: aptDescription.trim(),
                customDuesAmount: customDuesAmount ? parseFloat(customDuesAmount) : undefined,
            };
    
            // If selecting a new resident (or keeping same), assign ID. 
            // If clearing (and NOT deleting user above), residentId becomes undefined implicitly or explicitly logic in App.tsx
            if (newResidentId) {
                updatedApt.residentId = newResidentId;
            } else {
                // Explicitly clear if unassigning but keeping user in system
                delete updatedApt.residentId; 
            }
    
            onUpdateApartment(editingApt.blockId, updatedApt);
    
        } else { // Adding new apartment
            const newAptData: any = {
                number: aptNumber,
                floor: aptFloor,
                status: newResidentId ? 'Dolu' : 'Boş',
                isSpecial,
                description: aptDescription.trim(),
                customDuesAmount: customDuesAmount ? parseFloat(customDuesAmount) : undefined,
            };
            if (newResidentId) {
                newAptData.residentId = newResidentId;
            }
            onAddApartment(editingApt.blockId, newAptData);
        }
        
        setAptModalOpen(false);
        setEditingApt(null);
    };

    const handleDeleteApt = () => {
        if (!editingApt || !editingApt.apt.id) return;
        if (window.confirm(`${editingApt.apt.number} numaralı daireyi tamamen silmek istediğinize emin misiniz?`)) {
            onDeleteApartment(editingApt.blockId, editingApt.apt.id);
            setAptModalOpen(false);
            setEditingApt(null);
        }
    };

    const toggleBlock = (blockId: number) => {
        setExpandedBlockIds(prev => 
            prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]
        );
    };

    const availableUsers = useMemo(() => {
        const assignedUserIds = new Set<number>();
        blocks.forEach(b => b.apartments.forEach(a => {
            // Collect IDs of residents assigned to OTHER apartments.
            // If user is assigned to THIS apartment (editingApt), don't add to set so they show up in list.
            if (a.residentId && a.id !== editingApt?.apt?.id) {
                assignedUserIds.add(a.residentId);
            }
        }));

        // Show users who are NOT assigned to another apartment.
        // We include inactive users so they can be re-assigned.
        return users.filter(u => 
            !assignedUserIds.has(u.id)
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [users, blocks, editingApt]);

    // Filter logic for display
    const getFilteredApartments = (block: Block) => {
        if (!searchTerm) return block.apartments.sort((a,b) => parseInt(a.number) - parseInt(b.number));
        
        const term = searchTerm.toLowerCase();
        return block.apartments.filter(apt => {
            const resident = users.find(u => u.id === apt.residentId);
            return (resident?.name.toLowerCase().includes(term) || apt.number.includes(term));
        }).sort((a,b) => parseInt(a.number) - parseInt(b.number));
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header: Title, Search, Add Button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-full md:w-auto">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Blok & Daire Yönetimi</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Site yapısını düzenleyin</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:min-w-[250px]">
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Sakin adı veya daire no ara..." 
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-xs"
                        />
                        <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button 
                        onClick={() => { setEditingBlock(null); setBlockName(''); setBlockModalOpen(true); }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all whitespace-nowrap"
                    >
                        + Yeni Blok
                    </button>
                </div>
            </div>

            {/* Blocks Display */}
            <div className="grid grid-cols-1 gap-4">
                {blocks.map(block => {
                    const isExpanded = expandedBlockIds.includes(block.id);
                    const filteredApts = getFilteredApartments(block);
                    
                    // Don't show block if searching and no matches in this block
                    if (searchTerm && filteredApts.length === 0) return null;

                    return (
                        <div key={block.id} className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 ${isExpanded ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-gray-100'}`}>
                            <div 
                                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50/80 transition-colors rounded-3xl"
                                onClick={() => toggleBlock(block.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-90' : 'bg-gray-100 text-gray-400'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{block.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{block.apartments.length} Daire / {block.apartments.filter(a => a.status === 'Dolu').length} Dolu</p>
                                    </div>
                                </div>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => { setEditingBlock(block); setBlockName(block.name); setBlockModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-gray-200 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                    <button onClick={() => { if(window.confirm('Bu bloğu silmek istediğinize emin misiniz?')) onDeleteBlock(block.id); }} className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-white rounded-xl border border-gray-200 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {filteredApts.map(apt => {
                                            const resident = users.find(u => u.id === apt.residentId);
                                            return (
                                                <div 
                                                    key={apt.id} 
                                                    onClick={() => { setEditingApt({ blockId: block.id, apt }); setAptModalOpen(true); }}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all group cursor-pointer hover:scale-[1.02] active:scale-95 ${apt.status === 'Dolu' ? 'border-indigo-100 bg-indigo-50/30 hover:border-indigo-200' : 'border-gray-100 bg-white hover:border-gray-300'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">No: {apt.number}</span>
                                                        <span className={`w-2 h-2 rounded-full ${apt.status === 'Dolu' ? 'bg-indigo-500' : 'bg-gray-300'}`}></span>
                                                    </div>
                                                    <div className="mb-3 min-h-[40px]">
                                                        {resident ? (
                                                            <div>
                                                                <p className="text-xs font-black text-gray-800 uppercase tracking-tight line-clamp-1">{resident.name}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Kat: {apt.floor || calculateFloorFallback(block.name, apt.number)}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] font-bold text-gray-300 uppercase italic">Boş Daire</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="absolute bottom-2 right-2">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if(window.confirm('Bu daireyi silmek istediğinize emin misiniz?')) onDeleteApartment(block.id, apt.id); 
                                                            }} 
                                                            className="p-1.5 bg-white text-rose-300 rounded-lg shadow-sm border border-gray-100 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                            title="Daireyi Sil"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingApt({ blockId: block.id, apt: {} }); setAptModalOpen(true); }}
                                            className="p-4 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/10 transition-all min-h-[100px]"
                                        >
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Daire Ekle</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Block Modal */}
            {isBlockModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-4">{editingBlock ? 'Bloğu Düzenle' : 'Yeni Blok Ekle'}</h3>
                        <input 
                            autoFocus
                            type="text" 
                            value={blockName} 
                            onChange={e => setBlockName(e.target.value)} 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm mb-6"
                            placeholder="Blok Adı (Örn: A Blok)"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setBlockModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">İptal</button>
                            <button onClick={handleSaveBlock} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Apartment Modal */}
            {isAptModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{editingApt?.apt.id ? 'Daire Düzenle' : 'Yeni Daire Ekle'}</h3>
                            <button onClick={() => setAptModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Daire No</label>
                                <input type="text" value={aptNumber} onChange={e => setAptNumber(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" placeholder="No" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Kat</label>
                                <input type="text" value={aptFloor} onChange={e => setAptFloor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" placeholder="Kat" />
                            </div>
                        </div>

                        <div className="space-y-1 mb-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Sakin Ata</label>
                            <select value={aptResidentId} onChange={e => setAptResidentId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm">
                                <option value="">-- Boş --</option>
                                {availableUsers.map(u => (
                                    <option key={u.id} value={String(u.id)}>
                                        {u.name} {u.isActive ? '' : '(Pasif)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {editingApt?.apt?.residentId && !aptResidentId && (
                             <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                                 <input 
                                    type="checkbox" 
                                    id="deleteUser" 
                                    checked={shouldDeleteUser} 
                                    onChange={e => setShouldDeleteUser(e.target.checked)} 
                                    className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500 border-gray-300"
                                />
                                <label htmlFor="deleteUser" className="text-xs font-bold text-rose-800 cursor-pointer select-none">
                                    Sakini ({users.find(u => u.id === editingApt.apt.residentId)?.name}) sistemden tamamen silinsin mi?
                                </label>
                             </div>
                        )}

                        <div className="mb-4">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                                <span className="text-xs font-bold text-gray-700 uppercase">Özel Mülk / Farklı Tarife</span>
                            </label>
                        </div>

                        {isSpecial && (
                            <div className="space-y-1 mb-4 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-black text-indigo-400 uppercase ml-1">Özel Aidat Tutarı (₺)</label>
                                <input type="number" value={customDuesAmount} onChange={e => setCustomDuesAmount(e.target.value)} className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" placeholder="Varsayılan: Genel Tutar" />
                            </div>
                        )}

                        <div className="space-y-1 mb-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Açıklama</label>
                            <textarea rows={2} value={aptDescription} onChange={e => setAptDescription(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" placeholder="Daire hakkında notlar..." />
                        </div>

                        <div className="flex gap-3">
                            {editingApt?.apt.id && (
                                <button onClick={handleDeleteApt} className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 whitespace-nowrap">
                                    Daireyi Sil
                                </button>
                            )}
                            <button onClick={() => setAptModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">İptal</button>
                            <button onClick={handleSaveApt} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">Kaydet</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockManagement;
