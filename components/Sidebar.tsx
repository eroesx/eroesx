
import React, { useMemo, useRef } from 'react';
import { Page, User, UserRole, Feedback } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  currentUser: User;
  onLogoDoubleClick: () => void;
  isResidentViewMode?: boolean;
  feedbacks: Feedback[];
  onLogout: () => void;
}

// SVG Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MegaphoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 18.668 1.5 19 1.5v12c.332 0 .642.34 1.832.944A4.001 4.001 0 0118 18.5a4.001 4.001 0 01-2.564-1.183M15 6a3 3 0 100 6" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 13a5.995 5.995 0 003-1.197" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 018.618-3.04 11.955 11.955 0 018.618 3.04A12.02 12.02 0 0021 5.944a11.955 11.955 0 01-2.382-1.008z" /></svg>;
const BuildingOfficeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-8h1m-1 4h1m-1 4h1M9 3v1m6-1v1" /></svg>;
const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2v0" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, isActive, onClick, badge }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center justify-between px-4 py-3 text-gray-200 transition-colors duration-200 transform rounded-lg hover:bg-gray-700 ${
      isActive ? 'bg-gray-700 font-semibold' : ''
    }`}
  >
    <div className="flex items-center">
        {icon}
        <span className="mx-4">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
            {badge}
        </span>
    )}
  </a>
);

// Tüm olası navigasyon öğeleri burada tanımlanır.
const navItemDefinitions: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'Anasayfa', icon: <HomeIcon /> },
    { page: 'admin', label: 'Yönetim Paneli', icon: <ShieldCheckIcon /> },
    { page: 'blockManagement', label: 'Blok & Daire Yönetimi', icon: <BuildingOfficeIcon />},
    { page: 'plateInquiry', label: 'Araç Sorgulama', icon: <TruckIcon /> },
    { page: 'duesManagement', label: 'Aidat Takibi', icon: <CashIcon /> }, // Yöneticiler için analiz ekranı
    { page: 'dues', label: 'Aidat Geçmişim', icon: <CashIcon /> }, // Sakinler için kendi ödemeleri
    { page: 'neighbors', label: 'Komşular', icon: <ChatIcon /> },
    { page: 'announcements', label: 'Duyurular', icon: <MegaphoneIcon /> },
    { page: 'feedback', label: 'Öneri/Şikayet', icon: <ClipboardListIcon /> },
    { page: 'users', label: 'Kullanıcılar', icon: <UsersIcon /> },
    { page: 'expenses', label: 'Giderler', icon: <ChartBarIcon /> },
    { page: 'settings', label: 'Ayarlar', icon: <CogIcon /> },
];

// Rol tabanlı izinler bu yapılandırma nesnesinde yönetilir.
const rolePermissions: Record<UserRole, Page[]> = {
  'Yönetici': ['dashboard', 'admin', 'blockManagement', 'plateInquiry', 'duesManagement', 'neighbors', 'announcements', 'feedback', 'users', 'expenses', 'settings'],
  'Daire Sahibi': ['dashboard', 'announcements', 'neighbors', 'feedback', 'dues'],
  'Kiracı': ['dashboard', 'announcements', 'neighbors', 'feedback', 'dues'],
};

// Bu fonksiyon, mevcut kullanıcının rolüne göre navigasyon öğelerini filtreler.
const getNavItemsForRole = (role: UserRole): { page: Page; label: string; icon: React.ReactNode }[] => {
  const allowedPages = rolePermissions[role] || [];
  return navItemDefinitions.filter(item => allowedPages.includes(item.page));
};


const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setSidebarOpen, currentUser, onLogoDoubleClick, isResidentViewMode = false, feedbacks, onLogout }) => {
  
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    
    // Attempt to scroll main content to top
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }

  // Determine nav items
  let navItems = getNavItemsForRole(currentUser.role);

  // If Manager is in "Resident View Mode", filter out admin-specific pages from the sidebar
  if (currentUser.role === 'Yönetici' && isResidentViewMode) {
      const hiddenPages: Page[] = ['admin', 'blockManagement', 'users', 'expenses', 'settings', 'duesManagement'];
      navItems = navItems.filter(item => !hiddenPages.includes(item.page));
      // Show individual dues history in resident mode
      if (!navItems.some(i => i.page === 'dues')) {
          const duesItem = navItemDefinitions.find(i => i.page === 'dues');
          if (duesItem) navItems.push(duesItem);
      }
  }
  
  // Calculate unread feedbacks
  const unreadFeedbackCount = useMemo(() => {
      if (currentUser.role === 'Yönetici' && !isResidentViewMode) {
          // Admin sees 'Yeni' items
          return feedbacks.filter(f => f.status === 'Yeni').length;
      } else {
          // Residents see 'Yanıtlandı' items that are theirs
          return feedbacks.filter(f => f.userId === currentUser.id && f.status === 'Yanıtlandı').length;
      }
  }, [feedbacks, currentUser, isResidentViewMode]);

  const totalTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);

  const handleLogoClick = (e: React.MouseEvent) => {
      e.preventDefault();
      clickCount.current++;
      if (clickCount.current === 1) {
          totalTimeout.current = setTimeout(() => {
              if (clickCount.current === 1) {
                  handleNavigation('dashboard');
              } else {
                  onLogoDoubleClick();
              }
              clickCount.current = 0;
          }, 300);
      }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 px-4 py-8 space-y-8 bg-gray-800 border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div 
          className="flex flex-col items-center cursor-pointer select-none transition-transform hover:scale-105"
          onClick={handleLogoClick}
          title="Anasayfa'ya gitmek için tıklayın. Görünüm değiştirmek için çift tıklayın."
        >
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-500 rounded-full text-white">
             <BuildingIcon />
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">Site Yönetimi</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item) => {
             let badgeCount = 0;
             if (item.page === 'feedback') {
                 badgeCount = unreadFeedbackCount;
             }

             return (
                <NavLink
                key={item.page}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.page}
                onClick={() => handleNavigation(item.page)}
                badge={badgeCount}
                />
             );
          })}
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="pt-4 border-t border-gray-700">
            <button
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 text-gray-400 transition-colors duration-200 transform rounded-lg hover:bg-red-900/30 hover:text-red-400 group"
            >
                <div className="flex items-center">
                    <LogoutIcon />
                    <span className="mx-4 font-medium">Çıkış Yap</span>
                </div>
            </button>
        </div>
        
      </aside>
    </>
  );
};

export default Sidebar;
