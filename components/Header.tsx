
import React, { useState, useRef, useEffect } from 'react';
import { Page, User } from '../types';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  toggleSidebar: () => void;
  currentUser: User;
  onLogout: () => void;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Anasayfa',
  dues: 'Aidat Takibi',
  announcements: 'Duyurular',
  users: 'Kullanıcı Yönetimi',
  expenses: 'Giderler',
  settings: 'Ayarlar',
  admin: 'Yönetim Paneli',
  blockManagement: 'Blok & Daire Yönetimi',
  profile: 'Profil Düzenleme',
  plateInquiry: 'Araç Plaka Sorgulama',
  duesManagement: 'Aidat Yönetimi',
  neighbors: 'Komşular',
  feedback: 'Öneri/Şikayet/İstek Formu'
};

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, toggleSidebar, currentUser, onLogout }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none md:hidden">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        {/* Mobile Home Button */}
        <button 
            onClick={() => setCurrentPage('dashboard')} 
            className="ml-3 text-gray-500 hover:text-indigo-600 focus:outline-none md:hidden"
            title="Anasayfa"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        </button>

        <h1 className="text-xl font-semibold text-gray-800 ml-4 md:ml-4">{pageTitles[currentPage]}</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 focus:outline-none">
           <span className="hidden md:block font-medium text-gray-700">{currentUser.name}</span>
           <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
        {isDropdownOpen && (
          <div className="absolute right-0 w-48 py-2 mt-2 bg-white rounded-md shadow-xl z-20">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('profile'); setDropdownOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profil</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Çıkış Yap</a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
