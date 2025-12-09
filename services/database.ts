
import { User, Block, Announcement, Dues, SiteInfo, NeighborConnection, ChatMessage, Feedback, Expense } from '../types';
import { users as seedUsers, mockBlocks as seedBlocks, mockAnnouncements as seedAnnouncements } from '../data/mockData';

// Veritabanı Anahtarları
const KEYS = {
  USERS: 'site_yonetim_users_v4', // Updated to v4 for new resident list
  BLOCKS: 'site_yonetim_blocks_v4', 
  ANNOUNCEMENTS: 'site_yonetim_announcements',
  DUES: 'site_yonetim_dues_v4', // Clear dues as user IDs changed
  SITE_INFO: 'site_yonetim_info',
  CONNECTIONS: 'site_yonetim_connections_v4',
  MESSAGES: 'site_yonetim_messages_v4',
  FEEDBACKS: 'site_yonetim_feedbacks',
  EXPENSES: 'site_yonetim_expenses'
};

// Varsayılan Site Bilgileri
const defaultSiteInfo: SiteInfo = {
    duesAmount: 500,
    bankName: 'Ziraat Bankası',
    iban: 'TR12 3456 7890 1234 5678 9000 00',
    note: 'Lütfen açıklama kısmına Blok ve Daire Numarası ve ilgili Ay bilgisini yazınız. Örneğin: A1 Blok Daire 10 Ekim Ayı'
};

// Varsayılan Aidat Verisi (Seed) - Empty initially as IDs changed
const seedDues: Dues[] = [];

// Helper: LocalStorage'dan veri çekme veya seed verisi kullanma
const loadFromStorage = <T>(key: string, seedData: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error(`Error loading key ${key}`, e);
    }
    // İlk kez çalışıyorsa veya hata varsa seed verisini kaydet
    localStorage.setItem(key, JSON.stringify(seedData));
    return seedData;
};

// Helper: LocalStorage'a veri yazma
const saveToStorage = <T>(key: string, data: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving key ${key}`, e);
    }
};

// Session Management
const SESSION_KEY = 'site_yonetim_session_user_id';
const saveSession = (userId: number | null) => {
    if (userId) localStorage.setItem(SESSION_KEY, String(userId));
    else localStorage.removeItem(SESSION_KEY);
};
const getSession = (): number | null => {
    const id = localStorage.getItem(SESSION_KEY);
    return id ? Number(id) : null;
};


// Veritabanı Servisi
export const db = {
    // --- Users ---
    getUsers: async (): Promise<User[]> => {
        return loadFromStorage(KEYS.USERS, seedUsers);
    },
    saveUsers: async (users: User[]): Promise<void> => {
        saveToStorage(KEYS.USERS, users);
    },

    // --- Blocks ---
    getBlocks: async (): Promise<Block[]> => {
        return loadFromStorage(KEYS.BLOCKS, seedBlocks);
    },
    saveBlocks: async (blocks: Block[]): Promise<void> => {
        saveToStorage(KEYS.BLOCKS, blocks);
    },

    // --- Announcements ---
    getAnnouncements: async (): Promise<Announcement[]> => {
        return loadFromStorage(KEYS.ANNOUNCEMENTS, seedAnnouncements);
    },
    saveAnnouncements: async (announcements: Announcement[]): Promise<void> => {
        saveToStorage(KEYS.ANNOUNCEMENTS, announcements);
    },

    // --- Dues ---
    getDues: async (): Promise<Dues[]> => {
        return loadFromStorage(KEYS.DUES, seedDues);
    },
    saveDues: async (dues: Dues[]): Promise<void> => {
        saveToStorage(KEYS.DUES, dues);
    },

    // --- Site Info ---
    getSiteInfo: async (): Promise<SiteInfo> => {
        return loadFromStorage(KEYS.SITE_INFO, defaultSiteInfo);
    },
    saveSiteInfo: async (info: SiteInfo): Promise<void> => {
        saveToStorage(KEYS.SITE_INFO, info);
    },

    // --- Connections (Neighbors) ---
    getConnections: async (): Promise<NeighborConnection[]> => {
        return loadFromStorage(KEYS.CONNECTIONS, []);
    },
    saveConnections: async (connections: NeighborConnection[]): Promise<void> => {
        saveToStorage(KEYS.CONNECTIONS, connections);
    },

    // --- Chat Messages ---
    getMessages: async (): Promise<ChatMessage[]> => {
        return loadFromStorage(KEYS.MESSAGES, []);
    },
    saveMessages: async (messages: ChatMessage[]): Promise<void> => {
        saveToStorage(KEYS.MESSAGES, messages);
    },

    // --- Feedbacks ---
    getFeedbacks: async (): Promise<Feedback[]> => {
        return loadFromStorage(KEYS.FEEDBACKS, []);
    },
    saveFeedbacks: async (feedbacks: Feedback[]): Promise<void> => {
        saveToStorage(KEYS.FEEDBACKS, feedbacks);
    },

    // --- Expenses ---
    getExpenses: async (): Promise<Expense[]> => {
        return loadFromStorage(KEYS.EXPENSES, []);
    },
    saveExpenses: async (expenses: Expense[]): Promise<void> => {
        saveToStorage(KEYS.EXPENSES, expenses);
    },

    // --- Session ---
    saveSession,
    getSession
};
