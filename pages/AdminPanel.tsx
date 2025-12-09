
import React, { useState, useEffect } from 'react';
import { Page, SiteInfo } from '../types';

interface AdminPanelProps {
    onAddAnnouncement: (title: string, content: string) => void;
    setCurrentPage: (page: Page) => void;
    siteInfo: SiteInfo;
    onUpdateSiteInfo: (info: SiteInfo) => void;
}

const AdminCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col text-center">
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-4 self-center">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 flex-grow">{description}</p>
        <button onClick={onClick} className="w-full mt-auto px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors duration-200 text-sm font-medium">
            Yönet
        </button>
    </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddAnnouncement, setCurrentPage, siteInfo, onUpdateSiteInfo }) => {
    // Announcement State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [announcementSuccess, setAnnouncementSuccess] = useState('');

    // Site Info State
    const [duesAmount, setDuesAmount] = useState(siteInfo.duesAmount);
    const [iban, setIban] = useState(siteInfo.iban);
    const [bankName, setBankName] = useState(siteInfo.bankName);
    const [note, setNote] = useState(siteInfo.note);
    const [infoSuccess, setInfoSuccess] = useState('');

    // Sync local state with props if they change (e.g. from DB load or other updates)
    useEffect(() => {
        setDuesAmount(siteInfo.duesAmount);
        setIban(siteInfo.iban);
        setBankName(siteInfo.bankName);
        setNote(siteInfo.note);
    }, [siteInfo]);

    const handleAnnouncementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            onAddAnnouncement(title, content);
            setTitle('');
            setContent('');
            setAnnouncementSuccess('Duyuru başarıyla yayınlandı!');
            setTimeout(() => setAnnouncementSuccess(''), 3000);
        }
    };

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSiteInfo({
            duesAmount,
            iban,
            bankName,
            note
        });
        setInfoSuccess('Aidat bilgileri başarıyla güncellendi!');
        setTimeout(() => setInfoSuccess(''), 3000);
    }

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800">Yönetim Paneli</h2>
        <p className="text-gray-600 mt-2">
            Sistem genelindeki kritik ayarlara ve yönetim araçlarına buradan hızlıca erişebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Announcement Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MegaphoneIcon className="w-5 h-5 mr-2 text-orange-600" />
                Yeni Duyuru Yayınla
            </h3>
            
            {announcementSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {announcementSuccess}
                </div>
            )}

            <form onSubmit={handleAnnouncementSubmit}>
                <div className="mb-2">
                    <label htmlFor="announcement-title" className="block text-sm font-bold text-gray-700 mb-2">Duyuru Başlığı</label>
                    <input 
                        type="text" 
                        id="announcement-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Örn: Genel Kurul Toplantısı Hakkında"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="announcement-content" className="block text-sm font-bold text-gray-700 mb-2">Duyuru İçeriği</label>
                    <textarea 
                        id="announcement-content"
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Duyurunun detaylarını buraya yazın..."
                        required
                    ></textarea>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-semibold shadow-md flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        Duyuruyu Yayınla
                    </button>
                </div>
            </form>
        </div>

        {/* Site Info Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
             <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <CashIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Aidat Bilgilerini Düzenle
            </h3>

             {infoSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {infoSuccess}
                </div>
            )}

            <form onSubmit={handleInfoSubmit} className="space-y-3">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Aylık Aidat Tutarı (TL)</label>
                    <input 
                        type="number" 
                        value={duesAmount}
                        onChange={(e) => setDuesAmount(Number(e.target.value))}
                        className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Banka Adı</label>
                        <input 
                            type="text" 
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">IBAN No</label>
                        <input 
                            type="text" 
                            value={iban}
                            onChange={(e) => setIban(e.target.value)}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Açıklama / Not</label>
                     <textarea 
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-4 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ödeme yaparken daire no belirtiniz..."
                    ></textarea>
                </div>
                 <div className="flex justify-end pt-2">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold shadow-md flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Bilgileri Güncelle
                    </button>
                </div>
            </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminCard 
                title="Blok & Daire Yönetimi"
                description="Sitedeki blokları ve daireleri yönetin, sakin atamalarını yapın."
                icon={<BuildingOfficeIcon />}
                onClick={() => setCurrentPage('blockManagement')}
            />
            <AdminCard 
                title="Aidat Yönetimi"
                description="Tüm sakinlerin aylık aidat durumlarını görüntüleyin ve ödemeleri işleyin."
                icon={<CashIcon />}
                onClick={() => setCurrentPage('duesManagement')}
            />
            <AdminCard 
                title="Site Ayarları"
                description="Genel site bilgilerini, aidat miktarını ve otomasyon ayarlarını yapılandırın."
                icon={<CogIcon />}
                onClick={() => setCurrentPage('settings')}
            />
            <AdminCard 
                title="Finansal Raporlar"
                description="Aylık ve yıllık gelir-gider raporlarını, aidat ödeme oranlarını görüntüleyin."
                icon={<ChartBarIcon />}
                onClick={() => setCurrentPage('expenses')}
            />
      </div>
    </div>
  );
};

// Icons
const CogIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChartBarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const BuildingOfficeIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const CashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-8 w-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MegaphoneIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>;

export default AdminPanel;
