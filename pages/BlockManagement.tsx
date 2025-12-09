
import React, { useState, useMemo } from 'react';
import { Block, Apartment, User } from '../types';

// Props Interface
interface BlockManagementProps {
    blocks: Block[];
    users: User[];
    onAddBlock: (name: string) => void;
    onUpdateBlock: (id: number, name: string) => void;
    onDeleteBlock: (id: number) => void;
    onAddApartment: (blockId: number, number: string, residentId?: number) => void;
    onUpdateApartment: (blockId: number, apartment: Apartment) => void;
    onDeleteApartment: (blockId: number, apartmentId: number) => void;
    onVacateApartment: (blockId: number, apartmentId: number) => void;
}

// Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Main Component
const BlockManagement: React.FC<BlockManagementProps> = (props) => {
    const { blocks, users, onAddBlock, onUpdateBlock, onDeleteBlock, onAddApartment, onUpdateApartment, onDeleteApartment, onVacateApartment } = props;

    const [isBlockModalOpen, setBlockModalOpen] = useState(false);
    const [isAptModalOpen, setAptModalOpen] = useState(false);
    
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [editingApt, setEditingApt] = useState<{blockId: number, apt: Partial<Apartment>} | null>(null);

    const [blockName, setBlockName] = useState('');
    const [aptNumber, setAptNumber] = useState('');
    const [aptResidentId, setAptResidentId] = useState<string>('');
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Dolu' | 'Boş'>('all');
    
    const unassignedUsers = useMemo(() => {
        const assignedUserIds = new Set(blocks.flatMap(b => b.apartments.map(a => a.residentId)).filter(id => id !== undefined));
        return users.filter(u => u.role !== 'Yönetici' && !assignedUserIds.has(u.id));
    }, [users, blocks]);

    const filteredBlocks = useMemo(() => {
        let result = blocks;

        // Filter by Block
        if (filterBlockId !== 'all') {
            result = result.filter(b => b.id.toString() === filterBlockId);
        }

        // Filter by Apartment Status
        if (filterStatus !== 'all') {
            result = result.map(b => ({
                ...b,
                apartments: b.apartments.filter(a => a.status === filterStatus)
            }));
        }

        return result;
    }, [blocks, filterBlockId, filterStatus]);

    // Block Modal Handlers
    const handleOpenBlockModal = (block: Block | null = null) => {
        setEditingBlock(block);
        setBlockName(block?.name || '');
        setBlockModalOpen(true);
    };
    const handleSaveBlock = () => {
        if (!blockName.trim()) return;
        if (editingBlock) {
            onUpdateBlock(editingBlock.id, blockName);
        } else {
            onAddBlock(blockName);
        }
        setBlockModalOpen(false);
    };

    // Apartment Modal Handlers
    const handleOpenAptModal = (blockId: number, apt: Apartment | null = null) => {
        setEditingApt(apt ? { blockId, apt } : { blockId, apt: {} });
        setAptNumber(apt?.number || '');
        // Ensure that if apt.residentId is undefined, it defaults to empty string, selecting "Boş"
        setAptResidentId(apt?.residentId?.toString() || '');
        setAptModalOpen(true);
    };
    const handleSaveApt = () => {
        if (!editingApt || !aptNumber.trim()) return;
        
        const residentId = aptResidentId ? Number(aptResidentId) : undefined;
        const newStatus = residentId !== undefined ? 'Dolu' : 'Boş';

        if(editingApt.apt.id) { // Editing
            onUpdateApartment(editingApt.blockId, { ...editingApt.apt as Apartment, number: aptNumber, status: newStatus, residentId: residentId });
        } else { // Adding
            onAddApartment(editingApt.blockId, aptNumber, residentId);
        }
        setAptModalOpen(false);
    };
    
    return (
        <>
            {/* Modals */}
            <Modal isOpen={isBlockModalOpen} onClose={() => setBlockModalOpen(false)} title={editingBlock ? "Blok Düzenle" : "Yeni Blok Ekle"}>
                <input type="text" value={blockName} onChange={e => setBlockName(e.target.value)} className="w-full p-2 border rounded" placeholder="Blok Adı (örn: A Blok)" />
                <div className="flex justify-end mt-4">
                    <button onClick={handleSaveBlock} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Kaydet</button>
                </div>
            </Modal>
            
             <Modal isOpen={isAptModalOpen} onClose={() => setAptModalOpen(false)} title={editingApt?.apt?.id ? "Daire Düzenle" : "Yeni Daire Ekle"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Daire Numarası</label>
                        <input type="text" value={aptNumber} onChange={e => setAptNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required placeholder="Daire No" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Sakin Ata (İsteğe Bağlı)</label>
                        <select
                            value={aptResidentId}
                            onChange={e => setAptResidentId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Boş</option>
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
                        <div className="flex items-center mt-2">
                            <input 
                                id="vacate-apt-check"
                                type="checkbox" 
                                checked={!aptResidentId} 
                                onChange={(e) => {
                                    if (e.target.checked) setAptResidentId('');
                                }}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="vacate-apt-check" className="ml-2 text-sm text-gray-600 cursor-pointer">Daireyi Boşalt</label>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSaveApt} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Kaydet</button>
                </div>
            </Modal>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">Blok & Daire Yönetimi</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <select
                            value={filterBlockId}
                            onChange={(e) => setFilterBlockId(e.target.value)}
                            className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                        >
                            <option value="all">Tüm Bloklar</option>
                            {blocks.map(block => (
                                <option key={block.id} value={block.id}>{block.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Dolu' | 'Boş')}
                            className="block w-full sm:w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border"
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="Dolu">Dolu</option>
                            <option value="Boş">Boş</option>
                        </select>
                        <button onClick={() => handleOpenBlockModal()} className="w-full sm:w-auto px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center justify-center whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Yeni Blok Ekle
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {filteredBlocks.map(block => {
                    // Sort apartments numerically
                    const sortedApartments = [...block.apartments].sort((a, b) => {
                        const numA = parseInt(a.number, 10);
                        const numB = parseInt(b.number, 10);
                        if(!isNaN(numA) && !isNaN(numB)) return numA - numB;
                        return a.number.localeCompare(b.number, undefined, { numeric: true });
                    });

                    return (
                    <div key={block.id} className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{block.name}</h3>
                            <div>
                                <button onClick={() => handleOpenBlockModal(block)} className="text-sm text-indigo-600 hover:text-indigo-900 mr-4">Blok Düzenle</button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        if(window.confirm(`${block.name} ve içindeki tüm daireler silinecektir. Emin misiniz?`)) onDeleteBlock(block.id) 
                                    }} 
                                    className="text-sm text-red-600 hover:text-red-900"
                                >
                                    Blok Sil
                                </button>
                            </div>
                        </div>
                        
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-md font-medium text-gray-700">Daireler</h4>
                                <button onClick={() => handleOpenAptModal(block.id)} className="text-sm px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600">Daire Ekle</button>
                            </div>
                            {sortedApartments.length > 0 ? (
                                <ul className="space-y-2">
                                    {sortedApartments.map(apt => {
                                        const resident = users.find(u => u.id === apt.residentId);
                                        return (
                                            <li key={apt.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                                <div>
                                                    <span className="font-semibold">Daire No: {apt.number}</span>
                                                    <span className={`ml-4 text-xs font-medium px-2 py-1 rounded-full ${apt.status === 'Dolu' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>{apt.status}</span>
                                                    {resident && <span className="ml-2 text-sm text-gray-600">({resident.name})</span>}
                                                </div>
                                                <div>
                                                    <button onClick={() => handleOpenAptModal(block.id, apt)} className="text-sm text-indigo-600 hover:text-indigo-900 mr-4">Düzenle</button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : <p className="text-sm text-gray-500 mt-2">Kriterlere uygun daire bulunmuyor.</p>}
                        </div>
                    </div>
                )})}
                {filteredBlocks.length === 0 && (
                     <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                        Kriterlere uygun blok bulunamadı.
                    </div>
                )}
            </div>
        </>
    );
};

export default BlockManagement;
