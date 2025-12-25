
import React, { useState, useMemo, useEffect } from 'react';
import { Block, Apartment, User } from '../types';

interface BlockManagementProps {
    blocks: Block[];
    users: User[];
    onDeleteUser: (id: number) => void;
    onAddBlock: (name: string) => void;
    onUpdateBlock: (id: number, name: string) => void;
    onDeleteBlock: (id: number) => void;
    onAddApartment: (blockId: number, number: string, residentId?: number) => void;
    onUpdateApartment: (blockId: number, apartment: Apartment) => void;
    onDeleteApartment: (blockId: number, apartmentId: number) => void;
    onVacateApartment: (blockId: number, apartmentId: number) => void;
    targetBlockId?: number | null;
    onClearTargetBlock?: () => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const BlockManagement: React.FC<BlockManagementProps> = (props) => {
    const { blocks, users, onDeleteUser, onAddBlock, onUpdateBlock, onDeleteBlock, onAddApartment, onUpdateApartment, targetBlockId, onClearTargetBlock } = props;

    const [isBlockModalOpen, setBlockModalOpen] = useState(false);
    const [isAptModalOpen, setAptModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [editingApt, setEditingApt] = useState<{blockId: number, apt: Partial<Apartment>} | null>(null);

    const [blockName, setBlockName] = useState('');
    const [aptNumber, setAptNumber] = useState('');
    const [aptResidentId, setAptResidentId] = useState<string>('');
    const [shouldDeleteResident, setShouldDeleteResident] = useState(false);
    
    // Search and Accordion states
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedBlocks, setExpandedBlocks] = useState<number[]>([]);

    // Handle targeting from external page
    useEffect(() => {
        if (targetBlockId) {
            setExpandedBlocks(prev => Array.from(new Set([...prev, targetBlockId])));
            // Scroll to targeted block
            setTimeout(() => {
                const element = document.getElementById(`block-${targetBlockId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
            onClearTargetBlock?.();
        }
    }, [targetBlockId, onClearTargetBlock]);

    const toggleBlock = (id: number) => {
        setExpandedBlocks(prev => 
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        );
    };

    const unassignedUsers = useMemo(() => {
        const assignedUserIds = new Set(blocks.flatMap(b => b.apartments.map(a => a.residentId)).filter(id => id !== undefined));
        return users.filter(u => u.role !== 'Yönetici' && !assignedUserIds.has(u.id));
    }, [users, blocks]);

    const filteredData = useMemo(() => {
        const term = searchTerm.toLocaleLowerCase('tr-TR').trim();
        if (!term) return blocks;

        return blocks.map(block => {
            const matchingApts = block.apartments.filter(apt => {
                const resident = users.find(u => u.id === apt.residentId);
                const nameMatch = resident?.name.toLocaleLowerCase('tr-TR').includes(term);
                const aptMatch = apt.number.toLocaleLowerCase('tr-TR').includes(term);
                const plateMatch = resident?.vehiclePlate1?.toLocaleLowerCase('tr-TR').includes(term) || resident?.vehiclePlate2?.toLocaleLowerCase('tr-TR').includes(term);
                return nameMatch || aptMatch || plateMatch;
            });

            return {
                ...block,
                apartments: matchingApts,
                isMatching: matchingApts.length > 0 || block.name.toLocaleLowerCase('tr-TR').includes(term)
            };
        }).filter(b => (b as any).isMatching);
    }, [blocks, searchTerm, users]);

    // Expand all matching blocks when searching
    useEffect(() => {
        if (searchTerm.trim().length > 0) {
            setExpandedBlocks(filteredData.map(b => b.id));
        }
    }, [searchTerm, filteredData]);

    const handleOpenBlockModal = (block: Block | null = null) => {
        setEditingBlock(block);
        setBlockName(block?.name || '');
        setBlockModalOpen(true);
    };

    const handleSaveBlock = () => {
        if (!blockName.trim()) return;
        if (editingBlock) onUpdateBlock(editingBlock.id, blockName);
        else onAddBlock(blockName);
        setBlockModalOpen(false);
    };

    const handleOpenAptModal = (blockId: number, apt: Apartment | null = null) => {
        setEditingApt(apt ? { blockId, apt } : { blockId, apt: {} });
        setAptNumber(apt?.number || '');
        setAptResidentId(apt?.residentId?.toString() || '');
        setShouldDeleteResident(false);
        setAptModalOpen(true);
    };

    const handleSaveApt = () => {
        if (!editingApt || !aptNumber.trim()) return;
        const residentId = aptResidentId ? Number(aptResidentId) : undefined;
        if (shouldDeleteResident && editingApt.apt.residentId) onDeleteUser(editingApt.apt.residentId);
        if(editingApt.apt.id) onUpdateApartment(editingApt.blockId, { ...editingApt.apt as Apartment, number: aptNumber, status: residentId !== undefined ? 'Dolu' : 'Boş', residentId });
        else onAddApartment(editingApt.blockId, aptNumber, residentId);
        setAptModalOpen(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header with Search */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-4">Blok & Daire Yönetimi</h2>
                    <div className="relative group">
                        <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            type="text" 
                            placeholder="İsim, Daire veya Plaka ile Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-sm"
                        />
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenBlockModal()}
                    className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    Yeni Blok Ekle
                </button>
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
                {filteredData.map((block) => {
                    const isExpanded = expandedBlocks.includes(block.id);
                    const occupiedCount = block.apartments.filter(a => a.status === 'Dolu').length;
                    const totalCount = block.apartments.length;

                    return (
                        <div key={block.id} id={`block-${block.id}`} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                            {/* Block Header */}
                            <div 
                                onClick={() => toggleBlock(block.id)}
                                className={`p-5 md:p-6 cursor-pointer flex items-center justify-between transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-gray-100 text-gray-500'}`}>
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{block.name}</h3>
                                        <div className="flex items-center mt-1 space-x-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{totalCount} Daire Toplam</span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${occupiedCount === totalCount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {occupiedCount} Dolu
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenBlockModal(block); }}
                                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Düzenle"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(window.confirm(`${block.name} silinecektir. Emin misiniz?`)) onDeleteBlock(block.id); }}
                                        className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                                        title="Sil"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                    <div className={`p-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Block Content (Accordion Body) */}
                            {isExpanded && (
                                <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {/* Add New Apartment Card */}
                                        <button 
                                            onClick={() => handleOpenAptModal(block.id)}
                                            className="h-36 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center group hover:border-indigo-300 hover:bg-white transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 mb-2 transition-colors">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-600">Daire Ekle</span>
                                        </button>

                                        {/* Existing Apartments */}
                                        {block.apartments.sort((a,b) => parseInt(a.number) - parseInt(b.number)).map(apt => {
                                            const resident = users.find(u => u.id === apt.residentId);
                                            return (
                                                <div 
                                                    key={apt.id} 
                                                    onClick={() => handleOpenAptModal(block.id, apt)}
                                                    className="h-36 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col"
                                                >
                                                    <div className="flex justify-between items-start mb-auto">
                                                        <span className="text-xl font-black text-gray-800 tracking-tight">No: {apt.number}</span>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${apt.status === 'Dolu' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                            {apt.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 min-w-0">
                                                        {resident ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight flex-1">{resident.name}</p>
                                                                    <span className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${resident.role === 'Daire Sahibi' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                        {resident.role === 'Daire Sahibi' ? 'Sahibi' : 'Kiracı'}
                                                                    </span>
                                                                </div>
                                                                {resident?.vehiclePlate1 && (
                                                                    <p className="text-[9px] text-indigo-500 font-bold">{resident.vehiclePlate1}</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs font-bold text-gray-400 italic">Boş Daire</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            <Modal isOpen={isBlockModalOpen} onClose={() => setBlockModalOpen(false)} title={editingBlock ? "Blok Düzenle" : "Yeni Blok Ekle"}>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Blok İsmi</label>
                    <input 
                        type="text" 
                        value={blockName} 
                        onChange={e => setBlockName(e.target.value)} 
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" 
                        placeholder="Örn: A Blok" 
                    />
                    <button onClick={handleSaveBlock} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
                        Bloğu Kaydet
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isAptModalOpen} onClose={() => setAptModalOpen(false)} title={editingApt?.apt?.id ? "Daire Bilgileri" : "Yeni Daire Ekle"}>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-2">Daire No</label>
                            <input 
                                type="text" 
                                value={aptNumber} 
                                onChange={e => setAptNumber(e.target.value)} 
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-sm" 
                                placeholder="1" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-2">Sakin Seç</label>
                            <select
                                value={aptResidentId}
                                onChange={e => { setAptResidentId(e.target.value); setShouldDeleteResident(false); }}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-xs"
                            >
                                <option value="">Daire Boş</option>
                                {editingApt?.apt?.residentId && 
                                    !unassignedUsers.some(u => u.id === editingApt.apt.residentId) && 
                                    (() => {
                                        const currentUser = users.find(u => u.id === editingApt.apt.residentId);
                                        return currentUser ? <option key={currentUser.id} value={currentUser.id}>{currentUser.name}</option> : null;
                                    })()
                                }
                                {unassignedUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 space-y-3">
                        <label className="flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={!aptResidentId} 
                                onChange={(e) => {
                                    if(e.target.checked && editingApt?.apt?.residentId) {
                                        if(window.confirm("Kullanıcıyı daireden çıkarıyorsunuz. Kullanıcı kaydı sistemden silinsin mi?")) {
                                            setShouldDeleteResident(true);
                                        }
                                    }
                                    if(e.target.checked) setAptResidentId('');
                                }}
                                className="h-5 w-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                            />
                            <span className="ml-3 text-[11px] font-black text-rose-700 uppercase tracking-tight">Daireyi Boşalt</span>
                        </label>
                        {shouldDeleteResident && <p className="text-[10px] text-rose-500 font-bold uppercase italic">* Sakin kaydı kalıcı olarak silinecektir.</p>}
                    </div>

                    <button onClick={handleSaveApt} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
                        Değişiklikleri Uygula
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default BlockManagement;
