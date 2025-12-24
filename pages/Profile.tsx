
import React, { useState, useEffect } from 'react';
import { User, Block, UserRole } from '../types';

interface ProfilePageProps {
    currentUser: User;
    onUpdateUser: (user: User) => void;
    blocks: Block[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateUser, blocks }) => {
    // Form States
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [role, setRole] = useState<UserRole>(currentUser.role);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [vehiclePlate1, setVehiclePlate1] = useState(currentUser.vehiclePlate1 || '');
    const [vehiclePlate2, setVehiclePlate2] = useState(currentUser.vehiclePlate2 || '');
    const [contactNumber1, setContactNumber1] = useState(currentUser.contactNumber1 || '');
    const [contactNumber2, setContactNumber2] = useState(currentUser.contactNumber2 || '');

    const [apartmentInfo, setApartmentInfo] = useState<string>('Atanmamış');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // KRİTİK: currentUser prop'u her güncellendiğinde (DB'den yeni veri geldiğinde) 
    // yerel input state'lerini güncelle. Bu sayede "eski verinin geri gelmesi" sorunu çözülür.
    useEffect(() => {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setRole(currentUser.role);
        setVehiclePlate1(currentUser.vehiclePlate1 || '');
        setVehiclePlate2(currentUser.vehiclePlate2 || '');
        setContactNumber1(currentUser.contactNumber1 || '');
        setContactNumber2(currentUser.contactNumber2 || '');
    }, [currentUser]);

    useEffect(() => {
        let found = false;
        for (const block of blocks) {
            for (const apt of block.apartments) {
                if (apt.residentId === currentUser.id) {
                    setApartmentInfo(`${block.name} - Daire No: ${apt.number}`);
                    found = true;
                    break;
                }
            }
            if(found) break;
        }
    }, [currentUser, blocks]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (password && password !== confirmPassword) {
            setErrorMessage('Şifreler uyuşmuyor.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const updatedUser: User = {
            ...currentUser,
            name: name.trim(),
            email: email.trim(),
            role,
            password: password || currentUser.password,
            vehiclePlate1: vehiclePlate1.trim(),
            vehiclePlate2: vehiclePlate2.trim(),
            contactNumber1: contactNumber1.trim(),
            contactNumber2: contactNumber2.trim(),
        };

        onUpdateUser(updatedUser);
        setSuccessMessage('Profil bilgileriniz başarıyla güncellendi!');
        setPassword('');
        setConfirmPassword('');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Profil Bilgilerini Düzenle</h2>

            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                    <p>{successMessage}</p>
                </div>
            )}
            
            {errorMessage && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p>{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 text-sm font-medium text-gray-600">Daire Bilgisi</legend>
                    <div className="space-y-4">
                        <div>
                             <label htmlFor="apartmentInfo" className="block text-sm font-medium text-gray-700">Blok ve Daire Numaranız</label>
                            <input type="text" id="apartmentInfo" value={apartmentInfo} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed" />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Durum (Rol)</label>
                            <select 
                                id="role" 
                                value={role} 
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="Daire Sahibi">Daire Sahibi</option>
                                <option value="Kiracı">Kiracı</option>
                                {currentUser.role === 'Yönetici' && <option value="Yönetici">Yönetici</option>}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 text-sm font-medium text-gray-600">Temel Bilgiler</legend>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">İsim Soyisim</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta Adresi (Giriş Adı)</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 text-sm font-medium text-gray-600">Araç ve İletişim Bilgileri</legend>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="vehiclePlate1" className="block text-sm font-medium text-gray-700">1. Araç Plakası</label>
                            <input type="text" id="vehiclePlate1" value={vehiclePlate1} onChange={e => setVehiclePlate1(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                         <div>
                            <label htmlFor="vehiclePlate2" className="block text-sm font-medium text-gray-700">2. Araç Plakası</label>
                            <input type="text" id="vehiclePlate2" value={vehiclePlate2} onChange={e => setVehiclePlate2(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="contactNumber1" className="block text-sm font-medium text-gray-700">1. İrtibat Numarası</label>
                            <input type="tel" id="contactNumber1" value={contactNumber1} onChange={e => setContactNumber1(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="contactNumber2" className="block text-sm font-medium text-gray-700">2. İrtibat Numarası</label>
                            <input type="tel" id="contactNumber2" value={contactNumber2} onChange={e => setContactNumber2(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                     </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="px-2 text-sm font-medium text-gray-600">Şifre Değiştirme</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Yeni Şifre</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Yeni Şifre (Tekrar)</label>
                            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                </fieldset>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold shadow-md">
                        Bilgilerimi Güncelle
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
