
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

const UserModal: React.FC<{
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
    const [role, setRole] = useState<UserRole>('Kiracı');
    const [isActive, setIsActive] = useState(true);
    
    // Location Info
    const [selectedBlockId, setSelectedBlockId] = useState<string>('');
    const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');

    // Profile Info (Extended)
    const [vehiclePlate1, setVehiclePlate1] = useState('');
    const [vehiclePlate2, setVehiclePlate2] = useState('');
    const [contactNumber1, setContactNumber1] = useState('');
    const [contactNumber2, setContactNumber2] = useState('');

    const availableApartments = useMemo(() => {
        if (!selectedBlockId) return [];
        const block = blocks.find(b => b.id === parseInt(selectedBlockId, 10));
        if (!block) return [];
        return block.apartments.filter(apt => apt.status === 'Boş' || apt.residentId === userToEdit?.id);
    }, [selectedBlockId, blocks, userToEdit]);

    useEffect(() => {
        if (userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email);
            setPassword(userToEdit.password || '');
            setRole(userToEdit.role);
            setIsActive(userToEdit.isActive);
            setVehiclePlate1(userToEdit.vehiclePlate1 || '');
            setVehiclePlate2(userToEdit.vehiclePlate2 || '');
            setContactNumber1(userToEdit.contactNumber1 || '');
            setContactNumber2(userToEdit.contactNumber2 || '');

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
            setIsActive(true);
            setSelectedBlockId('');
            setSelectedApartmentId('');
            setVehiclePlate1('');
            setVehiclePlate2('');
            setContactNumber1('');
            setContactNumber2('');
        }
    }, [userToEdit, blocks, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData = { 
            name, 
            email, 
            role, 
            isActive,
            // ŞİFRE: Eğer input boşsa ve yeni kullanıcıysa telefon, aksi halde girilen şifre
            password: password.trim() || (userToEdit ? userToEdit.password : (contactNumber1 ? contactNumber1.trim() : '123456')),
            vehiclePlate1,
            vehiclePlate2,
            contactNumber1,
            contactNumber2
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center overflow-y-auto">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl my-8">
                <h2 className="text-xl font-bold mb-6 border-b pb-2">{userToEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!userToEdit && (
                        <p className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded italic">
                            * Yeni eklenen kullanıcıların giriş şifresi otomatik olarak "1. Telefon" numarası olarak atanacaktır.
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">İsim Soyisim</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">E-posta (Giriş Adı)</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giriş Şifresi</label>
                            <input 
                                type="text" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="mt-1 block w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-indigo-900" 
                                placeholder={userToEdit ? "Mevcut şifre" : "Otomatik atanacak"}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rol</label>
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="Yönetici">Yönetici</option>
                                <option value="Daire Sahibi">Daire Sahibi</option>
                                <option value="Kiracı">Kiracı</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-start-2">
                            <label className="block text-sm font-medium text-gray-700">Durum</label>
                            <select value={String(isActive)} onChange={handleStatusChange} className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${!isActive ? 'bg-red-50 text-red-700 border-red-300' : 'bg-white'}`}>
                                <option value="true">Aktif</option>
                                <option value="false">Pasif (Daire Boşaltılır)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Blok</label>
                            <select value={selectedBlockId} onChange={handleBlockChange} disabled={!isActive} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="">Blok Seçiniz</option>
                                {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Daire</label>
                            <select value={selectedApartmentId} onChange={e => setSelectedApartmentId(e.target.value)} disabled={!selectedBlockId || !isActive} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed">
                                <option value="">Daire Seçiniz</option>
                                {availableApartments.map(apt => <option key={apt.id} value={apt.id}>Daire No: {apt.number}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">İletişim Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">1. Telefon</label>
                                <input type="tel" value={contactNumber1} onChange={e => setContactNumber1(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="Örn: 555-123-4567" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">2. Telefon</label>
                                <input type="tel" value={contactNumber2} onChange={e => setContactNumber2(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="Varsa giriniz" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Araç Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">1. Araç Plakası</label>
                                <input type="text" value={vehiclePlate1} onChange={e => setVehiclePlate1(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="Örn: 34 ABC 123" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">2. Araç Plakası</label>
                                <input type="text" value={vehiclePlate2} onChange={e => setVehiclePlate2(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" placeholder="Varsa giriniz" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">İptal</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Users: React.FC<UsersProps> = ({ users, blocks, onAddUserAndAssignment, onUpdateUserAndAssignment, onDeleteUser, onToggleUserStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'passive'>('active');
    const [searchName, setSearchName] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' | 'descending' } | null>(null);

    const roleClasses: Record<UserRole, string> = {
        'Yönetici': 'bg-indigo-100 text-indigo-800',
        'Daire Sahibi': 'bg-blue-100 text-blue-800',
        'Kiracı': 'bg-green-100 text-green-800'
    };
    
    const getUserLocation = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) return { blockName: block.name, aptNumber: apt.number };
        }
        return { blockName: '-', aptNumber: '-' };
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
            <button onClick={() => handleOpenModal()} className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors" title="Yeni Kullanıcı Ekle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
            </button>
            <div className="flex flex-wrap gap-2 ml-4">
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')} className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="all">Tüm Roller</option>
                    <option value="Yönetici">Yönetici</option>
                    <option value="Daire Sahibi">Daire Sahibi</option>
                    <option value="Kiracı">Kiracı</option>
                </select>
                <select value={filterBlockId} onChange={(e) => setFilterBlockId(e.target.value)} className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="all">Tüm Bloklar</option>
                    {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'passive')} className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="passive">Pasif</option>
                </select>
            </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-3 px-4 uppercase text-sm text-gray-600 align-top">
                <div className="flex flex-col gap-2">
                    <button onClick={() => requestSort('name')} className="flex items-center space-x-1 font-semibold hover:text-gray-900">
                        <span>İsim</span>
                        {sortConfig?.key === 'name' && <span className="text-xs">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>}
                    </button>
                    <div className="relative">
                        <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Ara..." className="pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-md w-full font-normal focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 absolute left-2 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
              </th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 align-top pt-5">Blok</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 align-top pt-5">Daire</th>
              <th className="text-left py-3 px-4 uppercase text-sm text-gray-600 align-top pt-5">
                <button onClick={() => requestSort('email')} className="flex items-center space-x-1 font-semibold hover:text-gray-900">
                    <span>Email</span>
                    {sortConfig?.key === 'email' && <span className="text-xs">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>}
                </button>
              </th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 align-top pt-5">Rol</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 align-top pt-5">Durum</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 align-top pt-5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredAndSortedUsers.map(user => {
                const { blockName, aptNumber } = getUserLocation(user.id);
                return (
                <tr key={user.id} className={`border-b border-gray-200 hover:bg-gray-50 ${!user.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="py-3 px-4 whitespace-nowrap">{user.name}</td>
                    <td className="py-3 px-4 font-medium">{blockName}</td>
                    <td className="py-3 px-4 font-medium">{aptNumber}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${roleClasses[user.role]}`}>{user.role}</span>
                    </td>
                    <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Aktif' : 'Pasif'}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right space-x-3">
                        <button type="button" onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">Düzenle</button>
                        <button type="button" onClick={() => handleDelete(user.id, user.name)} className="text-red-600 hover:text-red-900 font-medium text-sm">Sil</button>
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
