
import React, { useState } from 'react';
import { Announcement, User } from '../types';

interface AnnouncementsProps {
  announcements: Announcement[];
  currentUser: User;
  onUpdate: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
  isResidentViewMode?: boolean;
}

const EditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    onSave: (title: string, content: string) => void;
}> = ({ isOpen, onClose, title: initialTitle, content: initialContent, onSave }) => {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);

    // Update local state when props change
    React.useEffect(() => {
        setTitle(initialTitle);
        setContent(initialContent);
    }, [initialTitle, initialContent, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Duyuruyu Düzenle</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Başlık</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">İçerik</label>
                        <textarea 
                            rows={5}
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">İptal</button>
                    <button 
                        onClick={() => { onSave(title, content); onClose(); }} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
};

const Announcements: React.FC<AnnouncementsProps> = ({ announcements, currentUser, onUpdate, onDelete, isResidentViewMode }) => {
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

  const handleSaveEdit = (title: string, content: string) => {
      if (editingItem) {
          onUpdate(editingItem.id, title, content);
      }
  };

  return (
    <div>
      <EditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem?.title || ''}
        content={editingItem?.content || ''}
        onSave={handleSaveEdit}
      />

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Duyurular</h2>
        <p className="text-gray-600 mt-2">
          Site yönetimi tarafından yayınlanan en güncel duyuruları buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="space-y-6">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white p-6 rounded-lg shadow-md relative group">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Yayınlanma Tarihi: {announcement.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">Yönetim</span>
                      
                      {isManager && (
                          <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => handleEditClick(announcement)}
                                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                title="Düzenle"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(announcement.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Sil"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                              </button>
                          </div>
                      )}
                  </div>
              </div>
              <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">Henüz yayınlanmış bir duyuru bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
