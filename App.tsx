
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Dues from './pages/Dues';
import Announcements from './pages/Announcements';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import LoginPage from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import BlockManagement from './pages/BlockManagement';
import ProfilePage from './pages/Profile';
import PlateInquiry from './pages/PlateInquiry';
import DuesManagement from './pages/DuesManagement';
import Neighbors from './pages/Neighbors';
import FeedbackPage from './pages/Feedback';
import CashManagement from './pages/CashManagement';
import { Page, User, Announcement, Block, Dues as DuesType, SiteInfo, Expense, Feedback, FeedbackType, NeighborConnection, ChatMessage } from './types';
import { db } from './services/database';
import { users as fallbackUsers } from './data/mockData';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasLoggedOutManually, setHasLoggedOutManually] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dues, setDues] = useState<DuesType[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [connections, setConnections] = useState<NeighborConnection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);
  const [forceResidentDashboard, setForceResidentDashboard] = useState(false);
  
  // Dashboard'dan Blok Yönetimi'ne hedefli geçiş için
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    const timer = setTimeout(() => {
        if (loading) setShowTimeoutButton(true);
    }, 4000);

    const initApp = async () => {
      try {
        setLoading(true);

        unsubs.push(db.subscribeToUsers((newUsers) => {
            setUsers(newUsers);
            const savedId = db.getSession();
            if (savedId && !currentUser && !hasLoggedOutManually) {
                const sessionUser = newUsers.find(u => u.id === savedId) || fallbackUsers.find(u => u.id === savedId);
                if (sessionUser) {
                    setCurrentUser(sessionUser);
                }
            }
        }));

        unsubs.push(db.subscribeToBlocks(setBlocks));
        unsubs.push(db.subscribeToAnnouncements(setAnnouncements));
        unsubs.push(db.subscribeToDues(setDues));
        unsubs.push(db.subscribeToExpenses(setExpenses));
        unsubs.push(db.subscribeToFeedbacks(setFeedbacks));
        unsubs.push(db.subscribeToConnections(setConnections));
        unsubs.push(db.subscribeToMessages(setMessages));
        unsubs.push(db.subscribeToSiteInfo(setSiteInfo));

      } catch (err: any) {
        console.error("Firebase Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
    return () => {
        unsubs.forEach(unsub => unsub());
        clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
      if (siteInfo && siteInfo.isLoginActive === false && !currentUser && !loading && !hasLoggedOutManually) {
          const adminUser = users.find(u => u.id === 1) || fallbackUsers.find(u => u.id === 1);
          if (adminUser) {
            setCurrentUser(adminUser);
            setCurrentPage('dashboard'); // Varsayılan anasayfa
          }
      }
  }, [siteInfo, currentUser, loading, users, hasLoggedOutManually]);

  const handleLogin = (identifier: string, pass: string): boolean => {
      const cleanId = identifier.trim().toLowerCase().replace(/\s/g, '');
      const cleanIdNoZero = cleanId.startsWith('0') ? cleanId.substring(1) : cleanId;
      const cleanPass = pass.trim().replace(/\s/g, '');
      const cleanPassNoZero = cleanPass.startsWith('0') ? cleanPass.substring(1) : cleanPass;

      if ((cleanId === 'admin' || cleanId === 'admin@site.com') && cleanPass === 'admin67') {
          const adminUser = users.find(u => u.id === 1) || fallbackUsers.find(u => u.id === 1)!;
          setCurrentUser(adminUser);
          setHasLoggedOutManually(false);
          db.saveSession(adminUser.id);
          setCurrentPage('dashboard'); // Girişte her zaman anasayfa gelsin
          return true;
      }

      const combinedUsers = [...users, ...fallbackUsers];
      const user = combinedUsers.find(u => {
          const dbEmail = u.email.trim().toLowerCase();
          const dbPhone = (u.contactNumber1 || '').trim().replace(/\s/g, '');
          const dbPhoneNoZero = dbPhone.startsWith('0') ? dbPhone.substring(1) : dbPhone;
          
          const emailMatch = dbEmail === cleanId;
          const phoneMatch = dbPhone === cleanId || dbPhoneNoZero === cleanIdNoZero;
          
          const dbPass = (u.password || '').trim();
          const dbPassNoZero = dbPass.startsWith('0') ? dbPass.substring(1) : dbPass;
          const passwordMatch = dbPass === cleanPass || dbPassNoZero === cleanPassNoZero || dbPass === cleanPassNoZero;
          
          return (emailMatch || phoneMatch) && passwordMatch;
      });

      if (user) {
          if (!user.isActive) {
              alert("Hesabınız pasif durumdadır.");
              return false;
          }
          setCurrentUser(user);
          setHasLoggedOutManually(false);
          db.saveSession(user.id);
          setCurrentPage('dashboard'); // Girişte her zaman anasayfa gelsin
          return true;
      }
      return false;
  };

  const handleLogout = useCallback(() => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
        db.saveSession(null);
        setCurrentUser(null);
        setHasLoggedOutManually(true);
        setCurrentPage('dashboard');
    }
  }, []);

  const handleUpdateUser = async (updatedUser: User) => {
      await db.saveUser(updatedUser);
  };

  const handleUpdateUserAndAssignment = async (updatedUser: User, assignment: { blockId: number | null, apartmentId: number | null }) => {
      await db.saveUser(updatedUser);
      let oldBlock: Block | undefined;
      let oldAptId: number | undefined;
      for (const b of blocks) {
          const apt = b.apartments.find(a => a.residentId === updatedUser.id);
          if (apt) { oldBlock = b; oldAptId = apt.id; break; }
      }
      if (oldBlock && oldAptId && (oldBlock.id !== assignment.blockId || oldAptId !== assignment.apartmentId || !updatedUser.isActive)) {
          const updatedOldBlock = {
              ...oldBlock,
              apartments: oldBlock.apartments.map(a => a.id === oldAptId ? { ...a, status: 'Boş' as const, residentId: undefined } : a)
          };
          await db.saveBlock(updatedOldBlock);
      }
      if (updatedUser.isActive && assignment.blockId && assignment.apartmentId) {
          const targetBlock = blocks.find(b => b.id === assignment.blockId);
          if (targetBlock) {
              const updatedTargetBlock = {
                  ...targetBlock,
                  apartments: targetBlock.apartments.map(a => a.id === assignment.apartmentId ? { ...a, status: 'Dolu' as const, residentId: updatedUser.id } : a)
              };
              await db.saveBlock(updatedTargetBlock);
          }
      }
  };

  const handleAddUserAndAssignment = async (userData: any, assignment: any) => {
      const newUser = { ...userData, id: Date.now(), lastLogin: 'Henüz Giriş Yapılmadı', isActive: true };
      await db.saveUser(newUser);
      if (assignment.blockId && assignment.apartmentId) {
          const targetBlock = blocks.find(b => b.id === assignment.blockId);
          if (targetBlock) {
              const updatedBlock = {
                  ...targetBlock,
                  apartments: targetBlock.apartments.map(apt => 
                      apt.id === assignment.apartmentId ? { ...apt, status: 'Dolu' as const, residentId: newUser.id } : apt
                  )
              };
              await db.saveBlock(updatedBlock);
          }
      }
  };

  const handleDeleteUser = async (userId: number) => {
    let blockToUpdate: Block | undefined;
    for (const b of blocks) {
      if (b.apartments.some(a => a.residentId === userId)) { blockToUpdate = b; break; }
    }
    if (blockToUpdate) {
      const updatedBlock = {
        ...blockToUpdate,
        apartments: blockToUpdate.apartments.map(a => 
          a.residentId === userId ? { ...a, status: 'Boş' as const, residentId: undefined } : a
        )
      };
      await db.saveBlock(updatedBlock);
    }
    await db.deleteUser(userId);
  };

  const handleUpdateDues = async (userId: number, month: string, status: 'Ödendi' | 'Ödenmedi', amount: number) => {
      const existingDue = dues.find(d => d.userId === userId && d.month === month);
      const newDue = existingDue ? { ...existingDue, status, amount } : { id: Date.now() + Math.random(), userId, month, status, amount };
      await db.saveDue(newDue as DuesType);
  };

  const handleMarkMessagesAsRead = async (senderId: number) => {
      if (!currentUser) return;
      const unread = messages.filter(m => m.receiverId === currentUser.id && m.senderId === senderId && !m.read);
      for (const m of unread) {
          await db.saveMessage({ ...m, read: true });
      }
  };

  const handleAddFeedback = async (uid: number, type: FeedbackType, s: string, c: string) => {
    await db.saveFeedback({id: Date.now(), userId: uid, type, subject: s, content: c, createdAt: new Date().toISOString(), status: 'Yeni'});
  };

  if (loading || !siteInfo) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-gray-50 px-4 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Sunucuya Bağlanılıyor</h2>
        <p className="text-gray-500 font-medium">Lütfen bekleyiniz...</p>
      </div>
      {showTimeoutButton && (
        <button onClick={() => setLoading(false)} className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold shadow-sm">Bağlantısız Başlat</button>
      )}
    </div>
  );

  if (siteInfo.isLoginActive && !currentUser) {
      return <LoginPage onLogin={handleLogin} onResetPassword={async (id) => {
          const user = [...users, ...fallbackUsers].find(u => u.email === id || u.contactNumber1 === id);
          await db.saveFeedback({
              id: Date.now(), userId: user?.id || 0, type: 'İstek', subject: 'Şifre Sıfırlama Talebi',
              content: `${id} için şifre sıfırlama istendi.`, createdAt: new Date().toISOString(), status: 'Yeni'
          });
      }} />;
  }

  const displayUser = currentUser || (hasLoggedOutManually ? null : (users.find(u => u.id === 1) || fallbackUsers[0]));

  if (!displayUser) {
      return <LoginPage onLogin={handleLogin} onResetPassword={() => {}} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        currentPage={currentPage} setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}
        currentUser={displayUser} onLogoDoubleClick={() => setForceResidentDashboard(!forceResidentDashboard)}
        feedbacks={feedbacks} messages={messages}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          currentPage={currentPage} setCurrentPage={setCurrentPage}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
          currentUser={displayUser} onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 md:p-8">
            {currentPage === 'dashboard' && <Dashboard currentUser={displayUser} users={users} blocks={blocks} dues={dues} announcements={announcements} siteInfo={siteInfo} messages={messages} setCurrentPage={setCurrentPage} isResidentViewMode={forceResidentDashboard} feedbacks={feedbacks} onUpdateUser={handleUpdateUser} expenses={expenses} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} onSelectBlock={(id) => setActiveBlockId(id)} onAddFeedback={handleAddFeedback} />}
            {currentPage === 'admin' && <AdminPanel onAddAnnouncement={(t, c) => db.saveAnnouncement({id: Date.now(), title: t, content: c, date: new Date().toLocaleDateString('tr-TR')})} setCurrentPage={setCurrentPage} siteInfo={siteInfo} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} onSeedDatabase={() => db.seedDatabase({ users: fallbackUsers, blocks: blocks.length ? blocks : [], announcements: announcements.length ? announcements : [] })} />}
            {currentPage === 'users' && <Users users={users.length ? users : fallbackUsers} blocks={blocks} onAddUserAndAssignment={handleAddUserAndAssignment} onUpdateUserAndAssignment={handleUpdateUserAndAssignment} onDeleteUser={handleDeleteUser} onToggleUserStatus={(id, status) => {
                const u = users.find(user => user.id === id) || fallbackUsers.find(u => u.id === id);
                if (u) handleUpdateUserAndAssignment({...u, isActive: status}, {blockId: null, apartmentId: null});
            }} />}
            {currentPage === 'blockManagement' && <BlockManagement blocks={blocks} users={users.length ? users : fallbackUsers} onDeleteUser={handleDeleteUser} onAddBlock={async name => await db.saveBlock({id: Date.now(), name, apartments: []})} onUpdateBlock={async (id, name) => await db.saveBlock({...blocks.find(b => b.id === id)!, name})} onDeleteBlock={async id => {}} onAddApartment={async (bid, num, rid) => {
                const b = blocks.find(block => block.id === bid);
                if (b) await db.saveBlock({...b, apartments: [...b.apartments, {id: Date.now(), number: num, status: rid ? 'Dolu' : 'Boş', residentId: rid}]});
            }} onUpdateApartment={async (bid, apt) => {
                const b = blocks.find(block => block.id === bid);
                if (b) await db.saveBlock({...b, apartments: b.apartments.map(a => a.id === apt.id ? apt : a)});
            }} onDeleteApartment={async (bid, aid) => {
                const b = blocks.find(block => block.id === bid);
                if (b) await db.saveBlock({...b, apartments: b.apartments.filter(a => a.id !== aid)});
            }} onVacateApartment={async (bid, aid) => {
                const b = blocks.find(block => block.id === aid);
                if (b) await db.saveBlock({...b, apartments: b.apartments.map(a => a.id === aid ? {...a, status: 'Boş', residentId: undefined} : a)});
            }} targetBlockId={activeBlockId} onClearTargetBlock={() => setActiveBlockId(null)} />}
            {currentPage === 'dues' && siteInfo && <Dues currentUser={displayUser} allDues={dues} siteInfo={siteInfo} />}
            {currentPage === 'duesManagement' && <DuesManagement users={users.length ? users : fallbackUsers} blocks={blocks} allDues={dues} siteInfo={siteInfo} onUpdateDues={handleUpdateDues} />}
            {currentPage === 'announcements' && <Announcements announcements={announcements} currentUser={displayUser} onUpdate={(id, t, c) => db.saveAnnouncement({...announcements.find(a => a.id === id)!, title: t, content: c})} onDelete={id => db.deleteAnnouncement(id)} onAdd={(t, c) => db.saveAnnouncement({id: Date.now(), title: t, content: c, date: new Date().toLocaleDateString('tr-TR')})} isResidentViewMode={forceResidentDashboard} />}
            {currentPage === 'profile' && <ProfilePage currentUser={displayUser} onUpdateUser={handleUpdateUser} blocks={blocks} />}
            {currentPage === 'expenses' && <Expenses expenses={expenses} onAddExpense={exp => db.saveExpense({...exp, id: Date.now()})} onDeleteExpense={id => db.deleteExpense(id)} />}
            {currentPage === 'feedback' && <FeedbackPage currentUser={displayUser} users={users.length ? users : fallbackUsers} blocks={blocks} feedbacks={feedbacks} onAddFeedback={handleAddFeedback} onUpdateStatus={(id, s) => db.saveFeedback({...feedbacks.find(f => f.id === id)!, status: s})} onRespond={(id, r) => db.saveFeedback({...feedbacks.find(f => f.id === id)!, status: 'Yanıtlandı', adminResponse: r, responseDate: new Date().toISOString()})} isResidentViewMode={forceResidentDashboard} />}
            {currentPage === 'plateInquiry' && <PlateInquiry users={users.length ? users : fallbackUsers} blocks={blocks} />}
            {currentPage === 'neighbors' && <Neighbors currentUser={displayUser} users={users.length ? users : fallbackUsers} blocks={blocks} connections={connections} messages={messages} onMarkAsRead={handleMarkMessagesAsRead} onSendRequest={(req, res) => db.saveConnection({id: Date.now(), requesterId: req, receiverId: res, status: 'pending'})} onUpdateStatus={(id, s) => db.saveConnection({...connections.find(c => c.id === id)!, status: s})} onSendMessage={(s, r, c) => db.saveMessage({id: Date.now(), senderId: s, receiverId: r, content: c, timestamp: new Date().toISOString(), read: false})} />}
            {currentPage === 'settings' && <Settings currentUser={displayUser} onUpdateUser={handleUpdateUser} setCurrentPage={setCurrentPage} siteInfo={siteInfo} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} />}
            {currentPage === 'cashManagement' && siteInfo && <CashManagement siteInfo={siteInfo} expenses={expenses} dues={dues} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} setCurrentPage={setCurrentPage} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
