
import React, { useState, useEffect } from 'react';
import { User, NotificationPreferences, Page } from '../types';

interface SettingsProps {
    currentUser: User;
    onUpdateUser: (user: User) => void;
    setCurrentPage: (page: Page) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateUser, setCurrentPage }) => {
    const defaultPreferences: NotificationPreferences = {
        emailNotifications: true,
        smsNotifications: true,
        newAnnouncements: true,
        duesReminders: true
    };

    const [preferences, setPreferences] = useState<NotificationPreferences>(
        currentUser.notificationPreferences || defaultPreferences
    );
    
    const [successMessage, setSuccessMessage] = useState('');

    // Sync preferences when currentUser updates (e.g., if updated in Profile page and then navigated back)
    useEffect(() => {
        setPreferences(currentUser.notificationPreferences || defaultPreferences);
    }, [currentUser]);

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        const updatedUser = { ...currentUser, notificationPreferences: preferences };
        onUpdateUser(updatedUser);
        setSuccessMessage('Ayarlarınız başarıyla kaydedildi.');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const ToggleSwitch: React.FC<{ 
        label: string; 
        description: string; 
        checked: boolean; 
        onChange: () => void; 
    }> = ({ label, description, checked, onChange }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <div>
                <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                onClick={onChange}
                type="button"
                className={`${
                    checked ? 'bg-indigo-600' : 'bg-gray-200'
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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Ayarlar</h2>
                <p className="text-gray-600 mb-6">Uygulama tercihlerinizi buradan yönetebilirsiniz.</p>

                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{successMessage}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="space-y-6">
                     {/* Edit Profile Section */}
                     <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Hesap Bilgileri
                        </h3>
                        <div 
                            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors flex items-center justify-between shadow-sm"
                            onClick={() => setCurrentPage('profile')}
                        >
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mr-4">
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Profil Bilgilerini Düzenle</h4>
                                    <p className="text-sm text-gray-500">İsim, e-posta, araç ve iletişim bilgilerinizi güncelleyin.</p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            Bildirim Ayarları
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <ToggleSwitch 
                                label="E-posta Bildirimleri" 
                                description="Önemli güncellemeler ve duyurular hakkında e-posta alın."
                                checked={preferences.emailNotifications}
                                onChange={() => handleToggle('emailNotifications')}
                            />
                            <ToggleSwitch 
                                label="SMS Bildirimleri" 
                                description="Acil durumlar ve hatırlatmalar için SMS alın."
                                checked={preferences.smsNotifications}
                                onChange={() => handleToggle('smsNotifications')}
                            />
                            <ToggleSwitch 
                                label="Yeni Duyurular" 
                                description="Site yönetimi yeni bir duyuru yayınladığında haberdar olun."
                                checked={preferences.newAnnouncements}
                                onChange={() => handleToggle('newAnnouncements')}
                            />
                            <ToggleSwitch 
                                label="Aidat Hatırlatmaları" 
                                description="Ödeme günü yaklaşan aidatlar için hatırlatma alın."
                                checked={preferences.duesReminders}
                                onChange={() => handleToggle('duesReminders')}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                            Ayarları Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
