
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Block, Dues, SiteInfo, Page } from '../types';
import { db } from '../services/database';
import { UserModal } from './Users';

// Global variable access for SheetJS (loaded via script tag)
declare const XLSX: any;

interface DuesManagementProps {
    users: User[];
    blocks: Block[];
    allDues: Dues[];
    siteInfo: SiteInfo;
    onUpdateDues: (userId: number, month: string, status: 'Ödendi' | 'Ödenmedi', amount: number) => void;
    onUpdateSiteInfo?: (info: SiteInfo) => void;
    setCurrentPage?: (page: Page) => void;
    onUpdateUserAndAssignment?: (user: User, assignment: { blockId: number | null, apartmentId: number | null }) => void;
}

interface ExcelMatch {
    id: string;
    detectedUser: { id: number; name: string } | null; // Sanitized for storage
    detectedLocation: string;
    description: string;
    date: string;
    amount: number;
    selected: boolean;
    warning?: string;
    matchType?: string;
    priority: number; // 1: Yeşil (Tam), 2: Mavi (İsim), 3: Mavi (Konum), 4: Sarı (Mükerrer), 5: Kırmızı (Hatalı/Yok)
    importedMonth?: string; // Hangi dönem için aktarıldığı
    sourceFile?: string; // Hangi dosyadan geldiği
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
    'TE': 'Tam Eşleşme: İsim ve Tutar doğrulandı.',
    'KE': 'Konum Eşleşmesi: Blok/Daire eşleşti, İsim tam eşleşmedi.',
    'FT': 'Farklı Tutar: Ödeme tutarı beklenen aidat tutarından farklı.',
    'MK': 'Mükerrer Kayıt: Aynı kişiye ait birden fazla işlem tespit edildi.',
    'EY': 'Eşleşme Yok: Sistemde kayıtlı isim veya konum bulunamadı.',
    'İE': 'İsim Eşleşmesi (Eski Kayıt): Lütfen listeyi temizleyip tekrar yükleyiniz.'
};

// --- Helper Functions for Enhanced Matching ---

const normalizeText = (text: string): string => {
    return text
        .toLocaleLowerCase('tr-TR')
        .replace(/[.,/\\-]/g, ' ') // Noktalama işaretlerini boşluk yap
        .replace(/\s+/g, ' ')      // Çoklu boşlukları tek yap
        .trim();
};

const transliterate = (text: string): string => {
    const map: { [key: string]: string } = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
        'I': 'i' // Handle dotless I as i for comparison
    };
    return text.replace(/[çğıöşüÇĞİÖŞÜI]/g, (char) => map[char] || char);
};

const createFlexibleRegex = (text: string): string => {
    // Escape standard regex chars
    let safe = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Make Turkish chars flexible [iıİI] matches any variation
    safe = safe.replace(/[iıİI]/g, '[iıİI]');
    safe = safe.replace(/[gğGĞ]/g, '[gğGĞ]');
    safe = safe.replace(/[uüUÜ]/g, '[uüUÜ]');
    safe = safe.replace(/[oöOÖ]/g, '[oöOÖ]');
    safe = safe.replace(/[sşSŞ]/g, '[sşSŞ]');
    safe = safe.replace(/[cçCÇ]/g, '[cçCÇ]');
    return safe;
};

const extractBlockFromDesc = (desc: string): string | null => {
    // Matches A1, A 1, A/1, A.1, A-1 etc.
    const blockRegex = /\b([A-C])\s*[./\\-]*\s*([1-2])\b/i;
    const match = desc.match(blockRegex);
    if (match) {
        return (match[1] + match[2]).toUpperCase();
    }
    return null;
};

const extractAptNumFromDesc = (desc: string): string | null => {
    const text = desc.toLocaleLowerCase('tr-TR');
    // Match patterns like: daire 2, d:3, no:35, d2, /26, 27 nolu
    const patterns = [
        /(?:daire|no|kapı|d|n|k)\s*[./\\-]*\s*(\d+)\b/i, // Daire 2, No:35, D:4
        /\b(\d+)\s*(?:nolu|nolu|daire|nolu daire)\b/i,    // 27 nolu, 5 daire
        /\/(\d+)\b/,                                     // /26
        /\b([a-c][1-2])\s*(\d+)\b/i                      // B2 15 (Block then number)
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            // Pattern 4 has 2 groups, we need group 2
            return match[pattern === patterns[3] ? 2 : 1];
        }
    }

    // Last resort: If we find a block and there is a number right after it
    const blockMatch = extractBlockFromDesc(text);
    if (blockMatch) {
        const parts = text.split(new RegExp(blockMatch, 'i'));
        if (parts.length > 1) {
            const afterBlock = parts[1].trim();
            const simpleNum = afterBlock.match(/^(\d+)\b/);
            if (simpleNum) return simpleNum[1];
        }
    }

    return null;
};

const columnLetterToIndex = (letter: string): number => {
    if (!letter) return 0;
    const cleanLetter = letter.trim().toUpperCase();
    if (cleanLetter.length === 1) return cleanLetter.charCodeAt(0) - 65;
    if (cleanLetter.length === 2) {
        return (cleanLetter.charCodeAt(0) - 64) * 26 + (cleanLetter.charCodeAt(1) - 65);
    }
    return 0;
};

const calculateFloorFallback = (blockName: string, aptNumber: string): string => {
    const num = parseInt(aptNumber);
    if (isNaN(num)) return '-';
    const block = blockName.toUpperCase().replace(/\s/g, '');

    if (block === 'A1') {
        if (num === 1) return '0';
        return Math.ceil((num - 1) / 2).toString();
    }
    if (block === 'A2' || block === 'B1') {
        return Math.ceil(num / 2).toString();
    }
    if (block === 'B2') {
        if (num === 1) return '0';
        return Math.ceil((num - 1) / 2).toString();
    }
    if (block === 'C1' || block === 'C2') {
        return (Math.ceil(num / 2) + 1).toString();
    }
    return '-';
};

const highlightText = (text: string, detectedName?: string) => {
    if (!text) return text;
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const partsToMatch = [...months];
    let nameRegexPart = '';

    if (detectedName) {
        // Clean the name for regex generation (remove extra spaces)
        const cleanName = detectedName.trim().replace(/\s+/g, ' ');
        nameRegexPart = createFlexibleRegex(cleanName);
    }

    // Build main regex: (Month1|Month2|...|FlexibleNameRegex)
    const pattern = `(${partsToMatch.join('|')}${nameRegexPart ? '|' + nameRegexPart : ''})`;
    const regex = new RegExp(pattern, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
        const isMonth = months.some(m => m.toLocaleLowerCase('tr-TR') === part.toLocaleLowerCase('tr-TR'));
        
        // Check if this part matches the name fuzzily using transliteration check for safety
        // or re-test with the flexible regex to confirm it's the name part
        let isName = false;
        if (detectedName && !isMonth) {
             const partClean = normalizeText(part);
             const nameClean = normalizeText(detectedName);
             // Use regex check for robustness
             const partRegex = new RegExp(`^${createFlexibleRegex(nameClean)}$`, 'i');
             // Also simple includes check after transliteration
             if (transliterate(partClean) === transliterate(nameClean) || partRegex.test(part)) {
                 isName = true;
             }
        }

        if (isName) {
            return (
                <span key={i} className="font-black text-gray-900 underline decoration-2 decoration-gray-800 underline-offset-2 bg-yellow-100/80 rounded px-1 shadow-sm border border-yellow-200/50">
                    {part}
                </span>
            );
        } else if (isMonth) {
            return (
                <span key={i} className="font-black underline decoration-indigo-500 text-indigo-800 underline-offset-2 bg-indigo-50/50 rounded px-0.5">
                    {part}
                </span>
            );
        }
        return part;
    });
};

const checkDateMatch = (dateStr: string, targetMonthIdx: number, targetYear: number): boolean => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return false;
    
    // Date string generated by manually formatted string is DD.MM.YYYY
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    return (month === targetMonthIdx + 1) && (year === targetYear);
};

// --- Manual User Selection Modal ---
const UserSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    blocks: Block[];
    onSelect: (user: User) => void;
}> = ({ isOpen, onClose, users, blocks, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users.slice(0, 10);
        const lowerTerm = searchTerm.toLocaleLowerCase('tr-TR');
        return users.filter(u => {
            if (u.role === 'Yönetici') return false;
            if (u.name.toLocaleLowerCase('tr-TR').includes(lowerTerm)) return true;
            const block = blocks.find(b => b.apartments.some(a => a.residentId === u.id));
            if (block) {
                const apt = block.apartments.find(a => a.residentId === u.id);
                const locationStr = `${block.name} ${apt?.number}`.toLocaleLowerCase('tr-TR');
                if (locationStr.includes(lowerTerm)) return true;
            }
            return false;
        }).slice(0, 20);
    }, [users, blocks, searchTerm]);

    const getUserLocation = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) return `${block.name} - Daire: ${apt.number}`;
        }
        return 'Konum Atanmamış';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Sakin Seçimi</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-5">
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="İsim, Blok veya Daire No ile ara..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm mb-4"
                    />
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                        {filteredUsers.map(user => (
                            <button 
                                key={user.id} 
                                onClick={() => onSelect(user)}
                                className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all group text-left"
                            >
                                <div>
                                    <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{user.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{getUserLocation(user.id)}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        ))}
                        {filteredUsers.length === 0 && (
                            <p className="text-center text-xs text-gray-400 font-bold py-4">Kayıt bulunamadı.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// User Details Modal Component
const UserDuesDetailModal: React.FC<{
    user: { id: number; name: string };
    onClose: () => void;
    allDues: Dues[];
    siteInfo: SiteInfo;
    onUpdateDues: (userId: number, month: string, status: 'Ödendi' | 'Ödenmedi', amount: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    isCorrectionMode?: boolean;
    correctionRecordData?: ExcelMatch | null;
    onCorrect?: (userId: number, months: string[], amountPerMonth: number, record: ExcelMatch) => Promise<void>;
    blocks: Block[];
    users: User[];
    onEditUser?: () => void;
    onChangeUser?: () => void; // New prop for swapping user
    onAddAlias?: (userId: number, alias: string) => void;
}> = ({ user, onClose, allDues, siteInfo, onUpdateDues, selectedYear, setSelectedYear, isCorrectionMode = false, correctionRecordData = null, onCorrect, blocks, users, onEditUser, onChangeUser, onAddAlias }) => {
    const currentYear = new Date().getFullYear();
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const currentMonthIdx = new Date().getMonth();

    const [manualYear, setManualYear] = useState(currentYear);
    const [manualMonth, setManualMonth] = useState(months[0]);
    const [manualAmount, setManualAmount] = useState(siteInfo.duesAmount);
    const [isAllYear, setIsAllYear] = useState(false);
    const [isManualAddVisible, setIsManualAddVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    
    // Extra/Missing Payment States
    const [extraPayment, setExtraPayment] = useState<string>('');
    const [missingPayment, setMissingPayment] = useState<string>('');

    // Alias State
    const [detectedAlias, setDetectedAlias] = useState('');
    const [isAliasSaved, setIsAliasSaved] = useState(false);

    useEffect(() => {
        if (isCorrectionMode && correctionRecordData) {
            // Regex to find content before "hesabından". 
            // Matches: [Something] hesabından
            // Use non-greedy capturing group to get content before the keyword
            const regex = /(?:nolu\s+|"|')?([^"']{3,}?)(?:"|')?\s+hesabından/i;
            const match = correctionRecordData.description.match(regex);
            
            if (match && match[1]) {
                setDetectedAlias(match[1].trim());
            } else {
                setDetectedAlias('');
            }
            setIsAliasSaved(false);
            setExtraPayment('');
            setMissingPayment('');
        }
    }, [isCorrectionMode, correctionRecordData]);

    const targetMonthCount = useMemo(() => {
        if (!isCorrectionMode || !correctionRecordData || !siteInfo.duesAmount || siteInfo.duesAmount === 0) return 0;
        return Math.round(correctionRecordData.amount / siteInfo.duesAmount);
    }, [isCorrectionMode, correctionRecordData, siteInfo.duesAmount]);
    
    useEffect(() => {
        if (isCorrectionMode) {
            setSelectedMonths([]);
        }
    }, [isCorrectionMode, correctionRecordData, selectedYear]);

    const userLocation = useMemo(() => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === user.id);
            if (apt) {
                const floor = apt.floor || calculateFloorFallback(block.name, apt.number);
                return `${block.name} - K:${floor} - D:${apt.number}`;
            }
        }
        return '';
    }, [blocks, user.id]);

    const yearlyStatus = useMemo(() => {
        return months.map((m, idx) => {
            const monthStr = `${m} ${selectedYear}`;
            const record = allDues.find(d => d.userId === user.id && d.month === monthStr);
            const isPast = selectedYear < currentYear || (selectedYear === currentYear && idx <= currentMonthIdx);
            
            let status: 'Ödendi' | 'Ödenmedi' | 'Bekliyor' = 'Bekliyor';
            if (record?.status === 'Ödendi') status = 'Ödendi';
            else if (isPast || record?.status === 'Ödenmedi') status = 'Ödenmedi';

            return { monthName: m, monthStr, status, amount: record?.amount || siteInfo.duesAmount };
        });
    }, [user.id, allDues, selectedYear, currentYear, currentMonthIdx, months, siteInfo.duesAmount]);
    
    const handleMonthToggle = (monthStr: string, currentStatus: string) => {
        if (currentStatus === 'Ödendi') return;

        setSelectedMonths(prev => {
            if (prev.includes(monthStr)) {
                return prev.filter(m => m !== monthStr);
            } else {
                if (prev.length < targetMonthCount) {
                    return [...prev, monthStr];
                }
                return prev;
            }
        });
    };

    const handleCorrectionSave = async () => {
        if (onCorrect && correctionRecordData && selectedMonths.length === targetMonthCount) {
            setIsProcessing(true);
            try {
                // Not: Fazla/Eksik ödeme şu an sadece UI'da tutuluyor, veritabanı yapısına göre kaydedilebilir.
                // Şimdilik sadece ana aidat işlemini yapıyoruz.
                await onCorrect(user.id, selectedMonths, siteInfo.duesAmount, correctionRecordData);
            } catch (error) {
                alert("Bir hata oluştu: " + error);
                setIsProcessing(false);
            }
        }
    };

    const handleSaveAlias = () => {
        if (detectedAlias.trim() && onAddAlias) {
            onAddAlias(user.id, detectedAlias.trim());
            setIsAliasSaved(true);
        }
    };

    const handleAddManualDebt = () => {
        if (isAllYear) {
            const confirmMsg = `${manualYear} yılının TÜM AYLARI (12 Ay) için aylık ₺${manualAmount} tutarında borç kaydı işlenecektir. Onaylıyor musunuz?`;
            if (window.confirm(confirmMsg)) {
                months.forEach(m => {
                    const monthStr = `${m} ${manualYear}`;
                    onUpdateDues(user.id, monthStr, 'Ödenmedi', manualAmount);
                });
                alert("İşlem tamamlandı.");
                if (manualYear !== selectedYear) setSelectedYear(manualYear);
            }
        } else {
            const monthStr = `${manualMonth} ${manualYear}`;
            onUpdateDues(user.id, monthStr, 'Ödenmedi', manualAmount);
            alert("İşlem tamamlandı.");
            if (manualYear !== selectedYear) setSelectedYear(manualYear);
        }
    };

    const modalTitle = isCorrectionMode 
        ? (correctionRecordData?.priority === 5 ? 'Hatalı Kayıt Düzeltme' : 'Aktarım Detayı & Onay')
        : 'Aidat Detayları & Borçlandırma';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center shrink-0">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">{user.name}</h3>
                                {onEditUser && (
                                    <button 
                                        onClick={onEditUser} 
                                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white" 
                                        title="Kullanıcıyı Düzenle"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                    </button>
                                )}
                                {onChangeUser && isCorrectionMode && (
                                    <button 
                                        onClick={onChangeUser} 
                                        className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 rounded-lg transition-all text-amber-300" 
                                        title="Kullanıcıyı Değiştir (Yanlış Eşleşme Düzeltme)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {userLocation && (
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-tight mt-0.5">{userLocation}</p>
                            )}
                            <p className="text-gray-400 text-[10px] font-bold uppercase mt-1 tracking-widest">{modalTitle}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
                    {isCorrectionMode && correctionRecordData && (
                        <div className="space-y-6 mb-6">
                            <div className="p-4 bg-indigo-50 text-indigo-800 border-l-4 border-indigo-500 rounded-r-lg space-y-3">
                                <h4 className="font-black text-sm uppercase">İşlem Özeti</h4>
                                <p className="text-xs"><strong>Banka Açıklaması:</strong> {highlightText(correctionRecordData.description, correctionRecordData.detectedUser?.name)}</p>
                                <p className="text-xs"><strong>Toplam Ödeme:</strong> ₺{correctionRecordData.amount.toLocaleString()} | <strong>Aylık Aidat:</strong> ₺{siteInfo.duesAmount.toLocaleString()}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-bold text-indigo-700 bg-indigo-100/50 px-2 py-1 rounded inline-block">
                                        ( {correctionRecordData.amount.toLocaleString()} / {siteInfo.duesAmount.toLocaleString()} = {(correctionRecordData.amount / (siteInfo.duesAmount || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} )
                                    </p>
                                    <p className="text-xs font-black ml-1">Bu ödeme <strong>{targetMonthCount} aylık</strong> aidata denk gelmektedir.</p>
                                </div>
                                <div className="flex gap-3 mt-2 border-t border-indigo-200 pt-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-indigo-400 block mb-1">Fazla Ödeme (₺)</label>
                                        <input 
                                            type="number" 
                                            value={extraPayment} 
                                            onChange={(e) => setExtraPayment(e.target.value)}
                                            className="w-full px-2 py-1.5 rounded-lg border border-indigo-200 text-xs font-bold bg-white text-emerald-600 focus:ring-1 focus:ring-indigo-300 outline-none"
                                            placeholder="0" 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-indigo-400 block mb-1">Eksik Ödeme (₺)</label>
                                        <input 
                                            type="number" 
                                            value={missingPayment} 
                                            onChange={(e) => setMissingPayment(e.target.value)}
                                            className="w-full px-2 py-1.5 rounded-lg border border-indigo-200 text-xs font-bold bg-white text-rose-600 focus:ring-1 focus:ring-indigo-300 outline-none" 
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <p className="text-[9px] text-indigo-400 mt-1 italic">* Eksik/Fazla ödeme bilgisi manuel not olarak girilir.</p>
                            </div>

                            {/* Alias matching section - Always visible for manual entry if desired */}
                            <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex-1 w-full">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Hesap Tanımı / Takma İsim
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={detectedAlias} 
                                            onChange={(e) => setDetectedAlias(e.target.value)}
                                            placeholder="Örn: Eşinin Adı veya Farklı Gönderici İsmi"
                                            className="bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg px-3 py-2 outline-none w-full shadow-sm"
                                        />
                                    </div>
                                    <p className="text-[9px] mt-1 opacity-80">Bu ismi/tanımı sakine tanımlarsanız, sonraki yüklemelerde otomatik olarak "Tam Eşleşme" sağlanır.</p>
                                </div>
                                <button 
                                    onClick={handleSaveAlias}
                                    disabled={isAliasSaved || !detectedAlias.trim()}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm h-full self-end md:self-center ${isAliasSaved ? 'bg-green-600 text-white cursor-default' : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                >
                                    {isAliasSaved ? 'Tanımlandı ✓' : 'Hesabı Eşleştir'}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-center mb-6">
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
                            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                                <button
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedYear === y ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {yearlyStatus.map((item, idx) => {
                             const isSelected = isCorrectionMode && selectedMonths.includes(item.monthStr);
                             return (
                                <div 
                                    key={idx} 
                                    onClick={() => {
                                        if (isCorrectionMode) {
                                            handleMonthToggle(item.monthStr, item.status);
                                        } else {
                                            onUpdateDues(user.id, item.monthStr, item.status === 'Ödendi' ? 'Ödenmedi' : 'Ödendi', siteInfo.duesAmount);
                                        }
                                    }}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all relative ${
                                        isCorrectionMode 
                                            ? (item.status === 'Ödendi' 
                                                ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' 
                                                : `cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-100 shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-indigo-300'}`)
                                            : `cursor-pointer hover:scale-105 active:scale-95 ${item.status === 'Ödendi' ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`
                                    }`}
                                >
                                    {isCorrectionMode && item.status !== 'Ödendi' && (
                                        <div className={`absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    )}

                                    <span className={`text-[10px] font-black uppercase mb-1 ${item.status === 'Ödendi' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.monthName}</span>
                                    <span className="text-sm font-black text-gray-800">
                                        ₺{siteInfo.duesAmount.toLocaleString()}
                                    </span>
                                    <span className={`text-[10px] font-bold mt-1 ${
                                        item.status === 'Ödendi' ? 'text-green-600' :
                                        (isCorrectionMode ? (isSelected ? 'text-indigo-600' : 'text-gray-400') : 'text-rose-600')
                                    }`}>
                                        {isCorrectionMode 
                                            ? (item.status === 'Ödendi' ? 'ÖDENDİ' : (isSelected ? 'SEÇİLDİ' : 'SEÇ')) 
                                            : item.status.toUpperCase()}
                                    </span>
                                </div>
                             )
                        })}
                    </div>
                </div>

                {isCorrectionMode ? (
                    <div className="p-6 bg-white border-t border-gray-100 shrink-0 flex justify-between items-center">
                        <span className="text-sm font-black text-indigo-600">{selectedMonths.length} / {targetMonthCount} Ay Seçildi</span>
                        <div className="flex gap-3">
                            <button onClick={onClose} disabled={isProcessing} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Vazgeç</button>
                            <button 
                                onClick={handleCorrectionSave}
                                disabled={selectedMonths.length !== targetMonthCount || isProcessing}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 flex items-center gap-2"
                            >
                                {isProcessing && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {isProcessing ? 'İşleniyor...' : 'Onayla ve Tamamla'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                        {isManualAddVisible ? (
                            <div className="animate-in fade-in duration-300">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Manuel Borç Ekle</h4>
                                <div className="flex flex-wrap gap-2 items-end">
                                    <select value={manualYear} onChange={(e) => setManualYear(Number(e.target.value))} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none">
                                        {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={manualMonth} onChange={(e) => setManualMonth(e.target.value)} disabled={isAllYear} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none disabled:opacity-50">
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <input type="number" value={manualAmount} onChange={(e) => setManualAmount(Number(e.target.value))} className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" placeholder="Tutar" />
                                    <label className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer select-none">
                                        <input type="checkbox" checked={isAllYear} onChange={(e) => setIsAllYear(e.target.checked)} className="mr-2" />
                                        <span className="text-[10px] font-black uppercase text-gray-600">Tüm Yıl</span>
                                    </label>
                                    <div className="flex-1 flex gap-2 min-w-[160px]">
                                        <button onClick={handleAddManualDebt} className="flex-grow px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase hover:bg-black transition-all">Ekle</button>
                                        <button type="button" onClick={() => setIsManualAddVisible(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase hover:bg-gray-200 transition-all">Vazgeç</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setIsManualAddVisible(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                <span className="text-xs font-black uppercase tracking-widest">Manuel Borç Ekle</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const DuesManagement: React.FC<DuesManagementProps> = ({ users, blocks, allDues, siteInfo, onUpdateDues, onUpdateSiteInfo, setCurrentPage, onUpdateUserAndAssignment }) => {
    // Note: Re-declaring all necessary states for the component to function
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const [viewMode, setViewMode] = useState<'analysis' | 'list' | 'import' | 'errors' | 'success'>('analysis');
    const [selectedMonth, setSelectedMonth] = useState<string>(months[currentMonthIdx]);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [defaultAmount, setDefaultAmount] = useState<number>(siteInfo.duesAmount);
    const [isCollecting, setIsCollecting] = useState(false);
    
    // List View States
    const [isListAllYear, setIsListAllYear] = useState(false);
    const [listManualAmount, setListManualAmount] = useState(siteInfo.duesAmount);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterBlockId, setFilterBlockId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
    
    // Excel Import States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [excelMatches, setExcelMatches] = useState<ExcelMatch[]>([]);
    const [importHistory, setImportHistory] = useState<ExcelMatch[]>([]); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [importFilter, setImportFilter] = useState<string>('all');
    
    // Import Target Date State
    const [importTargetMonthIdx, setImportTargetMonthIdx] = useState<number>(currentMonthIdx);
    const [importTargetYear, setImportTargetYear] = useState<number>(currentYear);
    const [importExpectedAmount, setImportExpectedAmount] = useState(siteInfo.duesAmount);
    const [isImportListFilteredByDate, setIsImportListFilteredByDate] = useState(false);
    
    // Import File Date Filtering
    const [importDateFilter, setImportDateFilter] = useState<string>('all');
    
    // Description Search
    const [descriptionSearchTerm, setDescriptionSearchTerm] = useState('');

    // Error Tab States
    const [errorFilter, setErrorFilter] = useState<string>('all');
    const [errorFileFilter, setErrorFileFilter] = useState<string>('all');
    const [errorDateFilter, setErrorDateFilter] = useState<string>('all');
    
    // Success Tab States
    const [successFilterMonth, setSuccessFilterMonth] = useState<string>('all');
    const [successFilterYear, setSuccessFilterYear] = useState<number>(currentYear);
    const [successSearchTerm, setSuccessSearchTerm] = useState('');
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);


    // Detail Modal State
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<{id: number, name: string} | null>(null);
    const [detailModalYear, setDetailModalYear] = useState(currentYear);
    const [correctionRecord, setCorrectionRecord] = useState<ExcelMatch | null>(null);
    
    // Manual Match State
    const [isUserSelectModalOpen, setIsUserSelectModalOpen] = useState(false);
    const [manualMatchRecord, setManualMatchRecord] = useState<ExcelMatch | null>(null);

    // Edit User Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);


    // Config states
    const [localStartRow, setLocalStartRow] = useState(siteInfo.importStartRow || 8);
    const [localDateCol, setLocalDateCol] = useState(siteInfo.importDateCol || 'D');
    const [localAmountCol, setLocalAmountCol] = useState(siteInfo.importAmountCol || 'G');
    const [localDescCol, setLocalDescCol] = useState(siteInfo.importDescCol || 'Q');

    // Subscribe to persisted import records (Errors/Staging)
    useEffect(() => {
        const unsub = db.subscribeToImportRecords((records) => {
            const sortedRecords = [...records].sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                const nameA = a.detectedUser?.name || '';
                const nameB = b.detectedUser?.name || '';
                return nameA.localeCompare(nameB);
            });
            setExcelMatches(sortedRecords);
        });
        return () => unsub();
    }, []);

    // Subscribe to persisted import history (Success)
    useEffect(() => {
        const unsub = db.subscribeToImportHistory(setImportHistory);
        return () => unsub();
    }, []);

    // AUTO-MIGRATE Legacy 'İE' records to 'TE'
    useEffect(() => {
        if (excelMatches.length > 0) {
            const hasLegacyIE = excelMatches.some(m => m.matchType === 'İE' || (m.matchType === 'TE' && m.priority !== 1));
            if (hasLegacyIE) {
                const updated = excelMatches.map(m => {
                    if (m.matchType === 'İE') return { ...m, matchType: 'TE', priority: 1, selected: true };
                    // Fix partial-name-match records that were labeled TE but had lower priority
                    if (m.matchType === 'TE' && m.priority !== 1) return { ...m, priority: 1, selected: true };
                    return m;
                });
                setExcelMatches(updated);
                db.setImportRecords(updated);
            }
        }
    }, [excelMatches]);

    useEffect(() => {
        setLocalStartRow(siteInfo.importStartRow || 8);
        setLocalDateCol(siteInfo.importDateCol || 'D');
        setLocalAmountCol(siteInfo.importAmountCol || 'G');
        setLocalDescCol(siteInfo.importDescCol || 'Q');
    }, [siteInfo]);

    useEffect(() => {
        if (!excelMatches.length) setImportExpectedAmount(siteInfo.duesAmount);
    }, [siteInfo.duesAmount, excelMatches.length]);

    useEffect(() => {
        if (selectedYear === currentYear) setListManualAmount(siteInfo.duesAmount);
    }, [selectedYear, siteInfo.duesAmount, currentYear]);

    useEffect(() => {
        setSelectedUserIds([]);
    }, [filterBlockId, filterStatus, searchTerm, selectedMonth, selectedYear]);

    const fullMonthString = `${selectedMonth} ${selectedYear}`;

    const unmatchedRecords = useMemo(() => excelMatches.filter(m => m.priority !== 1), [excelMatches]);

    const getUserLocationInfo = (userId: number) => {
        for (const block of blocks) {
            const apt = block.apartments.find(a => a.residentId === userId);
            if (apt) {
                const floor = apt.floor || calculateFloorFallback(block.name, apt.number);
                return { 
                    text: `${block.name} - K:${floor} - D:${apt.number}`, 
                    blockId: block.id, 
                    blockName: block.name, 
                    aptNumber: apt.number,
                    floor
                };
            }
        }
        return { text: 'Atanmamış', blockId: -1, blockName: '-', aptNumber: '-', floor: '-' };
    };
    
    const analysisStats = useMemo(() => {
        const eligibleUsers = users.filter(u => u.isActive && !u.isDuesExempt && u.role !== 'Yönetici');
        let totalCollected = 0;
        let totalDebt = 0;
        const debtorMap: { [key: number]: { user: User, debt: number } } = {};

        const allPaidDues = new Set(allDues.filter(d => d.status === 'Ödendi').map(d => `${d.userId}-${d.month}`));
        
        allDues.forEach(due => {
            if (due.status === 'Ödendi') {
                totalCollected += due.amount;
            }
        });

        const today = new Date();
        const startYear = Math.min(
            ...allDues.map(d => parseInt(d.month.split(' ')[1])).filter(y => !isNaN(y)), 
            today.getFullYear() - 2
        );

        for (const user of eligibleUsers) {
            let userDebt = 0;
            for (let year = startYear; year <= today.getFullYear(); year++) {
                const endMonth = year === today.getFullYear() ? today.getMonth() : 11;
                for (let monthIdx = 0; monthIdx <= endMonth; monthIdx++) {
                    const monthStr = `${months[monthIdx]} ${year}`;
                    if (!allPaidDues.has(`${user.id}-${monthStr}`)) {
                        const dueRecord = allDues.find(d => d.userId === user.id && d.month === monthStr);
                        const amount = dueRecord?.amount || siteInfo.duesAmount;
                        userDebt += amount;
                    }
                }
            }
            if (userDebt > 0) {
                debtorMap[user.id] = { user, debt: userDebt };
            }
            totalDebt += userDebt;
        }
        
        const topDebtors = Object.values(debtorMap).sort((a, b) => b.debt - a.debt).slice(0, 5);
        const collectionRate = (totalCollected + totalDebt) > 0 ? Math.round((totalCollected / (totalCollected + totalDebt)) * 100) : 100;

        return { totalCollected, totalDebt, collectionRate, topDebtors };
    }, [allDues, users, siteInfo.duesAmount, months]);

    const blockMonthlyStats = useMemo(() => {
        const currentMonthStr = `${months[currentMonthIdx]} ${currentYear}`;
        return blocks.map(block => {
            const eligibleApts = block.apartments.filter(apt => {
                if (!apt.residentId) return false;
                const user = users.find(u => u.id === apt.residentId);
                return user && user.isActive && !user.isDuesExempt && user.role !== 'Yönetici';
            });
            
            const totalCount = eligibleApts.length;
            if (totalCount === 0) return null;
            
            const paidCount = eligibleApts.filter(apt => {
                return allDues.some(d => d.userId === apt.residentId && d.month === currentMonthStr && d.status === 'Ödendi');
            }).length;

            const unpaidCount = totalCount - paidCount;
            const rate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
            
            return {
                id: block.id,
                name: block.name,
                total: totalCount,
                paid: paidCount,
                unpaid: unpaidCount,
                rate: rate
            };
        }).filter((s): s is NonNullable<typeof s> => s !== null).sort((a,b) => (a.name.localeCompare(b.name, 'tr', { numeric: true })));
    }, [blocks, users, allDues, currentMonthIdx, currentYear, months]);


    const filteredResidents = useMemo(() => {
        let result = users.filter(u => u.isActive && (u.role !== 'Yönetici' || (u.vehiclePlate1 || u.vehiclePlate2)) && !u.isDuesExempt);
        if (searchTerm) {
            const lowerSearch = searchTerm.toLocaleLowerCase('tr-TR');
            result = result.filter(u => u.name.toLocaleLowerCase('tr-TR').includes(lowerSearch));
        }
        if (filterBlockId !== 'all') {
            const targetBlockId = parseInt(filterBlockId);
            result = result.filter(u => getUserLocationInfo(u.id).blockId === targetBlockId);
        }
        if (filterStatus !== 'all') {
            result = result.filter(u => {
                const dueRecord = allDues.find(d => d.userId === u.id && d.month === fullMonthString);
                const isPastMonth = selectedYear < currentYear || (selectedYear === currentYear && months.indexOf(selectedMonth) < currentMonthIdx);
                const isPaid = dueRecord?.status === 'Ödendi';
                const effectiveStatus = isPaid ? 'paid' : (isPastMonth ? 'unpaid' : 'waiting');
                
                if (filterStatus === 'paid') return effectiveStatus === 'paid';
                if (filterStatus === 'unpaid') return effectiveStatus === 'unpaid';
                return true;
            });
        }
        return result;
    }, [users, allDues, filterBlockId, filterStatus, fullMonthString, searchTerm, selectedMonth, selectedYear, currentYear, currentMonthIdx, months]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedUserIds(filteredResidents.map(u => u.id));
        else setSelectedUserIds([]);
    };

    const toggleUserSelection = (id: number) => {
        setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const handleToggleStatus = (userId: number, monthStr: string, currentStatus: 'Ödendi' | 'Ödenmedi' | 'Yok') => {
        const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';
        onUpdateDues(userId, monthStr, newStatus, siteInfo.duesAmount);
    };

    const handleBatchCollect = (userList: User[], monthStr: string) => {
        const targetUsers = selectedUserIds.length > 0 ? userList.filter(u => selectedUserIds.includes(u.id)) : userList;
        const unpaidUsers = targetUsers.filter(u => {
            const due = allDues.find(d => d.userId === u.id && d.month === monthStr);
            return !due || due.status === 'Ödenmedi';
        });

        if (isListAllYear) {
            if (targetUsers.length === 0) { alert("İşlem yapılacak sakin seçilmedi."); return; }
            if(window.confirm(`${selectedYear} yılı için seçilen ${targetUsers.length} sakinin TÜM AYLAR (12 Ay) aidatı aylık ₺${listManualAmount} üzerinden "Ödendi" olarak güncellenecektir. Onaylıyor musunuz?`)) {
                setIsCollecting(true);
                setTimeout(() => {
                    targetUsers.forEach(u => {
                        months.forEach(m => onUpdateDues(u.id, `${m} ${selectedYear}`, 'Ödendi', listManualAmount));
                    });
                    setIsCollecting(false);
                    setSelectedUserIds([]);
                    alert("Tüm yıl tahsilat işlemi başarıyla tamamlandı.");
                }, 100);
            }
        } else {
            if (unpaidUsers.length === 0) { alert("Seçilenler arasında tahsil edilecek ödenmemiş aidat bulunamadı."); return; }
            if (window.confirm(`${monthStr} dönemi için ${unpaidUsers.length} dairenin aidatı toplu olarak tahsil edilecektir. Onaylıyor musunuz?`)) {
                setIsCollecting(true);
                setTimeout(() => {
                    unpaidUsers.forEach(u => onUpdateDues(u.id, monthStr, 'Ödendi', defaultAmount));
                    setIsCollecting(false);
                    setSelectedUserIds([]);
                    alert("İşlem başarıyla tamamlandı.");
                }, 100);
            }
        }
    };

    const saveImportConfig = async () => {
        if (onUpdateSiteInfo) {
            await onUpdateSiteInfo({
                ...siteInfo,
                importStartRow: localStartRow,
                importDateCol: localDateCol.toUpperCase(),
                importAmountCol: localAmountCol.toUpperCase(),
                importDescCol: localDescCol.toUpperCase()
            });
            setIsConfigOpen(false);
            alert("Aktarım ayarları başarıyla güncellendi.");
        }
    };

    const processExcelData = async (data: any[], fileName: string) => {
        const initialMatches: ExcelMatch[] = [];
        const startRowIdx = (localStartRow || 8) - 1; 
        const dateColIdx = columnLetterToIndex(localDateCol || 'D');
        const amountColIdx = columnLetterToIndex(localAmountCol || 'G');
        const descColIdx = columnLetterToIndex(localDescCol || 'Q');

        for (let i = startRowIdx; i < data.length; i++) {
            const row = data[i];
            if (!row) continue;
            
            const rawDescription = String(row[descColIdx] || "");
            if (!rawDescription.trim() || rawDescription === 'undefined') continue;

            let dateString = '';
            const rawDateValue = row[dateColIdx];
            if (rawDateValue instanceof Date && !isNaN(rawDateValue.getTime())) {
                const day = rawDateValue.getDate().toString().padStart(2, '0');
                const month = (rawDateValue.getMonth() + 1).toString().padStart(2, '0');
                const year = rawDateValue.getFullYear();
                dateString = `${day}.${month}.${year}`;
            } else if (rawDateValue) {
                dateString = String(rawDateValue);
            }

            const rawAmount = row[amountColIdx];
            let cleanAmount = 0;
            if (typeof rawAmount === 'number' && isFinite(rawAmount)) {
                cleanAmount = rawAmount;
            } else if (typeof rawAmount === 'string') {
                // Remove all dots (thousands separator), replace comma with dot (decimal separator)
                // Assumes TR format like 1.250,50
                const sanitizedString = rawAmount.replace(/[.]/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
                const parsed = parseFloat(sanitizedString);
                if (isFinite(parsed)) {
                    cleanAmount = parsed;
                }
            }

            const cleanRawDesc = normalizeText(rawDescription);
            const detectedBlock = extractBlockFromDesc(rawDescription);
            const detectedAptNum = extractAptNumFromDesc(rawDescription);

            let bestUser: User | null = null;
            let nameMatch = false;
            let locationMatch = false;

            // Sort users by name length descending to match longest possible names first
            const sortedUsers = [...users].sort((a, b) => b.name.length - a.name.length);
            
            for (const user of sortedUsers) {
                if (user.role === 'Yönetici') continue;
                
                const cleanUserName = normalizeText(user.name);
                const latinUserName = transliterate(cleanUserName);
                const latinDesc = transliterate(cleanRawDesc);

                // Check for payment aliases
                const aliasMatch = user.paymentAliases && user.paymentAliases.some(alias => {
                    const cleanAlias = normalizeText(alias);
                    const latinAlias = transliterate(cleanAlias);
                    return cleanRawDesc.includes(cleanAlias) || latinDesc.includes(latinAlias);
                });

                // Check if name is in description (Original OR Transliterated OR Alias)
                if (cleanRawDesc.includes(cleanUserName) || latinDesc.includes(latinUserName) || aliasMatch) {
                    nameMatch = true;
                    bestUser = user;

                    // If we have a name match, check if we also have a location match in desc
                    if (detectedBlock && detectedAptNum) {
                        const userLoc = getUserLocationInfo(user.id);
                        const userBlock = normalizeText(userLoc.blockName).replace(/\s/g, '');
                        const targetBlock = detectedBlock.replace(/\s/g, '');
                        
                        if (userBlock === targetBlock && userLoc.aptNumber === detectedAptNum) {
                            locationMatch = true;
                        }
                    } else if (detectedAptNum) {
                        // Just apt match
                        const userLoc = getUserLocationInfo(user.id);
                        if (userLoc.aptNumber === detectedAptNum) {
                            locationMatch = true;
                        }
                    }
                    break;
                }
            }

            // If no name match, try location only match
            if (!bestUser && detectedBlock && detectedAptNum) {
                const targetBlockName = detectedBlock;
                const targetApt = detectedAptNum;

                const targetBlock = blocks.find(b => b.name.replace(/\s/g, '').toUpperCase().includes(targetBlockName));
                if (targetBlock) {
                    const apt = targetBlock.apartments.find(a => a.number === targetApt);
                    if (apt && apt.residentId) {
                        bestUser = users.find(u => u.id === apt.residentId) || null;
                        locationMatch = true;
                    }
                }
            }
            
            const absAmount = Math.abs(cleanAmount);
            const isAmountExact = Math.abs(absAmount - importExpectedAmount) < 0.1;
            let priority: number;
            let matchType: string;
            let currentWarning = "";

            if (!isAmountExact) {
                priority = 5; 
                matchType = 'FT'; // Farklı Tutar
                const multiple = Math.round(absAmount / importExpectedAmount);
                currentWarning = multiple > 1 ? `Farklı Tutar! (${multiple} Aylık Tahmini)` : `Farklı Tutar! (Eksik/Fazla)`;
            } else if (nameMatch) {
                priority = 1;
                matchType = 'TE'; 
            } else if (locationMatch) {
                priority = 3;
                matchType = 'KE'; // Konum Eşleşmesi
            } else {
                priority = 5;
                matchType = 'EY'; // Eşleşme Yok
            }
            
            initialMatches.push({
                id: `match-${i}-${Date.now()}`,
                detectedUser: bestUser ? { id: bestUser.id, name: bestUser.name } : null,
                detectedLocation: bestUser ? getUserLocationInfo(bestUser.id).text : (detectedBlock ? `${detectedBlock} Blok - Daire: ${detectedAptNum || '?'}` : '-'),
                description: rawDescription,
                date: dateString,
                amount: absAmount,
                selected: (priority === 1),
                warning: currentWarning,
                matchType,
                priority,
                sourceFile: fileName
            });
        }

        const userCounts: Record<number, number> = {};
        initialMatches.forEach(m => { if (m.detectedUser) userCounts[m.detectedUser.id] = (userCounts[m.detectedUser.id] || 0) + 1; });

        const finalMatches = initialMatches.map(m => {
            if (m.priority > 1 && m.detectedUser && userCounts[m.detectedUser.id] > 1) {
                return { ...m, priority: 4, selected: false, warning: m.warning ? `${m.warning} (Mükerrer)` : 'Aynı kişiye ait çoklu kayıt', matchType: 'MK' };
            }
            return m;
        });

        finalMatches.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.priority === 4) return (a.detectedUser?.name || '').localeCompare(b.detectedUser?.name || '');
            return 0;
        });
        
        setExcelMatches(finalMatches);
        setViewMode('import');
        setIsProcessing(false);

        await db.setImportRecords(finalMatches);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirmReset = window.confirm("Yeni bir dosya yüklemek mevcut 'Hatalı Kayıtlar' listesini temizleyecektir. Devam etmek istiyor musunuz?");
        if (!confirmReset) {
            e.target.value = '';
            return;
        }

        setIsProcessing(true);
        const reader = new FileReader();
        
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (!jsonData || jsonData.length === 0) {
                    alert("Dosya boş veya okunamadı.");
                    setIsProcessing(false);
                    return;
                }

                processExcelData(jsonData, file.name);
            } catch (err) {
                console.error("Excel processing error:", err);
                alert("Excel dosyası okunamadı. Lütfen formatı kontrol edin.");
                setIsProcessing(false);
            }
            e.target.value = '';
        };

        reader.onerror = () => {
            alert("Dosya okuma hatası.");
            setIsProcessing(false);
            e.target.value = '';
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImportSubmit = async () => {
        const selected = excelMatches.filter(m => m.selected);
        if (selected.length === 0) { alert("Lütfen aktarılacak kayıtları seçiniz."); return; }
        const targetMonthName = months[importTargetMonthIdx];
        const targetMonthStr = `${targetMonthName} ${importTargetYear}`;
        
        if (window.confirm(`${selected.length} adet kayıt ${targetMonthStr} dönemi için "Ödendi" olarak işlenecektir. Onaylıyor musunuz?`)) {
            const successfulImports = selected.map(s => ({...s, importedMonth: targetMonthStr}));
            
            selected.forEach(m => {
                if (m.detectedUser) onUpdateDues(m.detectedUser.id, targetMonthStr, 'Ödendi', m.amount);
            });
            
            await db.addImportHistoryRecords(successfulImports);

            const remaining = excelMatches.filter(m => !m.selected);
            setExcelMatches(remaining); 
            await db.setImportRecords(remaining);
            
            alert("Seçilen kayıtlar başarıyla işlendi ve geçmişe eklendi.");
        }
    };

    const handleDeleteSelected = async () => {
        const selectedCount = excelMatches.filter(m => m.selected).length;
        if (selectedCount === 0) {
            alert("Lütfen silmek istediğiniz satırları seçiniz.");
            return;
        }

        if (window.confirm(`Seçili ${selectedCount} satırı listeden silmek istediğinize emin misiniz?`)) {
            const remaining = excelMatches.filter(m => !m.selected);
            setExcelMatches(remaining);
            await db.setImportRecords(remaining);
        }
    };
    
    const partialErrorCount = useMemo(() => unmatchedRecords.filter(m => m.priority === 2 || m.priority === 3).length, [unmatchedRecords]);
    const duplicateErrorCount = useMemo(() => unmatchedRecords.filter(m => m.priority === 4).length, [unmatchedRecords]);
    const genericErrorCount = useMemo(() => unmatchedRecords.filter(m => m.priority === 5).length, [unmatchedRecords]);

    const uniqueErrorFiles = useMemo(() => Array.from(new Set(unmatchedRecords.map(m => m.sourceFile).filter(Boolean))).sort(), [unmatchedRecords]);
    const uniqueErrorDates = useMemo(() => Array.from(new Set(unmatchedRecords.map(m => m.date).filter(Boolean))).sort(), [unmatchedRecords]);

    const filteredAndSortedErrorRecords = useMemo(() => {
        let records = [...unmatchedRecords];
        
        if (errorFilter === 'partial') records = records.filter(m => m.priority === 2 || m.priority === 3);
        else if (errorFilter === 'duplicate') records = records.filter(m => m.priority === 4);
        else if (errorFilter === 'error') records = records.filter(m => m.priority === 5);

        if (errorFileFilter !== 'all') {
            records = records.filter(m => m.sourceFile === errorFileFilter);
        }

        if (errorDateFilter !== 'all') {
            records = records.filter(m => m.date === errorDateFilter);
        }

        if (descriptionSearchTerm.trim()) {
            const term = descriptionSearchTerm.toLocaleLowerCase('tr-TR');
            records = records.filter(m => m.description.toLocaleLowerCase('tr-TR').includes(term));
        }

        return records.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            const nameA = a.detectedUser?.name || '';
            const nameB = b.detectedUser?.name || '';
            return nameA.localeCompare(nameB, 'tr');
        });
    }, [unmatchedRecords, errorFilter, errorFileFilter, errorDateFilter, descriptionSearchTerm]);

    const handleSelectAllImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const newMatches = excelMatches.map(m => {
            if (filteredImportMatches.find(fm => fm.id === m.id)) {
                return { ...m, selected: isChecked };
            }
            return m;
        });
        setExcelMatches(newMatches);
        // REMOVED: await db.setImportRecords(newMatches); // UI flashing fix: Don't sync checkbox state to DB immediately
    };

    const handleSelectAllErrors = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const newMatches = excelMatches.map(m => {
            if (filteredAndSortedErrorRecords.find(fm => fm.id === m.id)) {
                return { ...m, selected: isChecked };
            }
            return m;
        });
        setExcelMatches(newMatches);
        // REMOVED: await db.setImportRecords(newMatches); // UI flashing fix
    };

    const perfectMatchCount = useMemo(() => excelMatches.filter(m => m.priority === 1).length, [excelMatches]);
    const partialMatchCount = useMemo(() => excelMatches.filter(m => m.priority === 2 || m.priority === 3).length, [excelMatches]);
    const duplicateMatchCount = useMemo(() => excelMatches.filter(m => m.priority === 4).length, [excelMatches]);
    const errorMatchCount = useMemo(() => excelMatches.filter(m => m.priority === 5).length, [excelMatches]);

    const uniqueImportDates = useMemo(() => Array.from(new Set(excelMatches.map(m => m.date).filter(Boolean))).sort(), [excelMatches]);

    const filteredImportMatches = useMemo(() => {
        let matches = excelMatches;
        if (importFilter === 'perfect') matches = matches.filter(m => m.priority === 1);
        else if (importFilter === 'partial') matches = matches.filter(m => m.priority === 2 || m.priority === 3);
        else if (importFilter === 'duplicate') matches = matches.filter(m => m.priority === 4);
        else if (importFilter === 'error') matches = matches.filter(m => m.priority === 5);

        if (isImportListFilteredByDate) {
            matches = matches.filter(m => checkDateMatch(m.date, importTargetMonthIdx, importTargetYear));
        }

        if (importDateFilter !== 'all') {
            matches = matches.filter(m => m.date === importDateFilter);
        }

        if (descriptionSearchTerm.trim()) {
            const term = descriptionSearchTerm.toLocaleLowerCase('tr-TR');
            matches = matches.filter(m => m.description.toLocaleLowerCase('tr-TR').includes(term));
        }

        return matches;
    }, [excelMatches, importFilter, isImportListFilteredByDate, importTargetMonthIdx, importTargetYear, importDateFilter, descriptionSearchTerm]);
    
    const filteredSuccessfulRecords = useMemo(() => {
        const filtered = importHistory.filter(rec => {
            if (!rec.importedMonth) return false;
            const parts = rec.importedMonth.split(' ');
            if (parts.length < 2) return false;
            const month = parts[0];
            const yearNum = parseInt(parts[parts.length - 1]);

            const yearMatch = successFilterYear === yearNum;
            const monthMatch = successFilterMonth === 'all' || successFilterMonth === month;
            const nameMatch = !successSearchTerm.trim() || 
                (rec.detectedUser?.name || '').toLocaleLowerCase('tr-TR').includes(successSearchTerm.toLocaleLowerCase('tr-TR'));
            
            return yearMatch && monthMatch && nameMatch;
        });
        return filtered.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            const nameA = a.detectedUser?.name || '';
            const nameB = b.detectedUser?.name || '';
            return nameA.localeCompare(nameB);
        });
    }, [importHistory, successFilterMonth, successFilterYear, successSearchTerm]);

    const handleToggleHistorySelection = (id: string) => {
        setSelectedHistoryIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAllHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedHistoryIds(filteredSuccessfulRecords.map(rec => rec.id));
        } else {
            setSelectedHistoryIds([]);
        }
    };

    const handleDeleteSelectedHistory = async () => {
        if (selectedHistoryIds.length === 0) {
            alert("Lütfen silmek istediğiniz kayıtları seçin.");
            return;
        }
        if (window.confirm(`${selectedHistoryIds.length} adet geçmiş kaydı kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?`)) {
            await db.deleteImportHistoryRecords(selectedHistoryIds);
            setSelectedHistoryIds([]); // Listener will update list, just clear selection state.
        }
    };

    const toggleMatchSelection = async (id: string) => {
        const newMatches = excelMatches.map(m => m.id === id ? { ...m, selected: !m.selected } : m);
        setExcelMatches(newMatches);
        // REMOVED: await db.setImportRecords(newMatches); // UI flashing fix: Selection state is transient
    };
    
    const handleCorrection = async (userId: number, months: string[], amountPerMonth: number, recordToMove: ExcelMatch) => {
        months.forEach(monthStr => {
            onUpdateDues(userId, monthStr, 'Ödendi', amountPerMonth);
        });
        
        const combinedImportedMonth = months.map(m => m.split(' ')[0]).join(', ');
        const year = months.length > 0 ? months[0].split(' ')[1] : '';

        const correctedRecord = { 
            ...recordToMove, 
            amount: recordToMove.amount,
            importedMonth: `${combinedImportedMonth} ${year}`,
            priority: 1,
            matchType: 'TE' // 'Manuel Düzeltildi' -> TE for consistency
        };

        await db.addImportHistoryRecords([correctedRecord]);
        
        const remaining = excelMatches.filter(m => m.id !== recordToMove.id);
        setExcelMatches(remaining);
        await db.setImportRecords(remaining);

        setCorrectionRecord(null);
        setSelectedUserForDetail(null); 
        alert(`${months.length} aylık ödeme başarıyla kaydedildi ve kayıt düzeltildi.`);
    };

    const handleManualMatchStart = (record: ExcelMatch) => {
        setManualMatchRecord(record);
        setIsUserSelectModalOpen(true);
    };

    const handleManualMatchSelect = (user: User) => {
        if (!manualMatchRecord) return;
        const updatedRecord = { ...manualMatchRecord, detectedUser: { id: user.id, name: user.name } };
        setCorrectionRecord(updatedRecord);
        setDetailModalYear(importTargetYear); 
        setManualMatchRecord(null);
        setIsUserSelectModalOpen(false);
    };

    const handleClearImportList = async () => {
        if (window.confirm("Bu listedeki yüklenmiş ancak henüz aktarılmamış TÜM verileri silmek istediğinize emin misiniz?")) {
            setExcelMatches([]);
            await db.setImportRecords([]);
        }
    };

    const userForModal = correctionRecord?.detectedUser || selectedUserForDetail;
    const isCorrectionMode = !!correctionRecord;

    const handleEditUser = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setEditingUser(user);
            setIsEditUserModalOpen(true);
        }
    };

    const handleSaveUser = (user: any, assignment: any) => {
        if (onUpdateUserAndAssignment) {
            onUpdateUserAndAssignment(user, assignment);
        }
        setIsEditUserModalOpen(false);
        setEditingUser(null);
    };

    const handleAddPaymentAlias = (userId: number, alias: string) => {
        const user = users.find(u => u.id === userId);
        if (user && onUpdateUserAndAssignment) {
            const updatedAliases = user.paymentAliases ? [...user.paymentAliases, alias] : [alias];
            const updatedUser = { ...user, paymentAliases: updatedAliases };
            
            // Re-find assignment
            let assignment = { blockId: null as number | null, apartmentId: null as number | null };
            for(const b of blocks) {
                const apt = b.apartments.find(a => a.residentId === userId);
                if(apt) {
                    assignment = { blockId: b.id, apartmentId: apt.id };
                    break;
                }
            }
            onUpdateUserAndAssignment(updatedUser, assignment);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {isEditUserModalOpen && (
                <UserModal 
                    isOpen={isEditUserModalOpen}
                    onClose={() => setIsEditUserModalOpen(false)}
                    onSave={handleSaveUser}
                    userToEdit={editingUser}
                    blocks={blocks}
                />
            )}

            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center flex-wrap gap-1">
                {[
                    { id: 'analysis', label: 'Analiz' },
                    { id: 'list', label: 'Liste' },
                    { id: 'import', label: 'Excel Aktar' },
                    { id: 'errors', label: 'Hatalı Kayıtlar' },
                    { id: 'success', label: 'Geçmiş İşlemler' }
                ].map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setViewMode(tab.id as any)} 
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                    >
                        {tab.label}
                        {tab.id === 'import' && excelMatches.length > 0 && <span className="ml-2 bg-white text-indigo-600 px-1.5 py-0.5 rounded-md text-[9px]">{excelMatches.length}</span>}
                        {tab.id === 'errors' && unmatchedRecords.length > 0 && <span className="ml-2 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md text-[9px]">{unmatchedRecords.length}</span>}
                    </button>
                ))}
            </div>

            {userForModal && (
                <UserDuesDetailModal 
                    user={userForModal} 
                    onClose={() => {
                        setSelectedUserForDetail(null);
                        setCorrectionRecord(null);
                    }} 
                    allDues={allDues} 
                    siteInfo={siteInfo} 
                    onUpdateDues={onUpdateDues} 
                    selectedYear={detailModalYear} 
                    setSelectedYear={setDetailModalYear}
                    isCorrectionMode={isCorrectionMode}
                    correctionRecordData={correctionRecord}
                    onCorrect={handleCorrection}
                    blocks={blocks}
                    users={users}
                    onEditUser={() => handleEditUser(userForModal.id)}
                    onChangeUser={() => correctionRecord && handleManualMatchStart(correctionRecord)}
                    onAddAlias={handleAddPaymentAlias}
                />
            )}

            <UserSelectionModal
                isOpen={isUserSelectModalOpen}
                onClose={() => { setIsUserSelectModalOpen(false); setManualMatchRecord(null); }}
                users={users}
                blocks={blocks}
                onSelect={handleManualMatchSelect}
            />

            {viewMode === 'analysis' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Genel Tahsilat</p>
                            <p className="text-3xl font-black text-emerald-600">+₺{analysisStats.totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Toplam Borç</p>
                            <p className="text-3xl font-black text-rose-600">₺{analysisStats.totalDebt.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-center items-center text-center">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Genel Tahsilat Oranı</p>
                             <span className="text-5xl font-black tracking-tight">%{analysisStats.collectionRate}</span>
                             <div className="w-full max-w-xs h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
                                <div style={{ width: `${analysisStats.collectionRate}%` }} className="h-full bg-white transition-all duration-1000" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Blok Bazında Tahsilat (<span className="text-emerald-600">{months[currentMonthIdx]} {currentYear}</span>)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Blok</th>
                                            <th className="px-6 py-4">Toplam Daire</th>
                                            <th className="px-6 py-4">Ödeyen</th>
                                            <th className="px-6 py-4">Ödemeyen</th>
                                            <th className="px-6 py-4 text-right">Oran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {blockMonthlyStats.map(stat => (
                                            <tr key={stat.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-xs font-black text-indigo-600">{stat.name}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-500">{stat.total}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-emerald-600">{stat.paid}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-rose-600">{stat.unpaid}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-20 bg-gray-100 rounded-full h-1.5"><div style={{width: `${stat.rate}%`}} className={`h-1.5 rounded-full ${stat.rate > 80 ? 'bg-emerald-500' : 'bg-indigo-400'}`}></div></div>
                                                        <span className="text-[10px] font-black text-gray-800 w-8 text-right">%{stat.rate}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">En Çok Borcu Olanlar</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {analysisStats.topDebtors.length > 0 ? analysisStats.topDebtors.map(({user, debt}) => (
                                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-rose-50/20">
                                        <div>
                                            <p className="text-xs font-black text-gray-800 uppercase">{user.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">{getUserLocationInfo(user.id).text}</p>
                                        </div>
                                        <p className="text-sm font-black text-rose-600">₺{debt.toLocaleString()}</p>
                                    </div>
                                )) : <p className="p-8 text-center text-xs font-bold text-gray-300 uppercase italic">Borçlu bulunmuyor.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'list' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-xs font-black uppercase px-3 py-2 outline-none text-gray-700 cursor-pointer">
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-xs font-black uppercase px-3 py-2 outline-none text-gray-700 cursor-pointer">
                                        {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <select value={filterBlockId} onChange={(e) => setFilterBlockId(e.target.value)} className="bg-gray-50 border border-gray-100 text-xs font-black uppercase px-4 py-3 rounded-xl outline-none text-gray-600">
                                    <option value="all">Tüm Bloklar</option>
                                    {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                                </select>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-gray-50 border border-gray-100 text-xs font-black uppercase px-4 py-3 rounded-xl outline-none text-gray-600">
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="paid">Ödenenler</option>
                                    <option value="unpaid">Ödenmeyenler</option>
                                </select>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
                                <div className="relative w-full sm:w-64">
                                    <input 
                                        type="text" 
                                        placeholder="Sakin ara..." 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    />
                                    <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 p-1.5 rounded-xl w-full sm:w-auto justify-between">
                                    <label className="flex items-center cursor-pointer px-2">
                                        <input type="checkbox" checked={isListAllYear} onChange={e => setIsListAllYear(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                                        <span className="ml-2 text-[9px] font-black uppercase text-indigo-700">Tüm Yıl</span>
                                    </label>
                                    {isListAllYear && (
                                        <input type="number" value={listManualAmount} onChange={e => setListManualAmount(Number(e.target.value))} className="w-16 px-2 py-1.5 text-center text-[10px] font-bold rounded-lg border border-indigo-200 outline-none" />
                                    )}
                                    <button 
                                        onClick={() => handleBatchCollect(filteredResidents, fullMonthString)}
                                        disabled={isCollecting}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-700 transition-all disabled:opacity-50"
                                    >
                                        {isCollecting ? '...' : 'Tahsil Et'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 w-10 text-center"><input type="checkbox" onChange={handleSelectAll} checked={filteredResidents.length > 0 && selectedUserIds.length === filteredResidents.length} className="rounded text-indigo-600 focus:ring-indigo-500" /></th>
                                        <th className="px-6 py-4">Sakin Adı</th>
                                        <th className="px-6 py-4">Konum</th>
                                        <th className="px-6 py-4 text-center">Durum</th>
                                        <th className="px-6 py-4 text-right">Tutar</th>
                                        <th className="px-6 py-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredResidents.map(user => {
                                        const loc = getUserLocationInfo(user.id);
                                        const dueRecord = allDues.find(d => d.userId === user.id && d.month === fullMonthString);
                                        const isPaid = dueRecord?.status === 'Ödendi';
                                        return (
                                            <tr key={user.id} className={`group hover:bg-gray-50 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-indigo-50/30' : ''}`}>
                                                <td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleUserSelection(user.id)} className="rounded text-indigo-600 focus:ring-indigo-500" /></td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => { setSelectedUserForDetail({id: user.id, name: user.name}); setDetailModalYear(selectedYear); }} className="text-xs font-black text-gray-800 uppercase hover:text-indigo-600 hover:underline">{user.name}</button>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">{loc.text}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{isPaid ? 'Ödendi' : 'Ödenmedi'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-gray-700">₺{(dueRecord?.amount || siteInfo.duesAmount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleToggleStatus(user.id, fullMonthString, isPaid ? 'Ödendi' : 'Ödenmedi')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${isPaid ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isPaid ? 'İptal' : 'Tahsil'}</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'import' && (
                 <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
                            <div className="lg:col-span-3">
                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">BANKA EKSTRESİNDEN AKTARIM</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">EXCEL DOSYANIZI YÜKLEYİN, SİSTEM OTOMATİK EŞLEŞTİRSİN.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Aktarım Dönemi</label>
                                <select value={importTargetMonthIdx} onChange={(e) => setImportTargetMonthIdx(Number(e.target.value))} className="bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase px-3 py-3 outline-none text-gray-700 cursor-pointer w-full">
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">&nbsp;</label>
                                 <select value={importTargetYear} onChange={(e) => setImportTargetYear(Number(e.target.value))} className="bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase px-3 py-3 outline-none text-gray-700 cursor-pointer w-full">
                                    {[currentYear, currentYear+1, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Beklenen Tutar</label>
                                <input type="number" value={importExpectedAmount} onChange={(e) => setImportExpectedAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none"/>
                            </div>
                            <div className="lg:col-span-2 pt-5">
                                <label className="flex items-center cursor-pointer select-none">
                                    <input type="checkbox" checked={isImportListFilteredByDate} onChange={e => setIsImportListFilteredByDate(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"/>
                                    <span className="ml-2 text-[10px] font-black uppercase text-gray-600">Listeyi Tarihe Göre Filtrele</span>
                                </label>
                            </div>
                            <div className="lg:col-span-4 flex items-center gap-2">
                                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex-1 py-4 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                     {isProcessing ? 'İŞLENİYOR...' : 'DOSYA SEÇ VE YÜKLE'}
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                                <button onClick={() => setIsConfigOpen(true)} className="p-4 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
            
            {viewMode === 'errors' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    {/* Header for Errors */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap gap-2 items-center">
                                <h3 className="text-lg font-black text-rose-600 uppercase tracking-tight mr-4">Hatalı / Eşleşmeyen Kayıtlar</h3>
                                <select value={errorFilter} onChange={(e) => setErrorFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 outline-none">
                                    <option value="all">Tüm Hatalar</option>
                                    <option value="partial">Kısmi Eşleşme</option>
                                    <option value="duplicate">Mükerrer</option>
                                    <option value="error">Tanımsız</option>
                                </select>
                                <select value={errorFileFilter} onChange={(e) => setErrorFileFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 outline-none max-w-[150px]">
                                    <option value="all">Dosya: Tümü</option>
                                    {uniqueErrorFiles.map((f: any) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleDeleteSelected} className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-black uppercase hover:bg-rose-50 transition-all">Seçilenleri Sil</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-rose-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-4 py-4 w-10 text-center"><input type="checkbox" onChange={handleSelectAllErrors} checked={filteredAndSortedErrorRecords.length > 0 && filteredAndSortedErrorRecords.every(m => m.selected)} className="rounded text-indigo-600 focus:ring-indigo-500" /></th>
                                        <th className="px-4 py-4">Tarih / Dosya</th>
                                        <th className="px-4 py-4">Açıklama</th>
                                        <th className="px-4 py-4 text-right">Tutar</th>
                                        <th className="px-4 py-4">Tespit / Sorun</th>
                                        <th className="px-4 py-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredAndSortedErrorRecords.map(match => (
                                        <tr key={match.id} className="hover:bg-rose-50/20 transition-colors">
                                            <td className="px-4 py-4 text-center"><input type="checkbox" checked={match.selected} onChange={() => toggleMatchSelection(match.id)} className="rounded text-indigo-600 focus:ring-indigo-500" /></td>
                                            <td className="px-4 py-4">
                                                <div className="text-[11px] font-bold text-gray-600">{match.date}</div>
                                                <div className="text-[9px] text-gray-400 truncate max-w-[100px]" title={match.sourceFile}>{match.sourceFile}</div>
                                            </td>
                                            <td className="px-4 py-4 text-[10px] font-bold text-gray-600 uppercase max-w-xs truncate" title={match.description}>{match.description}</td>
                                            <td className="px-4 py-4 text-right text-xs font-black text-gray-800">₺{match.amount.toLocaleString()}</td>
                                            <td className="px-4 py-4">
                                                <div className="text-[10px] font-bold text-rose-600 uppercase">{match.warning || STATUS_DESCRIPTIONS[match.matchType || ''] || 'Bilinmiyor'}</div>
                                                {match.detectedUser ? (
                                                    <div className="text-[10px] text-gray-500">
                                                        Olası:{' '}
                                                        <button
                                                            onClick={() => {
                                                                setCorrectionRecord(match);
                                                                setDetailModalYear(importTargetYear);
                                                            }}
                                                            className="font-bold text-indigo-600 hover:underline"
                                                        >
                                                            {match.detectedUser.name}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Eşleşme Yok</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button onClick={() => handleManualMatchStart(match)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-100 transition-all">Manuel Eşle</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'success' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <h3 className="text-lg font-black text-emerald-600 uppercase tracking-tight">Geçmiş Aktarımlar</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <select value={successFilterYear} onChange={(e) => setSuccessFilterYear(Number(e.target.value))} className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 outline-none">
                                        {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={successFilterMonth} onChange={(e) => setSuccessFilterMonth(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 outline-none">
                                        <option value="all">Tüm Aylar</option>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <input type="text" value={successSearchTerm} onChange={(e) => setSuccessSearchTerm(e.target.value)} placeholder="İsim Ara..." className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 outline-none w-32" />
                                </div>
                                <button 
                                    onClick={handleDeleteSelectedHistory} 
                                    disabled={selectedHistoryIds.length === 0}
                                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-black uppercase hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Seçilenleri Sil
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-emerald-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-4 py-4 w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                onChange={handleSelectAllHistory}
                                                checked={filteredSuccessfulRecords.length > 0 && selectedHistoryIds.length === filteredSuccessfulRecords.length}
                                                className="rounded text-indigo-600 focus:ring-indigo-500" 
                                            />
                                        </th>
                                        <th className="px-6 py-4">Sakin</th>
                                        <th className="px-6 py-4">Aktarılan Dönem</th>
                                        <th className="px-6 py-4">İşlem Tarihi</th>
                                        <th className="px-6 py-4 text-right">Tutar</th>
                                        <th className="px-6 py-4 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredSuccessfulRecords.map(rec => (
                                        <tr key={rec.id} className={`hover:bg-emerald-50/10 transition-colors ${selectedHistoryIds.includes(rec.id) ? 'bg-emerald-50' : ''}`}>
                                            <td className="px-4 py-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedHistoryIds.includes(rec.id)}
                                                    onChange={() => handleToggleHistorySelection(rec.id)}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-gray-800 uppercase">{rec.detectedUser?.name}</td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-indigo-600 uppercase">{rec.importedMonth}</td>
                                            <td className="px-6 py-4 text-[10px] text-gray-500 font-mono">{rec.date}</td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-emerald-600">₺{rec.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase">Başarılı</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DuesManagement;
