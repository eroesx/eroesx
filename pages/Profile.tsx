
import React, { useState, useEffect } from 'react';
import { User, Block, UserRole, FeedbackType } from '../types';

interface ProfilePageProps {
    currentUser: User;
    onUpdateUser: (user: User) => void;
    blocks: Block[];
    onAddFeedback: (userId: number, type: FeedbackType, subject: string, content: string, fileData?: {url: string, name: string, type: string}) => void;
    isForced?: boolean; // If true, user cannot navigate away until saved (first login scenario)
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

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateUser, blocks, onAddFeedback, isForced = false }) => {
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

    // KVKK State
    const [kvkkChecked, setKvkkChecked] = useState(currentUser.kvkkApproved || false);
    const [isKvkkExpanded, setIsKvkkExpanded] = useState(false);

    // Correction Request Modal States
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [reqBlock, setReqBlock] = useState('');
    const [reqApt, setReqApt] = useState('');
    const [reqFloor, setReqFloor] = useState('');
    const [reqNote, setReqNote] = useState('');

    useEffect(() => {
        setName(currentUser.name);
        setEmail(currentUser.email);
        setRole(currentUser.role);
        setVehiclePlate1(currentUser.vehiclePlate1 || '');
        setVehiclePlate2(currentUser.vehiclePlate2 || '');
        setContactNumber1(currentUser.contactNumber1 || '');
        setContactNumber2(currentUser.contactNumber2 || '');
        setKvkkChecked(currentUser.kvkkApproved || false);
    }, [currentUser]);

    useEffect(() => {
        let found = false;
        for (const block of blocks) {
            for (const apt of block.apartments) {
                if (apt.residentId === currentUser.id) {
                    const floor = apt.floor || calculateFloorFallback(block.name, apt.number);
                    setApartmentInfo(`${block.name} - Kat: ${floor} - Daire: ${apt.number}`);
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

        if (isForced && !kvkkChecked) {
            setErrorMessage('Lütfen devam etmek için KVKK metnini onaylayınız.');
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
            kvkkApproved: kvkkChecked,
            kvkkApprovalDate: kvkkChecked ? (currentUser.kvkkApprovalDate || new Date().toISOString()) : undefined
        };

        onUpdateUser(updatedUser);
        setSuccessMessage('Profil bilgileriniz başarıyla güncellendi!');
        setPassword('');
        setConfirmPassword('');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReportSubmit = () => {
        if (!reqBlock.trim() || !reqApt.trim()) {
            alert("Lütfen en az Blok ve Daire No bilgilerini giriniz.");
            return;
        }

        const content = `Sakin Tarafından Daire Bilgisi Düzeltme Talebi:\n\nMevcut Sistem Kaydı: ${apartmentInfo}\n\nKullanıcının Belirttiği Doğru Bilgiler:\nBlok: ${reqBlock}\nDaire No: ${reqApt}\nKat: ${reqFloor || '-'}\n\nNot: ${reqNote}`;

        onAddFeedback(currentUser.id, 'İstek', 'Daire Bilgisi Düzeltme Talebi', content);
        setReportModalOpen(false);
        setSuccessMessage('Düzeltme talebiniz yöneticiye iletildi.');
        setReqBlock('');
        setReqApt('');
        setReqFloor('');
        setReqNote('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={`bg-white p-6 rounded-3xl shadow-md max-w-2xl mx-auto ${isForced ? 'border-4 border-indigo-100 my-10' : ''}`}>
            
            {isForced && (
                <div className="mb-8 p-6 bg-indigo-600 text-white rounded-2xl shadow-lg">
                    <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Hoş Geldiniz!</h1>
                    <p className="text-sm font-medium opacity-90">Sistemi kullanmaya başlamadan önce lütfen bilgilerinizi kontrol ediniz ve KVKK aydınlatma metnini onaylayınız.</p>
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Profil Bilgilerini Düzenle</h2>
                {!isForced && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">KVKK Onaylı ✅</span>}
            </div>

            {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 animate-in fade-in rounded-r-lg" role="alert">
                    <p className="text-sm font-bold">{successMessage}</p>
                </div>
            )}
            
            {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg" role="alert">
                    <p className="text-sm font-bold">{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <fieldset className="border p-5 rounded-2xl relative border-gray-200">
                    <legend className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest">Daire Bilgisi</legend>
                    <div className="space-y-4">
                        <div>
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Blok, Kat ve Daire Numaranız</label>
                             <div className="flex gap-2 items-center">
                                <input type="text" value={apartmentInfo} disabled className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm cursor-not-allowed font-black text-indigo-600 text-sm" />
                                <button 
                                    type="button" 
                                    onClick={() => setReportModalOpen(true)}
                                    className="px-4 py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors whitespace-nowrap"
                                >
                                    Yanlış mı?
                                </button>
                             </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Durum (Rol)</label>
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold"
                            >
                                <option value="Daire Sahibi">Daire Sahibi</option>
                                <option value="Kiracı">Kiracı</option>
                                {currentUser.role === 'Yönetici' && <option value="Yönetici">Yönetici</option>}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border p-5 rounded-2xl border-gray-200">
                    <legend className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest">Temel Bilgiler</legend>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">İsim Soyisim</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-posta Adresi (Giriş Adı)</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" required />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset className="border p-5 rounded-2xl border-gray-200">
                    <legend className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest">Araç ve İletişim Bilgileri</legend>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">1. Araç Plakası</label>
                            <input type="text" value={vehiclePlate1} onChange={e => setVehiclePlate1(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold uppercase" />
                        </div>
                         <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">2. Araç Plakası</label>
                            <input type="text" value={vehiclePlate2} onChange={e => setVehiclePlate2(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold uppercase" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">1. İrtibat Numarası</label>
                            <input type="tel" value={contactNumber1} onChange={e => setContactNumber1(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">2. İrtibat Numarası</label>
                            <input type="tel" value={contactNumber2} onChange={e => setContactNumber2(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" />
                        </div>
                     </div>
                </fieldset>

                <fieldset className="border p-5 rounded-2xl border-gray-200">
                    <legend className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest">Şifre Değiştirme</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Yeni Şifre</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Yeni Şifre (Tekrar)</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" />
                        </div>
                    </div>
                </fieldset>

                {/* KVKK Section - Always visible in forced mode, or if not approved yet */}
                <div className={`border p-5 rounded-2xl transition-all ${isForced || !kvkkChecked ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                    <legend className="px-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Kişisel Verilerin Korunması</legend>
                    
                    <button 
                        type="button"
                        onClick={() => setIsKvkkExpanded(!isKvkkExpanded)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 mb-3 ml-1"
                    >
                        <svg className={`w-4 h-4 transition-transform ${isKvkkExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        KVKK Aydınlatma Metnini {isKvkkExpanded ? 'Gizle' : 'Oku'}
                    </button>

                    {isKvkkExpanded && (
                        <div className="bg-white p-4 rounded-xl text-[10px] text-gray-600 mb-4 border border-gray-200 leading-relaxed animate-in slide-in-from-top-2">
                            <strong className="block mb-2 text-gray-800">AYDINLATMA METNİ</strong>
                            Site yönetimi olarak kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlemekteyiz. Ad, soyad, iletişim bilgileri, araç plakası ve daire bilgileri gibi verileriniz; site güvenliğinin sağlanması, aidat takibi, duyuruların iletilmesi ve yönetim faaliyetlerinin yürütülmesi amacıyla işlenmektedir. Verileriniz, yasal zorunluluklar haricinde üçüncü kişilerle paylaşılmamaktadır. Veri sorumlusu sıfatıyla işlenen verileriniz üzerinde KVKK 11. madde kapsamındaki haklarınızı kullanabilirsiniz.
                        </div>
                    )}

                    <label className="flex items-start cursor-pointer group select-none">
                        <div className="relative flex items-center h-5">
                            <input 
                                type="checkbox" 
                                checked={kvkkChecked} 
                                onChange={e => setKvkkChecked(e.target.checked)}
                                disabled={!isForced && kvkkChecked} // Once approved in normal mode, keep it checked visually
                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                        </div>
                        <span className="ml-3 text-xs font-bold text-gray-700 leading-snug">
                            Yukarıdaki aydınlatma metnini okudum, anladım. Kişisel verilerimin belirtilen amaçlarla işlenmesini kabul ediyorum.
                        </span>
                    </label>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isForced && !kvkkChecked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        disabled={isForced && !kvkkChecked}
                    >
                        {isForced ? 'Onayla ve Giriş Yap' : 'Bilgilerimi Güncelle'}
                    </button>
                </div>
            </form>

            {/* Correction Request Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Düzeltme Talebi</h3>
                            <button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-800">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Lütfen olması gereken doğru bilgileri aşağıya giriniz. Bu bilgiler yöneticiye iletilecektir.</p>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-1">Doğru Blok</label>
                                    <input type="text" value={reqBlock} onChange={(e) => setReqBlock(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" placeholder="Örn: A1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-1">Doğru Daire No</label>
                                    <input type="text" value={reqApt} onChange={(e) => setReqApt(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" placeholder="Örn: 5" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-1">Doğru Kat (Opsiyonel)</label>
                                <input type="text" value={reqFloor} onChange={(e) => setReqFloor(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-bold" placeholder="Örn: 2" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1 mb-1">Ek Açıklama / Not</label>
                                <textarea value={reqNote} onChange={(e) => setReqNote(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm" placeholder="Varsa eklemek istediklerinizi yazın..." />
                            </div>
                            
                            <button onClick={handleReportSubmit} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md active:scale-95 transition-all">
                                Talebi Gönder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
