
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import BlockManagement from './pages/BlockManagement';
import PlateInquiry from './pages/PlateInquiry';
import DuesManagement from './pages/DuesManagement';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import DuesPage from './pages/Dues';
import Neighbors from './pages/Neighbors';
import Announcements from './pages/Announcements';
import Users from './pages/Users';
import AllUsers from './pages/AllUsers';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import FeedbackPage from './pages/Feedback';
import CashManagement from './pages/CashManagement';
import { User, Page, Block, Announcement, Dues, SiteInfo, Feedback, Expense, NeighborConnection, ChatMessage, Apartment } from './types';
import { db } from './services/database';
import { users as fallbackUsers, mockBlocks, mockAnnouncements } from './data/mockData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isResidentViewMode, setIsResidentViewMode] = useState(false);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dues, setDues] = useState<Dues[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [connections, setConnections] = useState<NeighborConnection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Auto-seed database if empty on first load
  useEffect(() => {
      if (!isLoading && users.length === 0 && blocks.length === 0) {
          console.log("Veritabanı boş, başlangıç verileri yükleniyor (Auto-Seeding)...");
          db.seedDatabase({
              users: fallbackUsers,
              blocks: mockBlocks,
              announcements: mockAnnouncements
          });
      }
  }, [isLoading, users.length, blocks.length]);

  // Subscriptions
  useEffect(() => {
    const unsubUsers = db.subscribeToUsers(setUsers);
    const unsubBlocks = db.subscribeToBlocks(setBlocks);
    const unsubAnnouncements = db.subscribeToAnnouncements(setAnnouncements);
    const unsubDues = db.subscribeToDues(setDues);
    const unsubExpenses = db.subscribeToExpenses(setExpenses);
    const unsubFeedbacks = db.subscribeToFeedbacks(setFeedbacks);
    const unsubConnections = db.subscribeToConnections(setConnections);
    const unsubMessages = db.subscribeToMessages(setMessages);
    const unsubSiteInfo = db.subscribeToSiteInfo((info) => {
        setSiteInfo(info);
        setIsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubBlocks();
      unsubAnnouncements();
      unsubDues();
      unsubExpenses();
      unsubFeedbacks();
      unsubConnections();
      unsubMessages();
      unsubSiteInfo();
    };
  }, []);

  // Session Check
  useEffect(() => {
    const sessionId = db.getSession();
    if (sessionId) {
      if (users.length > 0) {
        const found = users.find(u => u.id === sessionId);
        if (found) setCurrentUser(found);
      }
    }
  }, [users]);

  // Auto-login admin if login screen is disabled
  useEffect(() => {
      if (users.length > 0 && siteInfo && !currentUser) {
          if (!siteInfo.isLoginActive) {
              const adminUser = users.find(u => u.role === 'Yönetici');
              if (adminUser) {
                  setCurrentUser(adminUser);
                  db.saveSession(adminUser.id);
              }
          }
      }
  }, [users, siteInfo, currentUser]);

  useEffect(() => {
      if (!currentUser || currentUser.role !== 'Yönetici') {
          setIsResidentViewMode(false);
      }
  }, [currentUser]);

  // Enforce Profile Page if KVKK not approved
  useEffect(() => {
      if (currentUser && !currentUser.kvkkApproved) {
          setCurrentPage('profile');
      }
  }, [currentUser, currentUser?.kvkkApproved]);

  const handleLogin = (identifier: string, pass: string) => {
    // Admin check allows 'admin' username specifically
    if ((identifier === 'admin' || identifier === 'admin@site.com') && pass === 'admin67') {
        const adminUser = users.find(u => u.role === 'Yönetici') || fallbackUsers.find(u => u.role === 'Yönetici');
        if (adminUser) {
            setCurrentUser(adminUser);
            db.saveSession(adminUser.id);
            return true;
        }
    }

    const foundUser = users.find(u => 
      (u.email === identifier || u.contactNumber1 === identifier || u.contactNumber2 === identifier) && 
      u.password === pass
    );

    if (foundUser && foundUser.isActive) {
      setCurrentUser(foundUser);
      db.saveSession(foundUser.id);
      db.saveUser({ ...foundUser, lastLogin: new Date().toLocaleString('tr-TR') });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    db.saveSession(null);
    setCurrentPage('dashboard');
    setIsResidentViewMode(false);
  };

  const handleResetPassword = (identifier: string) => {
      const user = users.find(u => u.email === identifier || u.contactNumber1 === identifier);
      if(user) {
          db.saveFeedback({
              id: Date.now(),
              userId: user.id,
              type: 'İstek',
              subject: 'Şifre Sıfırlama Talebi',
              content: `Kullanıcı şifre sıfırlama talep etti. İletişim: ${identifier}`,
              createdAt: new Date().toISOString(),
              status: 'Yeni'
          });
      }
  };

  // --- DATA HANDLERS ---
  const handleUpdateUser = (updatedUser: User) => {
      db.saveUser(updatedUser);
      if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
          if (!currentUser.kvkkApproved && updatedUser.kvkkApproved) {
              setCurrentPage('dashboard');
          }
      }
  };

  const handleDeleteUser = async (userId: number) => {
      const updatedBlocks = structuredClone(blocks);
      updatedBlocks.forEach((block: Block) => {
          block.apartments.forEach((apt: Apartment) => {
              if (apt.residentId === userId) {
                  apt.status = 'Boş';
                  delete apt.residentId;
              }
          });
      });
      
      const updatePromises: Promise<void>[] = [];
      const originalBlocksStringMap = new Map(blocks.map(b => [b.id, JSON.stringify(b)]));
      updatedBlocks.forEach((updatedBlock: Block) => {
          if (JSON.stringify(updatedBlock) !== originalBlocksStringMap.get(updatedBlock.id)) {
              updatePromises.push(db.saveBlock(updatedBlock));
          }
      });
      await Promise.all(updatePromises);
      await db.deleteUser(userId);
  };

  const handleUpdateUserAndAssignment = async (userToUpdate: User, assignment: { blockId: number | null, apartmentId: number | null }) => {
    await db.saveUser(userToUpdate);
    if (currentUser?.id === userToUpdate.id) {
        setCurrentUser(userToUpdate);
    }
  
    const updatedBlocks = structuredClone(blocks);
    updatedBlocks.forEach((block: Block) => {
        block.apartments.forEach((apt: Apartment) => {
            if (apt.residentId === userToUpdate.id) {
                apt.status = 'Boş';
                delete apt.residentId;
            }
        });
    });
  
    if (assignment.blockId !== null && assignment.apartmentId !== null) {
        const blockToUpdate = updatedBlocks.find((b: Block) => b.id === assignment.blockId);
        if (blockToUpdate) {
            const aptToUpdate = blockToUpdate.apartments.find((a: Apartment) => a.id === assignment.apartmentId);
            if (aptToUpdate) {
                aptToUpdate.status = 'Dolu';
                aptToUpdate.residentId = userToUpdate.id;
            }
        }
    }
    
    const updatePromises: Promise<void>[] = [];
    const originalBlocksStringMap = new Map(blocks.map(b => [b.id, JSON.stringify(b)]));
    updatedBlocks.forEach((updatedBlock: Block) => {
        if (JSON.stringify(updatedBlock) !== originalBlocksStringMap.get(updatedBlock.id)) {
            updatePromises.push(db.saveBlock(updatedBlock));
        }
    });
    await Promise.all(updatePromises);
  };

  const handleUpdateApartment = async (blockId: number, updatedApt: Apartment) => {
    const updatedBlocks = structuredClone(blocks);
    if (updatedApt.residentId) {
        const residentIdToAssign = updatedApt.residentId;
        updatedBlocks.forEach((b: Block) => {
            b.apartments.forEach((a: Apartment) => {
                if (a.residentId === residentIdToAssign && (b.id !== blockId || a.id !== updatedApt.id)) {
                    a.status = 'Boş';
                    delete a.residentId;
                }
            });
        });
    }

    const targetBlock = updatedBlocks.find((b: Block) => b.id === blockId);
    if (targetBlock) {
        const aptIndex = targetBlock.apartments.findIndex((a: Apartment) => a.id === updatedApt.id);
        if (aptIndex > -1) {
            targetBlock.apartments[aptIndex] = updatedApt;
        }
    }

    const updatePromises: Promise<void>[] = [];
    const originalBlocksStringMap = new Map(blocks.map(b => [b.id, JSON.stringify(b)]));
    updatedBlocks.forEach((updatedBlock: Block) => {
        if (JSON.stringify(updatedBlock) !== originalBlocksStringMap.get(updatedBlock.id)) {
            updatePromises.push(db.saveBlock(updatedBlock));
        }
    });
    await Promise.all(updatePromises);
  };

  const handleMarkMessagesAsRead = (senderId: number) => {
      if (!currentUser) return;
      const unreadMsgs = messages.filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.read);
      unreadMsgs.forEach(m => db.saveMessage({ ...m, read: true }));
  };

  const handleDeleteConnection = (id: number) => db.deleteConnection(id);

  const toggleViewMode = () => {
      if (currentUser?.role === 'Yönetici') {
          setIsResidentViewMode(prev => {
              const newState = !prev;
              if (newState) {
                  const adminPages: Page[] = ['admin', 'blockManagement', 'users', 'expenses', 'settings', 'duesManagement', 'cashManagement', 'allUsers'];
                  if (adminPages.includes(currentPage)) {
                      setCurrentPage('dashboard');
                  }
              }
              return newState;
          });
      }
  };

  if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
  }

  if (!currentUser) {
      if (siteInfo && siteInfo.isLoginActive) {
          return <LoginPage onLogin={handleLogin} onResetPassword={handleResetPassword} />;
      }
      return <div className="flex items-center justify-center h-screen">Oturum doğrulanıyor...</div>;
  }

  if (!siteInfo) return null; 

  const isProfileForced = !currentUser.kvkkApproved;
  const currentAppVersion = siteInfo.systemVersion || "v1.6.0";

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {!isProfileForced && (
          <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            isSidebarOpen={isSidebarOpen} 
            setSidebarOpen={setSidebarOpen} 
            currentUser={currentUser}
            onLogoDoubleClick={toggleViewMode}
            isResidentViewMode={isResidentViewMode}
            feedbacks={feedbacks}
            messages={messages}
            connections={connections}
            onLogout={handleLogout}
            appVersion={currentAppVersion}
          />
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isResidentViewMode && (
            <div className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1 absolute top-0 left-0 right-0 z-50 shadow-md">
                Önizleme Modu: Sakin Görünümü
            </div>
        )}
        
        <Header 
            currentPage={isProfileForced ? 'profile' : currentPage} 
            setCurrentPage={setCurrentPage} 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
            currentUser={currentUser}
            onLogout={handleLogout}
        />

        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 scroll-smooth ${isResidentViewMode ? 'pt-8' : ''}`}>
          <div className="container mx-auto max-w-7xl">
            {isProfileForced ? (
                <Profile 
                    currentUser={currentUser} 
                    onUpdateUser={handleUpdateUser} 
                    blocks={blocks} 
                    onAddFeedback={(userId, type, subject, content, fileData) => db.saveFeedback({id: Date.now(), userId, type, subject, content, createdAt: new Date().toISOString(), status: 'Yeni', fileUrl: fileData?.url, fileName: fileData?.name, fileType: fileData?.type})} 
                    isForced={true}
                />
            ) : (
                <>
                    {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} users={users} blocks={blocks} dues={dues} announcements={announcements} siteInfo={siteInfo} messages={messages} feedbacks={feedbacks} expenses={expenses} setCurrentPage={setCurrentPage} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} onSelectBlock={(id) => { }} onAddFeedback={(userId, type, subject, content, fileData) => db.saveFeedback({id: Date.now(), userId, type, subject, content, createdAt: new Date().toISOString(), status: 'Yeni', fileUrl: fileData?.url, fileName: fileData?.name, fileType: fileData?.type})} connections={connections} isResidentViewMode={isResidentViewMode} />}
                    
                    {currentPage === 'admin' && <AdminPanel onAddAnnouncement={(t, c) => db.saveAnnouncement({id: Date.now(), title: t, content: c, date: new Date().toLocaleDateString('tr-TR')})} setCurrentPage={setCurrentPage} siteInfo={siteInfo} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} onSeedDatabase={() => db.seedDatabase({users: fallbackUsers, blocks: blocks.length ? blocks : [], announcements: []})} />}
                    
                    {currentPage === 'blockManagement' && <BlockManagement blocks={blocks} users={users} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} onAddBlock={(name, apts) => db.saveBlock({id: Date.now(), name, apartments: apts || []})} onUpdateBlock={(id, name, apts) => { const b = blocks.find(b=>b.id===id); if(b) db.saveBlock({...b, name, apartments: apts || b.apartments}); }} onDeleteBlock={(id) => db.deleteBlock(id)} onAddApartment={(bId, apt) => { const b = blocks.find(blk=>blk.id===bId); if(b) db.saveBlock({...b, apartments: [...b.apartments, { ...apt, id: Date.now() }]}); }} onUpdateApartment={handleUpdateApartment} onDeleteApartment={(bId, aId) => { const b = blocks.find(blk=>blk.id===bId); if(b) db.saveBlock({...b, apartments: b.apartments.filter(a => a.id !== aId)}); }} onVacateApartment={(bId, aId) => { const b = blocks.find(blk=>blk.id===bId); if(b) { const newApts = b.apartments.map(a => { if (a.id === aId) { const { residentId, ...rest } = a; return { ...rest, status: 'Boş' as const }; } return a; }); db.saveBlock({ ...b, apartments: newApts }); } }} />}
                    
                    {currentPage === 'plateInquiry' && <PlateInquiry currentUser={currentUser} users={users} blocks={blocks} />}
                    
                    {currentPage === 'duesManagement' && <DuesManagement 
                        users={users} 
                        blocks={blocks} 
                        allDues={dues} 
                        siteInfo={siteInfo} 
                        onUpdateDues={(uid, m, s, a) => { const existing = dues.find(d => d.userId === uid && d.month === m); if(existing) db.saveDue({...existing, status: s, amount: a}); else db.saveDue({id: Date.now() + Math.floor(Math.random() * 100000), userId: uid, month: m, status: s, amount: a}); }} 
                        onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} 
                        setCurrentPage={setCurrentPage} 
                        onUpdateUserAndAssignment={handleUpdateUserAndAssignment}
                    />}
                    
                    {currentPage === 'expenses' && <Expenses expenses={expenses} onAddExpense={(e) => db.saveExpense({...e, id: Date.now()})} onUpdateExpense={(e) => db.saveExpense(e)} onDeleteExpense={(id) => db.deleteExpense(id)} />}
                    
                    {currentPage === 'reports' && <Reports expenses={expenses} dues={dues} siteInfo={siteInfo} />}
                    
                    {currentPage === 'dues' && <DuesPage currentUser={currentUser} allDues={dues} siteInfo={siteInfo} feedbacks={feedbacks} onAddFeedback={(userId, type, subject, content, fileData) => db.saveFeedback({id: Date.now(), userId, type, subject, content, createdAt: new Date().toISOString(), status: 'Yeni', fileUrl: fileData?.url, fileName: fileData?.name, fileType: fileData?.type})} />}
                    
                    {currentPage === 'neighbors' && <Neighbors currentUser={currentUser} users={users} blocks={blocks} connections={connections} messages={messages} onMarkAsRead={handleMarkMessagesAsRead} onSendRequest={(req, res) => db.saveConnection({id: Date.now(), requesterId: req, receiverId: res, status: 'pending'})} onUpdateStatus={(id, s) => { const c = connections.find(c => c.id === id); if(c) db.saveConnection({...c, status: s}); }} onSendMessage={(s, r, c, f) => db.saveMessage({id: Date.now(), senderId: s, receiverId: r, content: c, timestamp: new Date().toISOString(), read: false, fileUrl: f?.url, fileName: f?.name, fileType: f?.type})} onDeleteConnection={handleDeleteConnection} />}
                    
                    {currentPage === 'announcements' && <Announcements announcements={announcements} currentUser={currentUser} onUpdate={(id, t, c) => { const a = announcements.find(an => an.id === id); if(a) db.saveAnnouncement({...a, title: t, content: c}); }} onDelete={(id) => db.deleteAnnouncement(id)} onAdd={(t, c) => db.saveAnnouncement({id: Date.now(), title: t, content: c, date: new Date().toLocaleDateString('tr-TR')})} feedbacks={feedbacks} users={users} blocks={blocks} onAddFeedback={(userId, type, subject, content, fileData) => db.saveFeedback({id: Date.now(), userId, type, subject, content, createdAt: new Date().toISOString(), status: 'Yeni', fileUrl: fileData?.url, fileName: fileData?.name, fileType: fileData?.type})} onUpdateStatus={(id, s) => { const f = feedbacks.find(fb => fb.id === id); if(f) db.saveFeedback({...f, status: s}); }} onRespond={(id, r) => { const f = feedbacks.find(fb => fb.id === id); if(f) db.saveFeedback({...f, adminResponse: r, responseDate: new Date().toISOString(), status: 'Yanıtlandı'}); }} onUpdateDues={(uid, m, s, a) => { const existing = dues.find(d => d.userId === uid && d.month === m); if(existing) db.saveDue({...existing, status: s, amount: a}); else db.saveDue({id: Date.now() + Math.floor(Math.random() * 100000), userId: uid, month: m, status: s, amount: a}); }} siteInfo={siteInfo} isResidentViewMode={isResidentViewMode} />}
                    
                    {currentPage === 'users' && <Users users={users} blocks={blocks} onAddUserAndAssignment={(userData, assignment) => { const newUserId = Date.now(); db.saveUser({ ...userData, id: newUserId, lastLogin: 'Henüz Giriş Yapmadı', needsPasswordChange: true } as User); if(assignment.blockId && assignment.apartmentId) { const block = blocks.find(b => b.id === assignment.blockId); if(block) { const newApts = block.apartments.map(a => a.id === assignment.apartmentId ? { ...a, status: 'Dolu' as const, residentId: newUserId } : a); db.saveBlock({ ...block, apartments: newApts }); } } }} onUpdateUserAndAssignment={handleUpdateUserAndAssignment} onDeleteUser={handleDeleteUser} onToggleUserStatus={(id, status) => { const u = users.find(user => user.id === id); if(u) db.saveUser({ ...u, isActive: status }); }} />}
                    
                    {currentPage === 'allUsers' && <AllUsers users={users} blocks={blocks} />}
                    
                    {currentPage === 'settings' && (
                        <Settings 
                            currentUser={currentUser} 
                            onUpdateUser={handleUpdateUser} 
                            setCurrentPage={setCurrentPage} 
                            siteInfo={siteInfo} 
                            onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} 
                            appVersion={currentAppVersion} 
                        />
                    )}
                    
                    {currentPage === 'profile' && <Profile currentUser={currentUser} onUpdateUser={handleUpdateUser} blocks={blocks} onAddFeedback={(userId, type, subject, content, fileData) => db.saveFeedback({id: Date.now(), userId, type, subject, content, createdAt: new Date().toISOString(), status: 'Yeni', fileUrl: fileData?.url, fileName: fileData?.name, fileType: fileData?.type})} />}
                    
                    {currentPage === 'feedback' && <FeedbackPage currentUser={currentUser} users={users} blocks={blocks} feedbacks={feedbacks} onAddFeedback={(userId, type, subject, content, fileData) => db.saveFeedback({id: Date.now(), userId, type, subject, content, createdAt: new Date().toISOString(), status: 'Yeni', fileUrl: fileData?.url, fileName: fileData?.name, fileType: fileData?.type})} onUpdateStatus={(id, s) => { const f = feedbacks.find(fb => fb.id === id); if(f) db.saveFeedback({...f, status: s}); }} onRespond={(id, r) => { const f = feedbacks.find(fb => fb.id === id); if(f) db.saveFeedback({...f, adminResponse: r, responseDate: new Date().toISOString(), status: 'Yanıtlandı'}); }} onUpdateDues={(uid, m, s, a) => { const existing = dues.find(d => d.userId === uid && d.month === m); if(existing) db.saveDue({...existing, status: s, amount: a}); else db.saveDue({id: Date.now() + Math.floor(Math.random() * 100000), userId: uid, month: m, status: s, amount: a}); }} siteInfo={siteInfo} isResidentViewMode={isResidentViewMode} />}
                    
                    {currentPage === 'cashManagement' && <CashManagement siteInfo={siteInfo} expenses={expenses} dues={dues} users={users} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} setCurrentPage={setCurrentPage} />}
                </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
