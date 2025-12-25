
export type UserRole = 'Yönetici' | 'Daire Sahibi' | 'Kiracı';

export type Page = 'dashboard' | 'dues' | 'announcements' | 'users' | 'expenses' | 'settings' | 'admin' | 'blockManagement' | 'profile' | 'plateInquiry' | 'duesManagement' | 'neighbors' | 'feedback';

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
  lastLogin: string;
  vehiclePlate1?: string;
  vehiclePlate2?: string;
  contactNumber1?: string;
  contactNumber2?: string;
  notificationPreferences?: NotificationPreferences;
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
  status: 'Boş' | 'Dolu';
  residentId?: number;
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
    isLoginActive?: boolean; // Yeni alan
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
}

export type FeedbackType = 'Şikayet' | 'Öneri' | 'İstek';

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
}
