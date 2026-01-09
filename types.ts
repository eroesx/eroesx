
export type UserRole = 'Yönetici' | 'Daire Sahibi' | 'Kiracı' | 'Denetçi';

export type Page = 'dashboard' | 'dues' | 'announcements' | 'users' | 'expenses' | 'settings' | 'admin' | 'blockManagement' | 'profile' | 'plateInquiry' | 'duesManagement' | 'neighbors' | 'feedback' | 'cashManagement' | 'reports' | 'allUsers';

export interface NotificationPreferences {
    emailNotifications: boolean;
    smsNotifications: boolean;
    newAnnouncements: boolean;
    duesReminders: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Mock login için
  role: UserRole;
  isActive: boolean; // New field for account status
  isDuesExempt?: boolean; // Aidat ödemez çeki
  lastLogin: string;
  vehiclePlate1?: string;
  vehiclePlate2?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  notificationPreferences?: NotificationPreferences;
  needsPasswordChange?: boolean; // Şifre değiştirme zorunluluğu
  kvkkApproved?: boolean; // KVKK onay durumu
  kvkkApprovalDate?: string; // KVKK onay tarihi
  paymentAliases?: string[]; // Banka açıklamalarında geçen alternatif isimler (örn: Eşinin adı)
}

export interface Dues {
    id: number;
    month: string; // e.g., "Mart 2024"
    amount: number;
    status: 'Ödendi' | 'Ödenmedi';
    userId: number;
}

export interface Expense {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    description?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

export interface Apartment {
  id: number;
  number: string;
  floor?: string; // Manuel kat bilgisi
  status: 'Boş' | 'Dolu';
  residentId?: number;
  isSpecial?: boolean; // Özel daire işareti
  description?: string; // Daire açıklaması
  customDuesAmount?: number; // Bu daireye özel aidat tutarı
}

export interface Block {
  id: number;
  name: string;
  apartments: Apartment[];
}

export interface SiteInfo {
    duesAmount: number;
    iban: string;
    bankName: string;
    note: string;
    isLoginActive?: boolean; 
    initialBalance?: number; // Kasadaki devreden/başlangıç tutarı
    pastDebtLookbackYears?: number; // Geçmiş borç hesaplaması için geriye dönük yıl sayısı
    showLoginDuesModal?: boolean; // Girişte aidat hatırlatma popup'ı gösterilsin mi?
    // Excel Import Config
    importStartRow?: number;
    importDateCol?: string;
    importAmountCol?: string;
    importDescCol?: string;
    // System Version
    systemVersion?: string;
}

export interface NeighborConnection {
    id: number;
    requesterId: number;
    receiverId: number;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string; // ISO string
    read: boolean;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
}

export type FeedbackType = 'Şikayet' | 'Öneri' | 'İstek' | 'İtiraz';

export interface Feedback {
    id: number;
    userId: number;
    type: FeedbackType;
    subject: string;
    content: string;
    createdAt: string;
    status: 'Yeni' | 'Okundu' | 'Arşivlendi' | 'Yanıtlandı';
    adminResponse?: string;
    responseDate?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
}
