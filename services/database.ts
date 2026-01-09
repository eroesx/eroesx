
import { firestore } from './firebase';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    query, 
    onSnapshot,
    orderBy,
    limit,
    writeBatch,
    deleteDoc,
    getDoc
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
    MESSAGES: 'messages',
    IMPORT_RECORDS: 'import_records',
    IMPORT_HISTORY: 'import_history'
};

const DEFAULT_SITE_INFO: SiteInfo = {
    duesAmount: 500,
    bankName: "Site Yönetim Bankası",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    note: "Ödeme yaparken daire numaranızı belirtiniz.",
    isLoginActive: false,
    initialBalance: 0,
    pastDebtLookbackYears: 2, // Varsayılan olarak son 2 yılı kontrol et
    showLoginDuesModal: true, // Varsayılan olarak girişte hatırlat
    systemVersion: "v1.6.0" // Varsayılan sistem versiyonu
};

// Helper function to check if value is a plain object to avoid recursing into internal SDK objects or DOM elements
const isPlainObject = (val: any) => !!val && typeof val === 'object' && Object.getPrototypeOf(val) === Object.prototype;

// Helper function to remove undefined fields recursively and safely
const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    
    // Pass Dates and other common serializables through
    if (obj instanceof Date) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item));
    }
    
    if (isPlainObject(obj)) {
        const newObj: any = {};
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            if (val !== undefined) {
                newObj[key] = removeUndefined(val);
            }
        });
        return newObj;
    }
    
    return obj;
};

export const db = {
    subscribeToUsers: (callback: (users: User[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.USERS), (snapshot) => {
            if (snapshot.empty) {
                callback([]); // Boşsa boş dizi dön (Mock veriyi App.tsx'te seed ile yükleyeceğiz)
            } else {
                const users = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { ...data, id: Number(doc.id) } as User;
                });
                callback(users);
            }
        }, (error) => {
            console.error("Firestore Users Error:", error);
            callback([]);
        });
    },

    subscribeToBlocks: (callback: (blocks: Block[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.BLOCKS), (snapshot) => {
            if (snapshot.empty) callback([]);
            else callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Block)));
        }, (err) => callback([]));
    },

    subscribeToAnnouncements: (callback: (announcements: Announcement[]) => void) => {
        const q = query(collection(firestore, COLLECTIONS.ANNOUNCEMENTS), orderBy("date", "desc"));
        return onSnapshot(q, (snapshot) => {
            if (snapshot.empty) callback([]);
            else callback(snapshot.docs.map(doc => ({ ...doc.data(), id: Number(doc.id) } as Announcement)));
        }, (err) => callback([]));
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
    
    // --- Excel Import Persistence ---
    subscribeToImportRecords: (callback: (records: any[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.IMPORT_RECORDS), (snapshot) => {
            callback(snapshot.docs.map(doc => doc.data()));
        });
    },

    setImportRecords: async (records: any[]) => {
        const collRef = collection(firestore, COLLECTIONS.IMPORT_RECORDS);
        
        // 1. Delete all existing documents in import_records (full replace logic for state sync)
        const existingDocs = await getDocs(collRef);
        const deleteBatch = writeBatch(firestore);
        existingDocs.forEach(docSnap => deleteBatch.delete(docSnap.ref));
        await deleteBatch.commit();

        if (records.length === 0) return;

        // 2. Add new documents
        const addBatch = writeBatch(firestore);
        records.forEach(record => {
            const docRef = doc(collRef, record.id); // Use the existing string ID from the record
            addBatch.set(docRef, removeUndefined(record));
        });
        await addBatch.commit();
    },

    subscribeToImportHistory: (callback: (records: any[]) => void) => {
        return onSnapshot(collection(firestore, COLLECTIONS.IMPORT_HISTORY), (snapshot) => {
            callback(snapshot.docs.map(doc => doc.data()));
        });
    },

    addImportHistoryRecords: async (records: any[]) => {
        const batch = writeBatch(firestore);
        const collRef = collection(firestore, COLLECTIONS.IMPORT_HISTORY);
        records.forEach(record => {
            const docRef = doc(collRef, record.id || `hist_${Date.now()}_${Math.random()}`);
            batch.set(docRef, removeUndefined(record));
        });
        await batch.commit();
    },
    // -------------------------------

    subscribeToSiteInfo: (callback: (info: SiteInfo) => void) => {
        return onSnapshot(doc(firestore, COLLECTIONS.SITE_INFO, 'main'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as SiteInfo;
                // Merge with default to ensure new fields like systemVersion are present if missing in DB
                callback({ ...DEFAULT_SITE_INFO, ...data });
            } else {
                callback(DEFAULT_SITE_INFO);
            }
        }, (err) => callback(DEFAULT_SITE_INFO));
    },

    saveUser: async (user: User) => {
        await setDoc(doc(firestore, COLLECTIONS.USERS, String(user.id)), removeUndefined(user));
    },

    deleteUser: async (id: number) => {
        await deleteDoc(doc(firestore, COLLECTIONS.USERS, String(id)));
    },

    saveBlock: async (block: Block) => {
        await setDoc(doc(firestore, COLLECTIONS.BLOCKS, String(block.id)), removeUndefined(block));
    },

    deleteBlock: async (id: number) => {
        await deleteDoc(doc(firestore, COLLECTIONS.BLOCKS, String(id)));
    },

    saveAnnouncement: async (a: Announcement) => {
        await setDoc(doc(firestore, COLLECTIONS.ANNOUNCEMENTS, String(a.id)), removeUndefined(a));
    },

    deleteAnnouncement: async (id: number) => {
        await deleteDoc(doc(firestore, COLLECTIONS.ANNOUNCEMENTS, String(id)));
    },

    saveDue: async (d: Dues) => {
        await setDoc(doc(firestore, COLLECTIONS.DUES, String(d.id)), removeUndefined(d));
    },

    saveExpense: async (e: Expense) => {
        await setDoc(doc(firestore, COLLECTIONS.EXPENSES, String(e.id)), removeUndefined(e));
    },

    deleteExpense: async (id: number) => {
        await deleteDoc(doc(firestore, COLLECTIONS.EXPENSES, String(id)));
    },

    saveFeedback: async (f: Feedback) => {
        await setDoc(doc(firestore, COLLECTIONS.FEEDBACKS, String(f.id)), removeUndefined(f));
    },

    saveConnection: async (c: NeighborConnection) => {
        await setDoc(doc(firestore, COLLECTIONS.CONNECTIONS, String(c.id)), removeUndefined(c));
    },

    deleteConnection: async (id: number) => {
        await deleteDoc(doc(firestore, COLLECTIONS.CONNECTIONS, String(id)));
    },

    saveMessage: async (m: ChatMessage) => {
        await setDoc(doc(firestore, COLLECTIONS.MESSAGES, String(m.id)), removeUndefined(m));
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
            return { ...DEFAULT_SITE_INFO, ...(d.docs[0].data() as SiteInfo) };
        } catch (e) {
            return DEFAULT_SITE_INFO;
        }
    },

    saveSiteInfo: async (info: SiteInfo) => {
        await setDoc(doc(firestore, COLLECTIONS.SITE_INFO, 'main'), removeUndefined(info));
    },

    clearCollections: async (collectionsToClear: string[]) => {
        const keys = collectionsToClear.map(k => {
             if (k === 'import_records') return COLLECTIONS.IMPORT_RECORDS;
             if (k === 'import_history') return COLLECTIONS.IMPORT_HISTORY;
             return (COLLECTIONS as any)[k.toUpperCase()];
        }).filter(Boolean);
        for (const collName of keys) {
            const q = query(collection(firestore, collName));
            const snapshot = await getDocs(q);
            const batch = writeBatch(firestore);
            snapshot.docs.forEach((docSnap) => {
                if (collName === COLLECTIONS.USERS && docSnap.id === '1') return;
                batch.delete(docSnap.ref);
            });
            await batch.commit();
        }
    },

    getAllData: async () => {
        const backupData: { [key: string]: any } = {};
        for (const collName of Object.values(COLLECTIONS)) {
            if (collName === COLLECTIONS.SITE_INFO) {
                const docRef = doc(firestore, COLLECTIONS.SITE_INFO, 'main');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    backupData[collName] = docSnap.data();
                }
            } else {
                const querySnapshot = await getDocs(collection(firestore, collName));
                backupData[collName] = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            }
        }
        return backupData;
    },

    restoreAllData: async (data: { [key: string]: any }) => {
        const collectionsInBackup = Object.keys(data);
        const collectionKeysToClear = collectionsInBackup.map(collectionName => {
            const key = Object.keys(COLLECTIONS).find(k => (COLLECTIONS as any)[k] === collectionName);
            return key ? key.toLowerCase() : '';
        }).filter(Boolean);
        
        await db.clearCollections(collectionKeysToClear);
    
        const batch = writeBatch(firestore);
        for (const [collectionName, documents] of Object.entries(data)) {
            if (collectionName === COLLECTIONS.SITE_INFO && documents && typeof documents === 'object' && !Array.isArray(documents)) {
                 const docRef = doc(firestore, COLLECTIONS.SITE_INFO, 'main');
                 batch.set(docRef, removeUndefined(documents));
            } else if (Array.isArray(documents)) {
                 documents.forEach((docData: any) => {
                     const docId = String(docData.id);
                     if (docId) {
                         const docRef = doc(firestore, collectionName, docId);
                         batch.set(docRef, removeUndefined(docData));
                     }
                 });
            }
        }
        await batch.commit();
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
