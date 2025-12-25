
import React, { useState, useEffect } from 'react';
import { User, NotificationPreferences, Page, SiteInfo } from '../types';
import { db } from '../services/database';

interface SettingsProps {
    currentUser: User;
    onUpdateUser: (user: User) => void;
    setCurrentPage: (page: Page) => void;
    siteInfo: SiteInfo;
    onUpdateSiteInfo: (info: SiteInfo) => void;
}

const RESET_OPTIONS = [
    { id: 'users', label: 'Sakinler (Yönetici Hariç)' },
    { id: 'blocks', label: 'Blok & Daire Yapısı' },
    { id: 'dues', label: 'Aidat Kayıtları' },
    { id: 'announcements', label: 'Duyurular' },
    { id: 'expenses', label: 'Gider Kayıtları' },
    { id: 'feedbacks', label: 'Öneri/Şikayet Bildirimleri' },
    { id: 'connections', label: 'Komşu Bağlantıları' },
    { id: 'messages', label: 'Mesajlaşma Geçmişi' },
];

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, setCurrentPage, siteInfo, onUpdateSiteInfo }) => {
    const defaultPreferences: NotificationPreferences = {
        emailNotifications: true,
        smsNotifications: true,
        newAnnouncements: true,
        duesReminders: true
    };

    const [preferences, setPreferences] = useState<NotificationPreferences>(
        currentUser.notificationPreferences || defaultPreferences
    );
    
    const [loginActive, setLoginActive] = useState(siteInfo.isLoginActive || false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Reset States
    const [selectedResets, setSelectedResets] = useState<string[]>([]);
    const [isResetting, setIsResetting] = useState(false);

    // Sync preferences when currentUser updates
    useEffect(() => {
        setPreferences(currentUser.notificationPreferences || defaultPreferences);
    }, [currentUser]);

    // Sync login active state
    useEffect(() => {
        setLoginActive(siteInfo.isLoginActive || false);
    }, [siteInfo]);

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        const updatedUser = { ...currentUser, notificationPreferences: preferences };
        onUpdateUser(updatedUser);

        if (currentUser.role === 'Yönetici') {
            await onUpdateSiteInfo({ ...siteInfo, isLoginActive: loginActive });
        }

        setSuccessMessage('Ayarlarınız başarıyla kaydedildi.');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleResetSelection = (id: string) => {
        setSelectedResets(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkReset = async () => {
        if (selectedResets.length === 0) return;
        
        const confirmMsg = `Dikkat! Seçilen ${selectedResets.length} kategoriye ait tüm veriler bulut sunucusundan kalıcı olarak silinecektir. Bu işlem geri alınamaz.\n\nDevam etmek istiyor musunuz?`;
        
        if (window.confirm(confirmMsg)) {
            setIsResetting(true);
            try {
                await db.clearCollections(selectedResets);
                setSuccessMessage('Seçilen veriler başarıyla sıfırlandı.');
                setSelectedResets([]);
                setTimeout(() => setSuccessMessage(''), 4000);
            } catch (err) {
                alert('Sıfırlama sırasında bir hata oluştu: ' + err);
            } finally {
                setIsResetting(false);
            }
        }
    };

    const ToggleSwitch: React.FC<{ 
        label: string; 
        description: string; 
        checked: boolean; 
        onChange: () => void;
        color?: string;
    }> = ({ label, description, checked, onChange, color = 'bg-indigo-600' }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <div>
                <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                onClick={onChange}
                type="button"
                className={`${
                    checked ? color : 'bg-gray-200'
                } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                role="switch"
                aria-checked={checked}
            >
                <span
                    aria-hidden="true"
                    className={`${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
            </button>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Ayarlar</h2>
                <p className="text-sm text-gray-500 font-medium">Uygulama tercihlerinizi buradan yönetebilirsiniz.</p>

                {successMessage && (
                    <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg animate-in fade-in duration-300">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-bold">{successMessage}</p>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 space-y-10">
                     {/* Program Parameters Section */}
                     {currentUser.role === 'Yönetici' && (
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg mr-2">⚙️</span>
                                Program Parametreleri
                            </h3>
                            <div className="bg-rose-50/30 rounded-2xl p-6 border border-rose-100/50">
                                <ToggleSwitch 
                                    label="Giriş Ekranı Aktif" 
                                    description="Bu ayar açık olduğunda tüm kullanıcıların (Yönetici dahil) giriş yapması gerekir."
                                    checked={loginActive}
                                    onChange={() => setLoginActive(!loginActive)}
                                    color="bg-rose-600"
                                />
                            </div>
                        </div>
                     )}

                     {/* Profile Card */}
                     <div>
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mr-2">👤</span>
                            Hesap Bilgileri
                        </h3>
                        <div 
                            className="bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl p-5 cursor-pointer transition-all flex items-center justify-between group shadow-sm active:scale-[0.98]"
                            onClick={() => setCurrentPage('profile')}
                        >
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl mr-4 shadow-indigo-200 shadow-lg">
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">Profil Bilgilerini Düzenle</h4>
                                    <p className="text-xs text-gray-500 font-medium">İletişim ve araç bilgilerini güncelle.</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div>
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mr-2">🔔</span>
                            Bildirim Ayarları
                        </h3>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <ToggleSwitch label="E-posta Bildirimleri" description="Duyurular hakkında e-posta alın." checked={preferences.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
                            <ToggleSwitch label="SMS Bildirimleri" description="Acil durumlar için SMS alın." checked={preferences.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
                            <ToggleSwitch label="Yeni Duyurular" description="Yönetim duyurularından haberdar olun." checked={preferences.newAnnouncements} onChange={() => handleToggle('newAnnouncements')} />
                            <ToggleSwitch label="Aidat Hatırlatmaları" description="Ödeme günü yaklaşan aidatlar için bildirim alın." checked={preferences.duesReminders} onChange={() => handleToggle('duesReminders')} />
                        </div>
                    </div>

                    {/* Data Management Section - ONLY FOR ADMIN */}
                    {currentUser.role === 'Yönetici' && (
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center">
                                <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg mr-2">⚠️</span>
                                Tehlikeli Bölge: Veri Yönetimi
                            </h3>
                            <div className="bg-white rounded-2xl p-6 border-2 border-rose-50 shadow-sm space-y-6">
                                <p className="text-xs text-gray-500 font-bold uppercase leading-relaxed">Sıfırlanacak verileri aşağıdan seçiniz:</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {RESET_OPTIONS.map(opt => (
                                        <label 
                                            key={opt.id} 
                                            className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                                                selectedResets.includes(opt.id) 
                                                ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-200' 
                                                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                                checked={selectedResets.includes(opt.id)}
                                                onChange={() => handleResetSelection(opt.id)}
                                            />
                                            <span className={`ml-3 text-xs font-black uppercase tracking-tight ${selectedResets.includes(opt.id) ? 'text-rose-700' : 'text-gray-600'}`}>
                                                {opt.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <p className="text-[10px] text-amber-700 font-bold uppercase leading-tight">
                                        * Seçilen veriler bulut sunucusundan kalıcı olarak silinecektir. Yönetici hesabınız korunur.
                                    </p>
                                </div>

                                <button
                                    onClick={handleBulkReset}
                                    disabled={selectedResets.length === 0 || isResetting}
                                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                                        selectedResets.length > 0 && !isResetting
                                        ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {isResetting ? 'Veriler Siliniyor...' : `Seçilen ${selectedResets.length} Veriyi Sıfırla`}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-indigo-100 shadow-xl transition-all active:scale-95"
                        >
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
