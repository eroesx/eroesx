
import React, { useState, useEffect } from 'react';
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
import { Page, User, Announcement, Block, Dues as DuesType, SiteInfo, Expense, Feedback, FeedbackType, NeighborConnection, ChatMessage } from './types';
import { db } from './services/database';
import { users as fallbackUsers } from './data/mockData';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dues, setDues] = useState<DuesType[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>({
      duesAmount: 500,
      bankName: "Site Yönetim Bankası",
      iban: "TR00 0000 0000 0000 0000 0000 00",
      note: "Ödeme yaparken daire numaranızı belirtiniz."
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [connections, setConnections] = useState<NeighborConnection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceResidentDashboard, setForceResidentDashboard] = useState(false);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    const timer = setTimeout(() => {
        if (loading) setShowTimeoutButton(true);
    }, 4000);

    const initApp = async () => {
      try {
        setLoading(true);
        setError(null);

        unsubs.push(db.subscribeToUsers((newUsers) => {
            setUsers(newUsers);
            const savedId = db.getSession();
            if (savedId) {
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

  // HANDLERS
  const handleLogin = (identifier: string, pass: string): boolean => {
      const cleanId = identifier.trim().toLowerCase().replace(/\s/g, '');
      // Fix: Defined cleanIdNoZero here to resolve "Cannot find name 'cleanIdNoZero'"
      const cleanIdNoZero = cleanId.startsWith('0') ? cleanId.substring(1) : cleanId;
      const cleanPass = pass.trim().replace(/\s/g, '');
      const cleanPassNoZero = cleanPass.startsWith('0') ? cleanPass.substring(1) : cleanPass;

      // 1. ADMIN KONTROLÜ (Sabit admin girişi)
      if ((cleanId === 'admin' || cleanId === 'admin@site.com') && cleanPass === 'admin67') {
          const adminUser = users.find(u => u.id === 1) || fallbackUsers.find(u => u.id === 1)!;
          setCurrentUser(adminUser);
          db.saveSession(adminUser.id);
          return true;
      }

      // 2. KULLANICI ARAMA (Bulut Veriler + Yerel Veriler)
      const combinedUsers = [...users, ...fallbackUsers];
      const user = combinedUsers.find(u => {
          const dbEmail = u.email.trim().toLowerCase();
          const dbPhone = (u.contactNumber1 || '').trim().replace(/\s/g, '');
          const dbPhoneNoZero = dbPhone.startsWith('0') ? dbPhone.substring(1) : dbPhone;
          
          const emailMatch = dbEmail === cleanId;
          // Fix: Simplified phoneMatch logic using the outer cleanIdNoZero
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
          db.saveSession(user.id);
          return true;
      }
      return false;
  };

  const handleResetPassword = async (identifier: string) => {
      const cleanId = identifier.trim().toLowerCase().replace(/\s/g, '');
      const cleanIdNoZero = cleanId.startsWith('0') ? cleanId.substring(1) : cleanId;
      const combinedUsers = [...users, ...fallbackUsers];

      const user = combinedUsers.find(u => {
          const dbEmail = u.email.toLowerCase();
          const dbPhone = (u.contactNumber1 || '').replace(/\s/g, '');
          const dbPhoneNoZero = dbPhone.startsWith('0') ? dbPhone.substring(1) : dbPhone;
          return dbEmail === cleanId || dbPhoneNoZero === cleanIdNoZero;
      });
      
      const feedbackData: Omit<Feedback, 'id'> = {
          userId: user ? user.id : 0, 
          type: 'İstek',
          subject: 'Şifre Sıfırlama Talebi',
          content: user 
            ? `${user.name} kullanıcısı şifre sıfırlama talebinde bulundu.\nİletişim: ${user.contactNumber1}`
            : `Sistemde bulunamayan bir giriş için talep: ${identifier}`,
          createdAt: new Date().toISOString(),
          status: 'Yeni'
      };

      await db.saveFeedback({ ...feedbackData, id: Date.now() } as Feedback);
  };

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

  const handleLogout = () => {
    setCurrentUser(null);
    db.saveSession(null);
  };

  if (loading && !siteInfo) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-gray-50 px-4 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Bulut Sunucusuna Bağlanılıyor</h2>
        <p className="text-gray-500 font-medium">Veriler senkronize ediliyor...</p>
      </div>
      {showTimeoutButton && (
        <button onClick={() => setLoading(false)} className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold shadow-sm">Bağlantıyı Beklemeden Başlat</button>
      )}
    </div>
  );

  if (!currentUser) return <LoginPage onLogin={handleLogin} onResetPassword={handleResetPassword} />;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentPage={currentPage} setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}
        currentUser={currentUser} onLogoDoubleClick={() => setForceResidentDashboard(!forceResidentDashboard)}
        feedbacks={feedbacks}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentPage={currentPage} setCurrentPage={setCurrentPage}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
          currentUser={currentUser} onLogout={handleLogout}
        />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {currentPage === 'dashboard' && <Dashboard currentUser={currentUser} users={users} blocks={blocks} dues={dues} announcements={announcements} siteInfo={siteInfo || {duesAmount: 500, bankName: '', iban: '', note: ''}} setCurrentPage={setCurrentPage} isResidentViewMode={forceResidentDashboard} feedbacks={feedbacks} />}
          {currentPage === 'admin' && <AdminPanel onAddAnnouncement={(t, c) => db.saveAnnouncement({id: Date.now(), title: t, content: c, date: new Date().toLocaleDateString('tr-TR')})} setCurrentPage={setCurrentPage} siteInfo={siteInfo || {duesAmount: 500, bankName: '', iban: '', note: ''}} onUpdateSiteInfo={(info) => db.saveSiteInfo(info)} onSeedDatabase={() => db.seedDatabase({ users: fallbackUsers, blocks: blocks.length ? blocks : [], announcements: announcements.length ? announcements : [] })} />}
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
          }} />}
          {currentPage === 'dues' && <Dues currentUser={currentUser} allDues={dues} />}
          {currentPage === 'duesManagement' && <DuesManagement users={users.length ? users : fallbackUsers} blocks={blocks} allDues={dues} siteInfo={siteInfo || {duesAmount: 500, bankName: '', iban: '', note: ''}} onUpdateDues={handleUpdateDues} />}
          {currentPage === 'announcements' && <Announcements announcements={announcements} currentUser={currentUser} onUpdate={(id, t, c) => db.saveAnnouncement({...announcements.find(a => a.id === id)!, title: t, content: c})} onDelete={id => {}} />}
          {currentPage === 'profile' && <ProfilePage currentUser={currentUser} onUpdateUser={handleUpdateUser} blocks={blocks} />}
          {currentPage === 'expenses' && <Expenses expenses={expenses} onAddExpense={exp => db.saveExpense({...exp, id: Date.now()})} onDeleteExpense={id => {}} />}
          {currentPage === 'feedback' && <FeedbackPage currentUser={currentUser} users={users.length ? users : fallbackUsers} blocks={blocks} feedbacks={feedbacks} onAddFeedback={(uid, t, s, c) => db.saveFeedback({id: Date.now(), userId: uid, type: t, subject: s, content: c, createdAt: new Date().toISOString(), status: 'Yeni'})} onUpdateStatus={(id, s) => db.saveFeedback({...feedbacks.find(f => f.id === id)!, status: s})} onRespond={(id, r) => db.saveFeedback({...feedbacks.find(f => f.id === id)!, status: 'Yanıtlandı', adminResponse: r, responseDate: new Date().toISOString()})} isResidentViewMode={forceResidentDashboard} />}
          {currentPage === 'plateInquiry' && <PlateInquiry users={users.length ? users : fallbackUsers} blocks={blocks} />}
          {currentPage === 'neighbors' && <Neighbors currentUser={currentUser} users={users.length ? users : fallbackUsers} blocks={blocks} connections={connections} messages={messages} onSendRequest={(req, res) => db.saveConnection({id: Date.now(), requesterId: req, receiverId: res, status: 'pending'})} onUpdateStatus={(id, s) => db.saveConnection({...connections.find(c => c.id === id)!, status: s})} onSendMessage={(s, r, c) => db.saveMessage({id: Date.now(), senderId: s, receiverId: r, content: c, timestamp: new Date().toISOString(), read: false})} />}
        </main>
      </div>
    </div>
  );
};

export default App;
