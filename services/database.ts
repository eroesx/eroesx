
import { firestore } from './firebase';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    setDoc, 
    query, 
    onSnapshot,
    orderBy,
    limit,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { User, Block, Announcement, Dues, SiteInfo, Feedback, Expense, NeighborConnection, ChatMessage } from '../types';
import { users as mockUsers, mockBlocks, mockAnnouncements } from '../data/mockData';

const COLLECTIONS = {
    USERS: 'users',
    BLOCKS: 'blocks',
    ANNOUNCEMENTS: 'announcements',
    DUES: 'dues',
    SITE_INFO: 'site_info',
    EXPENSES: 'expenses',
    FEEDBACKS: 'feedbacks',
    CONNECTIONS: 'connections',
    MESSAGES: 'messages'
};

const DEFAULT_SITE_INFO: SiteInfo = {
    duesAmount: 500,
    bankName: "Site Yönetim Bankası",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    note: "Ödeme yaparken daire numaranızı belirtiniz.",
    isLoginActive: false
};

const clean = (data: any) => {
    const cleaned = JSON.parse(JSON.stringify(data));
    if (cleaned.id) cleaned.id = Number(cleaned.id);
    return cleaned;
};

export const db = {
    subscribeToUsers: (callback: (users: User[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.USERS), (snapshot) => {
            if (snapshot.empty) {
                callback(mockUsers);
            } else {
                const users = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, id: Number(doc.id) } as User;
                });
                callback(users);
            }
        }, (error) => {
            console.error("Firestore Users Error:", error);
            callback(mockUsers);
        });
    },

    subscribeToBlocks: (callback: (blocks: Block[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.BLOCKS), (snapshot) => {
            if (snapshot.empty) callback(mockBlocks);
            else callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Block)));
        }, (err) => callback(mockBlocks));
    },

    subscribeToAnnouncements: (callback: (announcements: Announcement[]) => void) => {
        const q = query(collection(firestore, COLLECTIONS.ANNOUNCEMENTS), orderBy("date", "desc"));
        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) callback(mockAnnouncements);
            else callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Announcement)));
        }, (err) => callback(mockAnnouncements));
    },

    subscribeToDues: (callback: (dues: Dues[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.DUES), (snapshot) => {
            callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Dues)));
        });
    },

    subscribeToExpenses: (callback: (expenses: Expense[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.EXPENSES), (snapshot) => {
            callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Expense)));
        });
    },

    subscribeToFeedbacks: (callback: (feedbacks: Feedback[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.FEEDBACKS), (snapshot) => {
            callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Feedback)));
        });
    },

    subscribeToConnections: (callback: (conn: NeighborConnection[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.CONNECTIONS), (snapshot) => {
            callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as NeighborConnection)));
        });
    },

    subscribeToMessages: (callback: (msg: ChatMessage[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.MESSAGES), (snapshot) => {
            callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as ChatMessage)));
        });
    },

    subscribeToSiteInfo: (callback: (info: SiteInfo) => void) => {
        return onSnapshot(doc(firestore, COLLECTIONS.SITE_INFO, 'main'), (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as SiteInfo);
            } else {
                callback(DEFAULT_SITE_INFO);
            }
        }, (err) => callback(DEFAULT_SITE_INFO));
    },

    saveUser: async (user: User) => {
        await setDoc(doc(firestore, COLLECTIONS.USERS, String(user.id)), clean(user));
    },

    deleteUser: async (id: number) => {
        await deleteDoc(doc(firestore, COLLECTIONS.USERS, String(id)));
    },

    saveBlock: async (block: Block) => {
        await setDoc(doc(firestore, COLLECTIONS.BLOCKS, String(block.id)), clean(block));
    },

    saveAnnouncement: async (a: Announcement) => {
        await setDoc(doc(firestore, COLLECTIONS.ANNOUNCEMENTS, String(a.id)), clean(a));
    },

    saveDue: async (d: Dues) => {
        await setDoc(doc(firestore, COLLECTIONS.DUES, String(d.id)), clean(d));
    },

    saveExpense: async (e: Expense) => {
        await setDoc(doc(firestore, COLLECTIONS.EXPENSES, String(e.id)), clean(e));
    },

    saveFeedback: async (f: Feedback) => {
        await setDoc(doc(firestore, COLLECTIONS.FEEDBACKS, String(f.id)), clean(f));
    },

    saveConnection: async (c: NeighborConnection) => {
        await setDoc(doc(firestore, COLLECTIONS.CONNECTIONS, String(c.id)), clean(c));
    },

    saveMessage: async (m: ChatMessage) => {
        await setDoc(doc(firestore, COLLECTIONS.MESSAGES, String(m.id)), clean(m));
    },

    saveUsers: async (users: User[]) => {
        for (const user of users) await db.saveUser(user);
    },

    saveBlocks: async (blocks: Block[]) => {
        for (const block of blocks) await db.saveBlock(block);
    },

    saveAnnouncements: async (announcements: Announcement[]) => {
        for (const a of announcements) await db.saveAnnouncement(a);
    },

    saveDues: async (dues: Dues[]) => {
        for (const d of dues) await db.saveDue(d);
    },

    getSiteInfo: async (): Promise<SiteInfo> => {
        try {
            const d = await getDocs(query(collection(firestore, COLLECTIONS.SITE_INFO), limit(1)));
            if (d.empty) return DEFAULT_SITE_INFO;
            return d.docs[0].data() as SiteInfo;
        } catch (e) {
            return DEFAULT_SITE_INFO;
        }
    },

    saveSiteInfo: async (info: SiteInfo) => {
        await setDoc(doc(firestore, COLLECTIONS.SITE_INFO, 'main'), clean(info));
    },

    clearCollections: async (collectionsToClear: string[]) => {
        const keys = collectionsToClear.map(k => (COLLECTIONS as any)[k.toUpperCase()]).filter(Boolean);
        for (const collName of keys) {
            const q = query(collection(firestore, collName));
            const snapshot = await getDocs(q);
            const batch = writeBatch(firestore);
            snapshot.docs.forEach((docSnap) => {
                // Yönetici hesabını (ID: 1) koru
                if (collName === COLLECTIONS.USERS && docSnap.id === '1') return;
                batch.delete(docSnap.ref);
            });
            await batch.commit();
        }
    },

    seedDatabase: async (data: { users: User[], blocks: Block[], announcements: Announcement[] }) => {
        console.log("Seeding started...");
        await db.saveUsers(data.users);
        await db.saveBlocks(data.blocks);
        await db.saveAnnouncements(data.announcements);
        await db.saveSiteInfo(DEFAULT_SITE_INFO);
        console.log("Seeding completed.");
    },

    saveSession: (id: number | null) => {
        if (id) localStorage.setItem('fb_session_id', String(id));
        else localStorage.removeItem('fb_session_id');
    },

    getSession: () => {
        const id = localStorage.getItem('fb_session_id');
        return id ? Number(id) : null;
    }
};
