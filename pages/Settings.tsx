
import React, { useState, useEffect, useRef } from 'react';
import { User, NotificationPreferences, Page, SiteInfo } from '../types';
import { db } from '../services/database';

interface SettingsProps {
    currentUser: User;
    onUpdateUser: (user: User) => void;
    setCurrentPage: (page: Page) => void;
    siteInfo: SiteInfo;
    onUpdateSiteInfo: (info: SiteInfo) => void;
    appVersion?: string;
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

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, setCurrentPage, siteInfo, onUpdateSiteInfo, appVersion = "v1.6.0" }) => {
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
    const [pastDebtLookbackYears, setPastDebtLookbackYears] = useState(siteInfo.pastDebtLookbackYears || 2);
    const [showLoginDuesModal, setShowLoginDuesModal] = useState(siteInfo.showLoginDuesModal !== false); // Default true
    const [successMessage, setSuccessMessage] = useState('');
    
    // Excel Import States
    const [importStartRow, setImportStartRow] = useState(siteInfo.importStartRow || 8);
    const [importDateCol, setImportDateCol] = useState(siteInfo.importDateCol || 'D');
    const [importAmountCol, setImportAmountCol] = useState(siteInfo.importAmountCol || 'G');
    const [importDescCol, setImportDescCol] = useState(siteInfo.importDescCol || 'Q');

    // Reset States
    const [selectedResets, setSelectedResets] = useState<string[]>([]);
    const [isResetting, setIsResetting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const restoreInputRef = useRef<HTMLInputElement>(null);

    // UI States
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    // Update States
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest'>('idle');

    useEffect(() => {
        setPreferences(currentUser.notificationPreferences || defaultPreferences);
    }, [currentUser]);

    useEffect(() => {
        setLoginActive(siteInfo.isLoginActive || false);
        setPastDebtLookbackYears(siteInfo.pastDebtLookbackYears || 2);
        setShowLoginDuesModal(siteInfo.showLoginDuesModal !== false);
        setImportStartRow(siteInfo.importStartRow || 8);
        setImportDateCol(siteInfo.importDateCol || 'D');
        setImportAmountCol(siteInfo.importAmountCol || 'G');
        setImportDescCol(siteInfo.importDescCol || 'Q');
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
            await onUpdateSiteInfo({ 
                ...siteInfo, 
                isLoginActive: loginActive,
                pastDebtLookbackYears: Number(pastDebtLookbackYears),
                showLoginDuesModal,
                importStartRow,
                importDateCol: importDateCol.toUpperCase(),
                importAmountCol: importAmountCol.toUpperCase(),
                importDescCol: importDescCol.toUpperCase()
            });
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

    const handleBackup = async () => {
        if (window.confirm("Tüm sistem verilerinin yedeği oluşturulup indirilecektir. Onaylıyor musunuz?")) {
            try {
                const allData = await db.getAllData();
                const jsonString = JSON.stringify(allData, null, 2);
                const blob = new Blob([jsonString], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                const date = new Date().toISOString().slice(0, 10);
                a.href = url;
                a.download = `site-yonetim-yedek-${date}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSuccessMessage('Yedekleme başarıyla oluşturuldu ve indirildi.');
                setTimeout(() => setSuccessMessage(''), 4000);
            } catch (error) {
                console.error("Backup failed:", error);
                alert("Yedekleme sırasında bir hata oluştu.");
            }
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (window.confirm("DİKKAT! Bu işlem mevcut tüm verileri silecek ve seçtiğiniz yedek dosyasındaki verilerle değiştirecektir. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?")) {
            setIsRestoring(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);
                    await db.restoreAllData(data);
                    alert("Veriler başarıyla geri yüklendi. Değişikliklerin tam olarak yansıması için sayfa yenilenecektir.");
                    window.location.reload();
                } catch (error) {
                    console.error("Restore failed:", error);
                    alert("Yedek geri yüklenirken bir hata oluştu. Dosyanın geçerli bir yedek dosyası olduğundan emin olun.");
                } finally {
                    setIsRestoring(false);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleCheckUpdate = () => {
        setIsCheckingUpdate(true);
        setUpdateStatus('checking');
        // Simulate network check
        setTimeout(() => {
            setIsCheckingUpdate(false);
            setUpdateStatus('available'); 
        }, 1500);
    };

    const handlePerformUpdate = () => {
        setIsCheckingUpdate(true);
        // Simulate update process
        setTimeout(() => {
            const currentParts = appVersion.replace('v', '').split('.');
            const newPatch = parseInt(currentParts[2]) + 1;
            const newVersion = `v${currentParts[0]}.${currentParts[1]}.${newPatch}`;
            
            // Save to database/SiteInfo instead of local state
            onUpdateSiteInfo({
                ...siteInfo,
                systemVersion: newVersion
            });
            
            setSuccessMessage(`Sistem başarıyla ${newVersion} sürümüne yükseltildi.`);
            setUpdateStatus('latest');
            setIsCheckingUpdate(false);
            
            setTimeout(() => setSuccessMessage(''), 4000);
        }, 1500);
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
        <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Ayarlar</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Uygulama tercihlerinizi ve sistem ayarlarını buradan yönetebilirsiniz.</p>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg animate-in fade-in duration-300">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-bold">{successMessage}</p>
                        </div>
                    </div>
                )}
                
                <div className="space-y-8">
                     {/* Program Parameters Section */}
                     {currentUser.role === 'Yönetici' && (
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg mr-2">⚙️</span>
                                Program Parametreleri
                            </h3>
                            <div className="bg-rose-50/30 rounded-2xl p-6 border border-rose-100/50 space-y-4">
                                <ToggleSwitch 
                                    label="Giriş Ekranı Aktif" 
                                    description="Bu ayar açık olduğunda tüm kullanıcıların (Yönetici dahil) giriş yapması gerekir."
                                    checked={loginActive}
                                    onChange={() => setLoginActive(!loginActive)}
                                    color="bg-rose-600"
                                />
                                
                                <ToggleSwitch 
                                    label="Girişte Aidat Hatırlatma" 
                                    description="Borcu olan sakinlere giriş yaptıktan sonra otomatik uyarı penceresi göster."
                                    checked={showLoginDuesModal}
                                    onChange={() => setShowLoginDuesModal(!showLoginDuesModal)}
                                    color="bg-rose-600"
                                />
                                
                                <div className="pt-4 border-t border-rose-100">
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">Geçmiş Borç Hesaplama Aralığı</h3>
                                                <p className="text-sm text-gray-500">Mevcut yıldan kaç sene geriye gidileceğini belirler.</p>
                                            </div>
                                            <div className="flex items-center">
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="10" 
                                                    value={pastDebtLookbackYears} 
                                                    onChange={(e) => setPastDebtLookbackYears(Number(e.target.value))}
                                                    className="w-16 px-3 py-2 bg-white border border-rose-200 rounded-xl text-sm font-black text-rose-700 outline-none focus:ring-2 focus:ring-rose-200 text-center" 
                                                />
                                                <span className="ml-2 text-xs font-bold text-gray-500">Yıl</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}

                     {/* Excel Import Config Section */}
                     {currentUser.role === 'Yönetici' && (
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <span className="p-1.5 bg-green-50 text-green-600 rounded-lg mr-2">📊</span>
                                Excel Aktarım Yapılandırması
                            </h3>
                            <div className="bg-green-50/20 rounded-2xl p-6 border border-green-100 space-y-6">
                                <p className="text-[10px] text-green-700 font-bold uppercase">* Banka ekstre dosyanızdaki sütun harflerini ve verinin başladığı satır numarasını giriniz.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block ml-1">Başlangıç Satırı</label>
                                        <input type="number" value={importStartRow} onChange={e => setImportStartRow(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-xs font-black text-green-700 outline-none focus:ring-2 focus:ring-green-100" placeholder="8" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block ml-1">İşlem Tarihi (Sütun)</label>
                                        <input type="text" value={importDateCol} onChange={e => setImportDateCol(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-xs font-black text-green-700 outline-none focus:ring-2 focus:ring-green-100 text-center" placeholder="D" maxLength={2} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block ml-1">Tutar (Sütun)</label>
                                        <input type="text" value={importAmountCol} onChange={e => setImportAmountCol(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-xs font-black text-green-700 outline-none focus:ring-2 focus:ring-green-100 text-center" placeholder="G" maxLength={2} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block ml-1">Açıklama (Sütun)</label>
                                        <input type="text" value={importDescCol} onChange={e => setImportDescCol(e.target.value.toUpperCase())} className="w-full px-3 py-2 bg-white border border-green-200 rounded-xl text-xs font-black text-green-700 outline-none focus:ring-2 focus:ring-green-100 text-center" placeholder="Q" maxLength={2} />
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}

                    {/* Collapsible Notifications */}
                    <div className="overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300">
                        <button 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="w-full p-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center">
                                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mr-2">🔔</span>
                                Bildirim Ayarları
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{isNotificationsOpen ? 'Kapat' : 'Düzenle'}</span>
                                <svg 
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isNotificationsOpen ? 'rotate-180' : ''}`} 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        
                        <div className={`transition-all duration-300 ease-in-out ${isNotificationsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="p-6 pt-0 bg-white border-t border-gray-50">
                                <div className="space-y-1">
                                    <ToggleSwitch label="E-posta Bildirimleri" description="Duyurular hakkında e-posta alın." checked={preferences.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
                                    <ToggleSwitch label="SMS Bildirimleri" description="Acil durumlar için SMS alın." checked={preferences.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
                                    <ToggleSwitch label="Yeni Duyurular" description="Yönetim duyurularından haberdar olun." checked={preferences.newAnnouncements} onChange={() => handleToggle('newAnnouncements')} />
                                    <ToggleSwitch label="Aidat Hatırlatmaları" description="Ödeme günü yaklaşan aidatlar için bildirim alın." checked={preferences.duesReminders} onChange={() => handleToggle('duesReminders')} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Version Upgrade Section */}
                    <div>
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg mr-2">🚀</span>
                            Sistem Sürümü & Güncelleme
                        </h3>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full">
                                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Mevcut Versiyon: <span className="text-blue-600 font-black">{appVersion}</span></p>
                                    <p className="text-xs text-gray-500">
                                        {updateStatus === 'checking' ? 'Sunucular kontrol ediliyor...' : 
                                         updateStatus === 'latest' ? 'Sisteminiz güncel.' : 
                                         updateStatus === 'available' ? 'Yeni versiyon bulundu!' :
                                         'Otomatik güncellemeler açık.'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="w-full sm:w-auto">
                                {updateStatus === 'available' ? (
                                    <button 
                                        onClick={handlePerformUpdate}
                                        disabled={isCheckingUpdate}
                                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 animate-pulse"
                                    >
                                        {isCheckingUpdate ? (
                                            <><span className="animate-spin">⏳</span> Yükleniyor...</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Yükselt</>
                                        )}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleCheckUpdate}
                                        disabled={isCheckingUpdate}
                                        className={`w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${updateStatus === 'latest' ? 'bg-gray-400 hover:bg-gray-500' : ''}`}
                                    >
                                        {isCheckingUpdate ? (
                                            <><svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Denetleniyor</>
                                        ) : (
                                            updateStatus === 'latest' ? 'Sistem Güncel' : 'Güncellemeleri Denetle'
                                        )}
                                    </button>
                                )}
                            </div>
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
                                
                                <div className="mt-8 pt-8 border-t border-rose-100">
                                    <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center">
                                        <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg mr-2">💽</span>
                                        Sistem Yedekleme
                                    </h4>
                                    <p className="text-xs text-gray-500 font-bold uppercase leading-relaxed mb-6">
                                        Tüm sistem verilerini (sakinler, aidatlar, harcamalar vb.) bir dosyaya yedekleyin veya daha önce alınmış bir yedeği geri yükleyin.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={handleBackup}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            Tüm Verileri Yedekle
                                        </button>
                                        <input type="file" accept=".json" onChange={handleRestore} ref={restoreInputRef} className="hidden" />
                                        <button
                                            onClick={() => restoreInputRef.current?.click()}
                                            disabled={isRestoring}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-amber-500 text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isRestoring ? (
                                                <>
                                                    <span className="animate-spin mr-2">⏳</span>
                                                    <span>Geri Yükleniyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    <span>Yedekten Geri Yükle</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
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
