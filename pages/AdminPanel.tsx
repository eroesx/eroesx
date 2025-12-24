
import React, { useState, useEffect } from 'react';
import { Page, SiteInfo } from '../types';

interface AdminPanelProps {
    onAddAnnouncement: (title: string, content: string) => void;
    setCurrentPage: (page: Page) => void;
    siteInfo: SiteInfo;
    onUpdateSiteInfo: (info: SiteInfo) => void;
    onSeedDatabase?: () => Promise<void>;
}

const AdminCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col text-center border border-gray-100">
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

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddAnnouncement, setCurrentPage, siteInfo, onUpdateSiteInfo, onSeedDatabase }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [announcementSuccess, setAnnouncementSuccess] = useState('');
    const [isSeeding, setIsSeeding] = useState(false);

    const [duesAmount, setDuesAmount] = useState(siteInfo.duesAmount);
    const [iban, setIban] = useState(siteInfo.iban);
    const [bankName, setBankName] = useState(siteInfo.bankName);
    const [note, setNote] = useState(siteInfo.note);
    const [infoSuccess, setInfoSuccess] = useState('');

    useEffect(() => {
        setDuesAmount(siteInfo.duesAmount);
        setIban(siteInfo.iban);
        setBankName(siteInfo.bankName);
        setNote(siteInfo.note || '');
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

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onUpdateSiteInfo({ duesAmount, iban, bankName, note });
        setInfoSuccess('Aidat ve banka bilgileri başarıyla güncellendi!');
        setTimeout(() => setInfoSuccess(''), 4000);
    }

    const handleSeed = async () => {
        if (!onSeedDatabase) return;
        if (window.confirm("Dikkat! Tüm yerel veriler (plaka listesi, sakinler vb.) Firebase bulut sunucusuna yüklenecektir. Mevcut verilerin üzerine yazılabilir. Onaylıyor musunuz?")) {
            setIsSeeding(true);
            try {
                await onSeedDatabase();
                alert("Tüm veriler başarıyla Firebase'e aktarıldı!");
            } catch (err) {
                alert("Hata oluştu: " + err);
            } finally {
                setIsSeeding(false);
            }
        }
    };

  return (
    <div className="space-y-8">
      {/* Üst Alan: Hızlı Navigasyon Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminCard title="Blok & Daire" description="Sakin atamalarını yapın." icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>} onClick={() => setCurrentPage('blockManagement')} />
            <AdminCard title="Aidat Takibi" description="Ödemeleri işleyin." icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} onClick={() => setCurrentPage('duesManagement')} />
            <AdminCard title="Giderler" description="Gider raporları." icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} onClick={() => setCurrentPage('expenses')} />
            <AdminCard title="Ayarlar" description="Sistem tercihler." icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} onClick={() => setCurrentPage('settings')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>
                Yeni Duyuru Yayınla
            </h3>
            {announcementSuccess && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded border border-green-200 text-sm font-medium">{announcementSuccess}</div>}
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg" placeholder="Başlık" required />
                <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg" placeholder="İçerik..." required></textarea>
                <button type="submit" className="w-full py-2 bg-orange-600 text-white rounded-lg font-bold">Duyuruyu Yayınla</button>
            </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
             <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Aidat & Banka Bilgileri
            </h3>
            {infoSuccess && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded border border-green-200 text-sm font-medium">{infoSuccess}</div>}
            <form onSubmit={handleInfoSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Aidat Tutarı (₺)</label>
                        <input type="number" value={duesAmount} onChange={(e) => setDuesAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg" placeholder="Aidat Tutarı" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Banka Adı</label>
                        <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg" placeholder="Banka Adı" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">IBAN</label>
                    <input type="text" value={iban} onChange={(e) => setIban(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm" placeholder="IBAN" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ödeme Notu / Açıklama</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm" placeholder="Örn: Ödeme yaparken daire no belirtiniz." rows={2}></textarea>
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-all">Bilgileri Güncelle</button>
            </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-500">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Sistem Yönetimi</h3>
          <p className="text-sm text-gray-500 mb-4">Uygulamadaki yerel verileri (sakin listesi, plakalar) bulut veritabanına aktarmak için aşağıdaki butonu kullanın.</p>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className={`flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-xl font-black transition-all shadow-lg hover:bg-red-700 active:scale-95 ${isSeeding ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
              {isSeeding ? (
                  <><span className="animate-spin mr-2">⏳</span> Veriler Aktarılıyor...</>
              ) : (
                  <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg> Verileri Firebase'e Aktar</>
              )}
          </button>
      </div>
    </div>
  );
};

export default AdminPanel;
