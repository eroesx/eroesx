
import React, { useState } from 'react';
import { Announcement, User } from '../types';

interface AnnouncementsProps {
  announcements: Announcement[];
  currentUser: User;
  onUpdate: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
  onAdd: (title: string, content: string) => void;
  isResidentViewMode?: boolean;
}

const EditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    onSave: (title: string, content: string) => void;
    isEdit: boolean;
}> = ({ isOpen, onClose, title: initialTitle, content: initialContent, onSave, isEdit }) => {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);

    // Update local state when props change
    React.useEffect(() => {
        setTitle(initialTitle);
        setContent(initialContent);
    }, [initialTitle, initialContent, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{isEdit ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Başlık</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                            placeholder="Duyuru başlığı..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">İçerik</label>
                        <textarea 
                            rows={5}
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                            placeholder="Duyuru içeriği..."
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-8 gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">İptal</button>
                    <button 
                        onClick={() => { onSave(title, content); onClose(); }} 
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                        {isEdit ? 'Güncelle' : 'Yayınla'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Announcements: React.FC<AnnouncementsProps> = ({ announcements, currentUser, onUpdate, onDelete, onAdd, isResidentViewMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  // Hide controls if user is not manager OR if manager is in resident view mode
  const isManager = currentUser.role === 'Yönetici' && !isResidentViewMode;

  const handleEditClick = (announcement: Announcement) => {
      setEditingItem(announcement);
      setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
      if(window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
          onDelete(id);
      }
  };

  const handleSave = (title: string, content: string) => {
      if (editingItem) {
          onUpdate(editingItem.id, title, content);
      } else {
          onAdd(title, content);
      }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <EditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem?.title || ''}
        content={editingItem?.content || ''}
        onSave={handleSave}
        isEdit={!!editingItem}
      />

      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Duyurular</h2>
        {isManager && (
            <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-90 flex items-center justify-center"
                title="Yeni Duyuru Ekle"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>
        )}
      </div>

      <div className="space-y-6">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">{announcement.title}</h3>
                      <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">📅 {announcement.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg uppercase tracking-tight">Yönetim</span>
                      
                      {isManager && (
                          <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditClick(announcement)}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 rounded-xl"
                                title="Düzenle"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(announcement.id)}
                                className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-gray-50 rounded-xl"
                                title="Sil"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                              </button>
                          </div>
                      )}
                  </div>
              </div>
              <div className="mt-6 text-gray-600 whitespace-pre-wrap leading-relaxed font-medium">
                {announcement.content}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Henüz yayınlanmış bir duyuru bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
