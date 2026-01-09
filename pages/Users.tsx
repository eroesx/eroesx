
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Block } from '../types';

interface UsersProps {
    users: User[];
    blocks: Block[];
    onAddUserAndAssignment: (user: Omit<User, 'id' | 'lastLogin' | 'isActive'>, assignment: { blockId: number | null, apartmentId: number | null }) => void;
    onUpdateUserAndAssignment: (user: User, assignment: { blockId: number | null, apartmentId: number | null }) => void;
    onDeleteUser: (userId: number) => void;
    onToggleUserStatus: (userId: number, isActive: boolean) => void;
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

export const UserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id' | 'lastLogin' | 'isActive'> | User, assignment: { blockId: number | null, apartmentId: number | null }) => void;
    userToEdit?: User | null;
    blocks: Block[];
}> = ({ isOpen, onClose, onSave, userToEdit, blocks }) => {
    // Basic Info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Daire Sahibi' | 'Kiracı'>('Kiracı');
    const [specialRole, setSpecialRole] = useState<'None' | 'Yönetici' | 'Denetçi'>('None');
    const [isActive, setIsActive] = useState(true);
    const [isDuesExempt, setIsDuesExempt] = useState(false);
    const [kvkkApproved, setKvkkApproved] = useState(false);
    
    // Location Info
    const [selectedBlockId, setSelectedBlockId] = useState<string>('');
    const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');

    // Profile Info (Extended)
    const [vehiclePlate1, setVehiclePlate1] = useState('');
    const [vehiclePlate2, setVehiclePlate2] = useState('');
    const [contactNumber1, setContactNumber1] = useState('');
    const [contactNumber2, setContactNumber2] = useState('');

    // Aliases
    const [paymentAliases, setPaymentAliases] = useState<string[]>([]);
    const [newAlias, setNewAlias] = useState('');

    const availableApartments = useMemo(() => {
        if (!selectedBlockId) return [];
        const block = blocks.find(b => b.id === parseInt(selectedBlockId, 10));
        if (!block) return [];
        return block.apartments.filter(apt => apt.status === 'Boş' || !apt.residentId || apt.residentId === userToEdit?.id);
    }, [selectedBlockId, blocks, userToEdit]);

    useEffect(() => {
        if (userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email);
            setPassword(userToEdit.password || '');
            
            // Determine roles
            if (userToEdit.role === 'Yönetici') {
                setSpecialRole('Yönetici');
                setRole('Daire Sahibi'); // Default fallback
            } else if (userToEdit.role === 'Denetçi') {
                setSpecialRole('Denetçi');
                setRole('Daire Sahibi'); // Default fallback
            } else {
                setSpecialRole('None');
                setRole(userToEdit.role as 'Daire Sahibi' | 'Kiracı');
            }
            
            setIsActive(userToEdit.isActive);
            setIsDuesExempt(userToEdit.isDuesExempt || false);
            setKvkkApproved(userToEdit.kvkkApproved || false);
            setVehiclePlate1(userToEdit.vehiclePlate1 || '');
            setVehiclePlate2(userToEdit.vehiclePlate2 || '');
            setContactNumber1(userToEdit.contactNumber1 || '');
            setContactNumber2(userToEdit.contactNumber2 || '');
            setPaymentAliases(userToEdit.paymentAliases || []);

            let found = false;
            for (const block of blocks) {
                for (const apt of block.apartments) {
                    if (apt.residentId === userToEdit.id) {
                        setSelectedBlockId(String(block.id));
                        setSelectedApartmentId(String(apt.id));
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) {
                setSelectedBlockId('');
                setSelectedApartmentId('');
            }
        } else {
            setName('');
            setEmail('');
            setPassword('');
            setRole('Kiracı');
            setSpecialRole('None');
            setIsActive(true);
            setIsDuesExempt(false);
            setKvkkApproved(false);
            setSelectedBlockId('');
            setSelectedApartmentId('');
            setVehiclePlate1('');
            setVehiclePlate2('');
            setContactNumber1('');
            setContactNumber2('');
            setPaymentAliases([]);
        }
    }, [userToEdit, blocks, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalRole: UserRole = role;
        if (specialRole === 'Yönetici') finalRole = 'Yönetici';
        if (specialRole === 'Denetçi') finalRole = 'Denetçi';

        const userData = { 
            name, 
            email, 
            role: finalRole, 
            isActive,
            isDuesExempt,
            kvkkApproved,
            password: password.trim() || (userToEdit ? userToEdit.password : (contactNumber1 ? contactNumber1.trim() : '123456')),
            vehiclePlate1,
            vehiclePlate2,
            contactNumber1,
            contactNumber2,
            paymentAliases
        };
        const assignment = { 
            blockId: selectedBlockId ? parseInt(selectedBlockId, 10) : null,
            apartmentId: selectedApartmentId ? parseInt(selectedApartmentId, 10) : null
        };
        
        if (userToEdit) {
            onSave({ ...userToEdit, ...userData }, assignment);
        } else {
            onSave(userData, assignment);
        }
        onClose();
    };
    
    const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBlockId(e.target.value);
        setSelectedApartmentId('');
    }

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value === 'true';
        setIsActive(newStatus);
        if (!newStatus) {
            setSelectedBlockId('');
            setSelectedApartmentId('');
        }
    };

    const handleAddAlias = () => {
        if (newAlias.trim()) {
            if (!paymentAliases.includes(newAlias.trim())) {
                setPaymentAliases([...paymentAliases, newAlias.trim()]);
            }
            setNewAlias('');
        }
    };

    const handleRemoveAlias = (alias: string) => {
        setPaymentAliases(paymentAliases.filter(a => a !== alias));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center overflow-y-auto">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl my-8 animate-in zoom-in-95 duration-200 border border-gray-100">
                <h2 className="text-xl font-black mb-6 border-b pb-4 text-gray-800 uppercase tracking-tight">{userToEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {!userToEdit && (
                        <p className="text-[10px] text-indigo-600 bg-indigo-50 p-3 rounded-xl italic font-bold uppercase tracking-tight">
                            * Yeni kullanıcıların şifresi otomatik olarak "1. Telefon" numarası atanır.
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">İsim Soyisim</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-posta (Giriş Adı)</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Giriş Şifresi</label>
                            <input 
                                type="text" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-indigo-900 text-sm" 
                                placeholder={userToEdit ? "Mevcut şifre" : "Otomatik atanacak"}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sakinlik Durumu</label>
                                <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm">
                                    <option value="Daire Sahibi">Daire Sahibi</option>
                                    <option value="Kiracı">Kiracı</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 ml-1">Yetki Seviyesi</label>
                                <select value={specialRole} onChange={e => setSpecialRole(e.target.value as any)} className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-800 text-sm">
                                    <option value="None">Standart</option>
                                    <option value="Yönetici">Yönetici</option>
                                    <option value="Denetçi">Denetçi</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex flex-wrap items-center gap-6">
                            
                            <label className="flex items-center cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={isDuesExempt} 
                                    onChange={e => setIsDuesExempt(e.target.checked)}
                                    className="h-5 w-5 text-rose-600 border-gray-300 rounded-lg focus:ring-rose-500"
                                />
                                <span className="ml-3 text-[11px] font-black text-gray-700 uppercase tracking-tight group-hover:text-rose-600 transition-colors">Aidat Muaf</span>
                            </label>

                            <label className="flex items-center cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={kvkkApproved} 
                                    onChange={e => setKvkkApproved(e.target.checked)}
                                    className="h-5 w-5 text-emerald-600 border-gray-300 rounded-lg focus:ring-emerald-500"
                                />
                                <span className="ml-3 text-[11px] font-black text-gray-700 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">KVKK Onayı</span>
                            </label>

                            <div className="flex-1 min-w-[150px]">
                                <select value={String(isActive)} onChange={handleStatusChange} className={`w-full px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100 ${!isActive ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-green-700 border-green-200'}`}>
                                    <option value="true">Hesap: Aktif</option>
                                    <option value="false">Hesap: Pasif</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                        <div>
                            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1">Konum: Blok</label>
                            <select value={selectedBlockId} onChange={handleBlockChange} disabled={!isActive} className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm disabled:opacity-50">
                                <option value="">Blok Seçiniz</option>
                                {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1">Konum: Daire</label>
                            <select value={selectedApartmentId} onChange={e => setSelectedApartmentId(e.target.value)} disabled={!selectedBlockId || !isActive} className="w-full px-4 py-2.5 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm disabled:opacity-50">
                                <option value="">Daire Seçiniz</option>
                                {availableApartments.map(apt => <option key={apt.id} value={apt.id}>Daire: {apt.number}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">İletişim</h3>
                            <input type="tel" value={contactNumber1} onChange={e => setContactNumber1(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold" placeholder="1. Telefon" />
                            <input type="tel" value={contactNumber2} onChange={e => setContactNumber2(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold" placeholder="2. Telefon" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Araçlar</h3>
                            <input type="text" value={vehiclePlate1} onChange={e => setVehiclePlate1(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase" placeholder="1. Plaka" />
                            <input type="text" value={vehiclePlate2} onChange={e => setVehiclePlate2(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold uppercase" placeholder="2. Plaka" />
                        </div>
                    </div>

                    {/* Alias Management Section */}
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
                        <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1">Hesap Tanımı / Takma İsimler</h3>
                        <p className="text-[9px] text-amber-600 font-bold">
                            Banka açıklamalarında bu isimler geçerse aidat otomatik olarak bu kişiyle eşleşir. (Örn: Eşinin adı, Şirket unvanı)
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newAlias} 
                                onChange={e => setNewAlias(e.target.value)} 
                                className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold outline-none" 
                                placeholder="Yeni isim ekle..." 
                            />
                            <button 
                                type="button" 
                                onClick={handleAddAlias}
                                disabled={!newAlias.trim()}
                                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-amber-700 disabled:opacity-50"
                            >
                                Ekle
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {paymentAliases.map((alias, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-[10px] font-black uppercase rounded-lg flex items-center gap-2">
                                    {alias}
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveAlias(alias)}
                                        className="text-rose-500 hover:text-rose-700"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </span>
                            ))}
                            {paymentAliases.length === 0 && <span className="text-[10px] text-amber-400 italic">Tanımlı isim yok.</span>}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Vazgeç</button>
                        <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">Değişiklikleri Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Users: React.FC<UsersProps> = ({ users, blocks, onAddUserAndAssignment, onUpdateUserAndAssignment, onDeleteUser, onToggleUserStatus }) => {
    // ... [No changes to the main Users component logic, keeping it as is]
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive' | 'exempt' | 'unsafe' | 'kvkk' | 'unassigned'>('active');
    const [searchName, setSearchName] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' | 'descending' } | null>(null);

    const getUserLocation = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) return { 
                blockName: block.name, 
                aptNumber: apt.number,
                floor: apt.floor || calculateFloorFallback(block.name, apt.number)
            };
        }
        return { blockName: '-', aptNumber: '-', floor: '-' };
    };

    const filteredAndSortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        
        if (filterRole !== 'all') sortableUsers = sortableUsers.filter(user => user.role === filterRole);
        
        if (filterBlockId !== 'all') {
            const targetBlock = blocks.find(b => b.id.toString() === filterBlockId);
            if (targetBlock) {
                const residentIds = new Set(targetBlock.apartments.map(a => a.residentId).filter(id => id !== undefined));
                sortableUsers = sortableUsers.filter(u => residentIds.has(u.id));
            } else sortableUsers = [];
        }
        
        if (filterStatus === 'active') sortableUsers = sortableUsers.filter(user => user.isActive);
        else if (filterStatus === 'passive') sortableUsers = sortableUsers.filter(user => !user.isActive);
        else if (filterStatus === 'unassigned') sortableUsers = sortableUsers.filter(user => getUserLocation(user.id).blockName === '-');
        else if (filterStatus === 'exempt') sortableUsers = sortableUsers.filter(user => user.isDuesExempt);
        else if (filterStatus === 'unsafe') sortableUsers = sortableUsers.filter(user => user.password === '123' || user.needsPasswordChange === true);
        else if (filterStatus === 'kvkk') sortableUsers = sortableUsers.filter(user => user.kvkkApproved);
        
        if (searchName) {
            const lowerSearch = searchName.toLocaleLowerCase('tr-TR');
            sortableUsers = sortableUsers.filter(user => user.name.toLocaleLowerCase('tr-TR').includes(lowerSearch));
        }
        
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        } else {
            sortableUsers.sort((a, b) => {
                const locA = getUserLocation(a.id);
                const locB = getUserLocation(b.id);
                if (locA.blockName === '-' && locB.blockName !== '-') return 1;
                if (locA.blockName !== '-' && locB.blockName === '-') return -1;
                if (locA.blockName === '-' && locB.blockName === '-') return 0;
                const blockCompare = locA.blockName.localeCompare(locB.blockName, undefined, { numeric: true, sensitivity: 'base' });
                if (blockCompare !== 0) return blockCompare;
                const aptA = parseInt(locA.aptNumber, 10);
                const aptB = parseInt(locB.aptNumber, 10);
                if (!isNaN(aptA) && !isNaN(aptB)) return aptA - aptB;
                return locA.aptNumber.localeCompare(locB.aptNumber, undefined, { numeric: true });
            });
        }
        return sortableUsers;
    }, [users, filterRole, filterBlockId, filterStatus, searchName, sortConfig, blocks]);

    const requestSort = (key: keyof User) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const handleOpenModal = (user: User | null = null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const handleSaveUser = (user: Omit<User, 'id' | 'lastLogin' | 'isActive'> | User, assignment: { blockId: number | null, apartmentId: number | null }) => {
        if ('id' in user) onUpdateUserAndAssignment(user, assignment);
        else onAddUserAndAssignment(user, assignment);
    };

    const handleDelete = (id: number, name: string) => {
      if (id === 1) { alert("Yönetici hesabı silinemez."); return; }
      if (window.confirm(`${name} isimli kullanıcıyı silmek istediğinizden emin misiniz?`)) onDeleteUser(id);
    };

  return (
    <>
    <UserModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUser} userToEdit={userToEdit} blocks={blocks} />
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      {/* ... [Rest of the existing table UI] ... */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Kullanıcı Yönetimi</h2>
            <button onClick={() => handleOpenModal()} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-90" title="Yeni Kullanıcı Ekle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
            </button>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-end">
            <div className="flex-1 lg:flex-none min-w-[200px]">
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">İsim Ara</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={searchName} 
                        onChange={(e) => setSearchName(e.target.value)} 
                        placeholder="İsim ile ara..." 
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>
            <div className="flex-1 lg:flex-none">
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Rol Filtresi</label>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')} className="w-full lg:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="all">Tüm Roller</option>
                    <option value="Yönetici">Yönetici</option>
                    <option value="Denetçi">Denetçi</option>
                    <option value="Daire Sahibi">Daire Sahibi</option>
                    <option value="Kiracı">Kiracı</option>
                </select>
            </div>
            <div className="flex-1 lg:flex-none">
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Blok Filtresi</label>
                <select value={filterBlockId} onChange={(e) => setFilterBlockId(e.target.value)} className="w-full lg:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="all">Tüm Bloklar</option>
                    {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                </select>
            </div>
            <div className="flex-1 lg:flex-none">
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Durum / Filtre</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-full lg:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-100">
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif Sakinler</option>
                    <option value="passive">Pasif (Boş)</option>
                    <option value="unassigned">Konumu Boş</option>
                    <option value="exempt">Aidat Muaf</option>
                    <option value="unsafe">Şifresi Riskli</option>
                    <option value="kvkk">KVKK Onaylılar</option>
                </select>
            </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('name')}>
                <div className="flex items-center space-x-1">
                    <span>İsim</span>
                    {sortConfig?.key === 'name' && <span className="text-[8px]">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>}
                </div>
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-6">Konum</th>
              <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-6">Email / İletişim</th>
              <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-6">Yetki / Rol</th>
              <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-6">Durum</th>
              <th className="text-right py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-6">İşlemler</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 divide-y divide-gray-50">
            {filteredAndSortedUsers.map(user => {
                const { blockName, aptNumber, floor } = getUserLocation(user.id);
                const isRisk = user.password === '123' || user.needsPasswordChange === true;
                return (
                <tr key={user.id} className={`hover:bg-indigo-50/10 transition-colors ${!user.isActive ? 'opacity-50 grayscale' : ''}`}>
                    <td className="py-4 px-6">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{user.name}</span>
                                {user.kvkkApproved && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded border border-emerald-100 shadow-sm" title="KVKK Onaylı">KVKK</span>}
                                {user.isDuesExempt && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded border border-rose-100 shadow-sm">MUAF</span>}
                                {isRisk && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded border border-amber-100 shadow-sm" title="Varsayılan Şifre Kullanılıyor">RİSKLİ</span>}
                            </div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{user.lastLogin}</span>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-indigo-600 uppercase">{blockName}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Kat: {floor} / Daire: {aptNumber}</span>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">{user.email}</span>
                            <span className="text-[10px] font-medium text-gray-400">{user.contactNumber1 || '-'}</span>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg border ${user.role === 'Yönetici' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-100' : user.role === 'Denetçi' ? 'bg-purple-600 text-white border-purple-700 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{user.role}</span>
                    </td>
                    <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg ${user.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{user.isActive ? 'Aktif' : 'Pasif'}</span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                        <button type="button" onClick={() => handleOpenModal(user)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Düzenle</button>
                        <button type="button" onClick={() => handleDelete(user.id, user.name)} className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">Sil</button>
                    </td>
                </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default Users;
