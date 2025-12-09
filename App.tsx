
import React, { useState, useCallback, useEffect } from 'react';
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
import { Page, User, Announcement, Block, Apartment, Dues as DuesType, SiteInfo, NeighborConnection, ChatMessage, Feedback, FeedbackType, Expense } from './types';
import { db } from './services/database';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dues, setDues] = useState<DuesType[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [connections, setConnections] = useState<NeighborConnection[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // UI States
  const [notification, setNotification] = useState<Announcement | null>(null);
  const [forceResidentDashboard, setForceResidentDashboard] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Reset Key
  const [dashboardKey, setDashboardKey] = useState(0);

  // Load Data from "Database" on Mount
  useEffect(() => {
    const initData = async () => {
        try {
            const [fetchedUsers, fetchedBlocks, fetchedAnnouncements, fetchedDues, fetchedInfo, fetchedConnections, fetchedMessages, fetchedFeedbacks, fetchedExpenses] = await Promise.all([
                db.getUsers(),
                db.getBlocks(),
                db.getAnnouncements(),
                db.getDues(),
                db.getSiteInfo(),
                db.getConnections(),
                db.getMessages(),
                db.getFeedbacks(),
                db.getExpenses()
            ]);

            setUsers(fetchedUsers);
            setBlocks(fetchedBlocks);
            setAnnouncements(fetchedAnnouncements);
            setDues(fetchedDues);
            setSiteInfo(fetchedInfo);
            setConnections(fetchedConnections);
            setMessages(fetchedMessages);
            setFeedbacks(fetchedFeedbacks);
            setExpenses(fetchedExpenses);

            // AUTO LOGIN
            // 1. Check for stored session
            const savedSessionId = db.getSession();
            let userToLogin = null;

            if (savedSessionId) {
                userToLogin = fetchedUsers.find(u => u.id === savedSessionId);
            }
            
            // 2. Fallback to default admin if no session or user not found
            if (!userToLogin && fetchedUsers.length > 0) {
                userToLogin = fetchedUsers.find(u => u.role === 'Yönetici') || fetchedUsers[0];
            }

            if (userToLogin && userToLogin.isActive) {
                setCurrentUser(userToLogin);
                db.saveSession(userToLogin.id); // Refresh session
            }

        } catch (error) {
            console.error("Veritabanı bağlantı hatası:", error);
            alert("Veriler yüklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    initData();
  }, []);

  // Security Check: If user becomes passive dynamically, log them out
  useEffect(() => {
      if (currentUser) {
          const currentDbUser = users.find(u => u.id === currentUser.id);
          if (currentDbUser && !currentDbUser.isActive) {
              handleLogout();
              alert("Hesabınız pasife alındığı için oturumunuz sonlandırıldı.");
          }
      }
  }, [users, currentUser]);

  // SYNC CurrentUser: Ensure the logged-in user object is always up-to-date with the main users array
  useEffect(() => {
      if (currentUser) {
          const freshUser = users.find(u => u.id === currentUser.id);
          // Verify strict inequality to prevent loops, though React handles object identity checks well
          if (freshUser && freshUser !== currentUser) {
              setCurrentUser(freshUser);
          }
      }
  }, [users, currentUser]);

  const handleLogin = (email: string, pass: string): boolean => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
        if (!user.isActive) {
            alert("Hesabınız pasif durumdadır. Lütfen yönetici ile iletişime geçiniz.");
            return false;
        }
        setCurrentUser(user);
        db.saveSession(user.id);
        setCurrentPage('dashboard');
        return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    db.saveSession(null);
  };
  
  const handleSetPage = (page: Page) => {
      setCurrentPage(page);
      if (page === 'dashboard') {
          setDashboardKey(prev => prev + 1);
      }
  };

  // User Management Handlers
  const handleAddUserAndAssignment = (user: Omit<User, 'id' | 'lastLogin' | 'isActive'>, assignment: { blockId: number | null, apartmentId: number | null }) => {
    const newUser = { ...user, id: Date.now(), lastLogin: 'Şimdi', isActive: true };
    
    // Update Users
    setUsers(prevUsers => {
        const updatedUsers = [...prevUsers, newUser];
        db.saveUsers(updatedUsers);
        return updatedUsers;
    });

    // Update Blocks if assigned
    if (assignment.blockId && assignment.apartmentId) {
        setBlocks(prevBlocks => {
            const updatedBlocks = prevBlocks.map(block => {
                if (block.id !== assignment.blockId) {
                    return block;
                }
                return {
                    ...block,
                    apartments: block.apartments.map(apt => {
                        if (apt.id !== assignment.apartmentId) {
                            return apt;
                        }
                        return { ...apt, status: 'Dolu' as const, residentId: newUser.id };
                    })
                };
            });
            db.saveBlocks(updatedBlocks);
            return updatedBlocks;
        });
    }
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    db.saveUsers(updatedUsers);
    // currentUser sync is handled by the useEffect above
  };

  const handleToggleUserStatus = (userId: number, isActive: boolean) => {
      // Prevent deactivating own account
      if (currentUser && currentUser.id === userId && !isActive) {
          alert("Kendi hesabınızı pasife alamazsınız.");
          return;
      }

      const targetId = Number(userId);

      // 1. Update User Status
      setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(u => u.id === targetId ? { ...u, isActive } : u);
          db.saveUsers(updatedUsers);
          return updatedUsers;
      });

      // 2. If deactivating (Passive), vacate their apartment
      if (!isActive) {
          setBlocks(prevBlocks => {
              const updatedBlocks = prevBlocks.map(block => {
                  // Check if this block has the user
                  const userInBlock = block.apartments.some(apt => apt.residentId === targetId);
                  
                  if (userInBlock) {
                      return {
                          ...block,
                          apartments: block.apartments.map(apt => {
                              if (apt.residentId === targetId) {
                                  return { ...apt, status: 'Boş' as const, residentId: undefined };
                              }
                              return apt;
                          })
                      };
                  }
                  return block;
              });
              
              db.saveBlocks(updatedBlocks);
              return updatedBlocks;
          });
      }
  };
  
  const handleUpdateUserAndAssignment = (updatedUser: User, assignment: { blockId: number | null, apartmentId: number | null }) => {
    // Update users state
    setUsers(prevUsers => {
        const newUsers = prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        db.saveUsers(newUsers);
        return newUsers;
    });
    
    // Update blocks state
    setBlocks(prevBlocks => {
        // Find user's original apartment
        let oldApartmentLocation: { blockId: number; apartmentId: number } | null = null;
        for (const block of prevBlocks) {
            const apt = block.apartments.find(a => a.residentId === updatedUser.id);
            if (apt) {
                oldApartmentLocation = { blockId: block.id, apartmentId: apt.id };
                break;
            }
        }

        const newBlocks = prevBlocks.map(block => {
            const isOldBlock = oldApartmentLocation?.blockId === block.id;
            const isNewBlock = assignment.blockId === block.id;

            if (!isOldBlock && !isNewBlock) return block;

            return {
                ...block,
                apartments: block.apartments.map(apt => {
                    // Case 1: Vacate old apartment
                    if (isOldBlock && apt.id === oldApartmentLocation?.apartmentId && (block.id !== assignment.blockId || apt.id !== assignment.apartmentId)) {
                        return { ...apt, status: 'Boş' as const, residentId: undefined };
                    }
                    // Case 2: Occupy new apartment
                    if (isNewBlock && apt.id === assignment.apartmentId) {
                        return { ...apt, status: 'Dolu' as const, residentId: updatedUser.id };
                    }
                    return apt;
                })
            };
        });
        db.saveBlocks(newBlocks);
        return newBlocks;
    });
  };

  // Block & Apartment Handlers
  const handleAddBlock = (name: string) => {
    const newBlock: Block = { id: Date.now(), name, apartments: [] };
    
    setBlocks(prev => {
        const updated = [...prev, newBlock];
        db.saveBlocks(updated);
        return updated;
    });
  };
  const handleUpdateBlock = (id: number, name: string) => {
    setBlocks(prev => {
        const updated = prev.map(b => b.id === id ? { ...b, name } : b);
        db.saveBlocks(updated);
        return updated;
    });
  };
  const handleDeleteBlock = (id: number) => {
    setBlocks(prev => {
        const updated = prev.filter(b => b.id !== id);
        db.saveBlocks(updated);
        return updated;
    });
  };
  
 const handleAddApartmentAndAssignment = (blockId: number, number: string, residentId?: number) => {
     const newApartment: Apartment = { 
        id: Date.now(), 
        number, 
        status: residentId ? 'Dolu' : 'Boş', 
        residentId: residentId 
    };
     
    setBlocks(prevBlocks => {
        // Step 1: If resident assigned, vacate old
        const blocksAfterVacating = residentId ? prevBlocks.map(b => ({
            ...b,
            apartments: b.apartments.map(apt => 
                apt.residentId === residentId ? { ...apt, status: 'Boş' as const, residentId: undefined } : apt
            )
        })) : prevBlocks;

        // Step 2: Add new apt
        const finalBlocks = blocksAfterVacating.map(b => 
            b.id === blockId ? { ...b, apartments: [...b.apartments, newApartment] } : b
        );
        
        db.saveBlocks(finalBlocks);
        return finalBlocks;
    });
 };

 const handleUpdateApartmentAndAssignment = (blockId: number, updatedApartment: Apartment) => {
    const newResidentId = updatedApartment.residentId;
    
    setBlocks(prevBlocks => {
        const blocksAfterVacating = prevBlocks.map(block => ({
            ...block,
            apartments: block.apartments.map(apt => {
                if (newResidentId && apt.residentId === newResidentId && (block.id !== blockId || apt.id !== updatedApartment.id)) {
                    return { ...apt, status: 'Boş' as const, residentId: undefined };
                }
                return apt;
            })
        }));

        const finalBlocks = blocksAfterVacating.map(block => {
            if (block.id === blockId) {
                return {
                    ...block,
                    apartments: block.apartments.map(apt => 
                        apt.id === updatedApartment.id ? updatedApartment : apt
                    )
                };
            }
            return block;
        });

        db.saveBlocks(finalBlocks);
        return finalBlocks;
    });
};

  const handleVacateApartment = (blockId: number, apartmentId: number) => {
    setBlocks(prevBlocks => {
        // Force type conversion for safety
        const bId = Number(blockId);
        const aId = Number(apartmentId);

        const finalBlocks = prevBlocks.map(b => {
            if (b.id !== bId) return b;
            return {
                ...b,
                apartments: b.apartments.map(apt => {
                    if (apt.id === aId) {
                        // STRICTLY set residentId to undefined and status to Boş
                        return { ...apt, status: 'Boş' as const, residentId: undefined };
                    }
                    return apt;
                })
            };
        });
        db.saveBlocks(finalBlocks);
        return finalBlocks;
    });
  };
  
  const handleDeleteApartment = (blockId: number, apartmentId: number) => {
     handleVacateApartment(blockId, apartmentId);
  };


  // Announcement Handlers
  const handleAddAnnouncement = (title: string, content: string) => {
    const newAnnouncement: Announcement = {
        id: Date.now(),
        title,
        content,
        date: new Date().toLocaleDateString('tr-TR'),
    };
    
    setAnnouncements(prev => {
        const updated = [newAnnouncement, ...prev];
        db.saveAnnouncements(updated);
        return updated;
    });
    setNotification(newAnnouncement);
  };

  const handleUpdateAnnouncement = (id: number, title: string, content: string) => {
      setAnnouncements(prev => {
          const updated = prev.map(a => a.id === id ? { ...a, title, content } : a);
          db.saveAnnouncements(updated);
          return updated;
      });
  };

  const handleDeleteAnnouncement = (id: number) => {
      setAnnouncements(prev => {
          const updated = prev.filter(a => a.id !== id);
          db.saveAnnouncements(updated);
          return updated;
      });
  };

  const handleDismissNotification = () => {
    setNotification(null);
  };

  // Dues Handler
  const handleUpdateDues = (userId: number, month: string, status: 'Ödendi' | 'Ödenmedi', amount: number) => {
    setDues(prevDues => {
        const existingDueIndex = prevDues.findIndex(d => d.userId === userId && d.month === month);
        let newDues = [...prevDues];

        if (existingDueIndex >= 0) {
            newDues[existingDueIndex] = { ...newDues[existingDueIndex], status };
        } else {
            newDues.push({ id: Date.now(), userId, month, amount, status });
        }
        
        db.saveDues(newDues);
        return newDues;
    });
  };

  // Site Info Handler
  const handleUpdateSiteInfo = (newInfo: SiteInfo) => {
      setSiteInfo(newInfo);
      db.saveSiteInfo(newInfo);
  }

  // Neighbor & Chat Handlers
  const handleSendConnectionRequest = (requesterId: number, receiverId: number) => {
      const newConnection: NeighborConnection = {
          id: Date.now(),
          requesterId,
          receiverId,
          status: 'pending'
      };
      
      setConnections(prev => {
          const updated = [...prev, newConnection];
          db.saveConnections(updated);
          return updated;
      });
  };

  const handleUpdateConnectionStatus = (connectionId: number, status: 'accepted' | 'rejected') => {
      setConnections(prev => {
          const updated = prev.map(c => c.id === connectionId ? { ...c, status } : c);
          db.saveConnections(updated);
          return updated;
      });
  };

  const handleSendMessage = (senderId: number, receiverId: number, content: string) => {
      const newMessage: ChatMessage = {
          id: Date.now(),
          senderId,
          receiverId,
          content,
          timestamp: new Date().toISOString(),
          read: false
      };
      
      setMessages(prev => {
          const updated = [...prev, newMessage];
          db.saveMessages(updated);
          return updated;
      });
  };

  // Feedback Handlers
  const handleAddFeedback = (userId: number, type: FeedbackType, subject: string, content: string) => {
      const newFeedback: Feedback = {
          id: Date.now(),
          userId,
          type,
          subject,
          content,
          createdAt: new Date().toISOString(),
          status: 'Yeni'
      };

      setFeedbacks(prev => {
          const updated = [newFeedback, ...prev];
          db.saveFeedbacks(updated);
          return updated;
      });
  };

  const handleUpdateFeedbackStatus = (id: number, status: 'Yeni' | 'Okundu' | 'Arşivlendi' | 'Yanıtlandı') => {
      setFeedbacks(prev => {
          const updated = prev.map(f => f.id === id ? { ...f, status } : f);
          db.saveFeedbacks(updated);
          return updated;
      });
  };

  const handleRespondToFeedback = (id: number, response: string) => {
      setFeedbacks(prev => {
          const updated = prev.map(f => f.id === id ? { 
              ...f, 
              adminResponse: response,
              responseDate: new Date().toISOString(),
              status: 'Yanıtlandı' 
          } : f);
          db.saveFeedbacks(updated);
          return updated;
      });
  };

  // Expense Handlers
  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
      const newExpense: Expense = { ...expense, id: Date.now() };
      setExpenses(prev => {
          const updated = [newExpense, ...prev];
          db.saveExpenses(updated);
          return updated;
      });
  };

  const handleDeleteExpense = (id: number) => {
      setExpenses(prev => {
          const updated = prev.filter(e => e.id !== id);
          db.saveExpenses(updated);
          return updated;
      });
  };
  
  const renderPage = () => {
    if (!currentUser || !siteInfo) return null;

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard 
            key={dashboardKey}
            currentUser={currentUser} 
            users={users} 
            blocks={blocks} 
            dues={dues} 
            announcements={announcements}
            siteInfo={siteInfo}
            setCurrentPage={handleSetPage}
            isResidentViewMode={forceResidentDashboard}
            feedbacks={feedbacks}
        />;
      case 'dues':
        return <Dues currentUser={currentUser} allDues={dues} />;
      case 'announcements':
        return <Announcements 
            announcements={announcements} 
            currentUser={currentUser}
            onUpdate={handleUpdateAnnouncement}
            onDelete={handleDeleteAnnouncement}
            isResidentViewMode={forceResidentDashboard}
        />;
      case 'users':
        return <Users 
          users={users} 
          blocks={blocks}
          onAddUserAndAssignment={handleAddUserAndAssignment}
          onUpdateUserAndAssignment={handleUpdateUserAndAssignment}
          onToggleUserStatus={handleToggleUserStatus}
        />;
      case 'expenses':
        return <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'settings':
        return <Settings 
            currentUser={currentUser} 
            onUpdateUser={handleUpdateUser} 
            setCurrentPage={handleSetPage} 
        />;
      case 'admin':
        return <AdminPanel 
            onAddAnnouncement={handleAddAnnouncement} 
            setCurrentPage={handleSetPage} 
            siteInfo={siteInfo}
            onUpdateSiteInfo={handleUpdateSiteInfo}
        />;
      case 'blockManagement':
        return <BlockManagement 
          blocks={blocks}
          users={users}
          onAddBlock={handleAddBlock}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onAddApartment={handleAddApartmentAndAssignment}
          onUpdateApartment={handleUpdateApartmentAndAssignment}
          onDeleteApartment={handleDeleteApartment}
          onVacateApartment={handleVacateApartment}
        />;
      case 'profile':
        return <ProfilePage currentUser={currentUser} onUpdateUser={handleUpdateUser} blocks={blocks} />;
      case 'plateInquiry':
        return <PlateInquiry users={users} blocks={blocks} />;
      case 'duesManagement':
        return <DuesManagement 
            users={users} 
            blocks={blocks} 
            allDues={dues} 
            siteInfo={siteInfo}
            onUpdateDues={handleUpdateDues} 
        />;
      case 'neighbors':
        return <Neighbors 
            currentUser={currentUser}
            users={users}
            blocks={blocks}
            connections={connections}
            messages={messages}
            onSendRequest={handleSendConnectionRequest}
            onUpdateStatus={handleUpdateConnectionStatus}
            onSendMessage={handleSendMessage}
        />;
      case 'feedback':
          return <FeedbackPage
              currentUser={currentUser}
              users={users}
              blocks={blocks}
              feedbacks={feedbacks}
              onAddFeedback={handleAddFeedback}
              onUpdateStatus={handleUpdateFeedbackStatus}
              onRespond={handleRespondToFeedback}
              isResidentViewMode={forceResidentDashboard}
          />;
      default:
        return <Dashboard 
            key={dashboardKey}
            currentUser={currentUser} 
            users={users} 
            blocks={blocks} 
            dues={dues} 
            announcements={announcements} 
            siteInfo={siteInfo}
            setCurrentPage={handleSetPage}
            isResidentViewMode={forceResidentDashboard}
            feedbacks={feedbacks}
        />;
    }
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-100">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600 font-medium">Veritabanına bağlanılıyor...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handleSetPage}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        onLogoDoubleClick={() => setForceResidentDashboard(prev => !prev)}
        isResidentViewMode={forceResidentDashboard}
        feedbacks={feedbacks}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {notification && (
            <div className="relative bg-indigo-600">
                <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
                    <div className="pr-16 sm:text-center sm:px-16">
                    <p className="font-medium text-white">
                        <span className="md:hidden">Yeni Duyuru!</span>
                        <span className="hidden md:inline">{notification.title}</span>
                        <span className="block sm:ml-2 sm:inline-block">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleSetPage('announcements'); handleDismissNotification(); }} className="text-white font-bold underline"> Detaylar &rarr;</a>
                        </span>
                    </p>
                    </div>
                    <div className="absolute inset-y-0 right-0 pt-1 pr-1 flex items-start sm:pt-1 sm:pr-2 sm:items-start">
                    <button type="button" onClick={handleDismissNotification} className="flex p-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white">
                        <span className="sr-only">Kapat</span>
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    </div>
                </div>
            </div>
        )}
        <Header 
          currentPage={currentPage}
          setCurrentPage={handleSetPage}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
