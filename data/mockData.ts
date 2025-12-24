
import { User, Dues, Announcement, Block, Apartment } from '../types';

const defaultPreferences = {
    emailNotifications: true,
    smsNotifications: true,
    newAnnouncements: true,
    duesReminders: true
};

const formatNameSurname = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].toUpperCase();

    const surname = parts.pop()?.toUpperCase() || "";
    const names = parts.map(n => {
        if (n.length === 0) return "";
        return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
    }).join(' ');

    return `${names} ${surname}`;
};

const rawResidents = [
    { name: "Rukiye Yıldızhan", plate1: "34HVK990", plate2: "", phone1: "5416373733", phone2: "", block: "A1", apt: "1" },
    { name: "Canberk ÖZYOL", plate1: "67T0016", plate2: "67 DY 717", phone1: "5432522662", phone2: "5452522662", block: "A1", apt: "2" },
    { name: "Şükran Nur KARAKAYA", plate1: "37ACL269", plate2: "10DR369", phone1: "5076437198", phone2: "", block: "A1", apt: "3" },
    { name: "M. Tahir GÖKALP", plate1: "63ADE930", plate2: "", phone1: "5459282121", phone2: "", block: "A1", apt: "4" },
    { name: "Dinçer KASAP", plate1: "67AAN955", plate2: "", phone1: "5464149069", phone2: "5375572512", block: "A1", apt: "5" },
    { name: "Sedat POLAT", plate1: "67AEP880", plate2: "", phone1: "5315163029", phone2: "5350147789", block: "A1", apt: "6" },
    { name: "Alptuğ DOĞAN", plate1: "33ACD680", plate2: "", phone1: "5556042392", phone2: "", block: "A1", apt: "7" },
    { name: "ERDAL ÇİFTÇİ", plate1: "67EC088", plate2: "67ADJ625", phone1: "5436556765", phone2: "", block: "A1", apt: "10" },
    { name: "Doğan DOĞANAY", plate1: "67ZD671", plate2: "", phone1: "5393785784", phone2: "5444784254", block: "A1", apt: "11" },
    { name: "Utku ALKAN", plate1: "06BV865", plate2: "67EH350", phone1: "5317360680", phone2: "5377004222", block: "A1", apt: "12" },
    { name: "Cem KARAKAN", plate1: "67TC251", plate2: "", phone1: "5538865797", phone2: "", block: "A1", apt: "13" },
    { name: "İbrahim BİLGİN", plate1: "68DZ468", plate2: "", phone1: "5066710502", phone2: "", block: "A1", apt: "14" },
    { name: "Muhammed BİLGİN", plate1: "67AEP868", plate2: "67EH350", phone1: "5431929967", phone2: "5442320603", block: "A1", apt: "15" },
    { name: "Rabia ARSLAN", plate1: "67ADA338", plate2: "", phone1: "5345187152", phone2: "", block: "A1", apt: "16" },
    { name: "Elif DEMİRKIRAN", plate1: "67DP526", plate2: "", phone1: "5055625165", phone2: "5355113753", block: "A1", apt: "17" },
    { name: "METİN KUYUMCU", plate1: "67DR224", plate2: "67SK320", phone1: "5323455928", phone2: "5339464197", block: "A1", apt: "18" },
    { name: "İlkay BALABAN", plate1: "67AK166", plate2: "33ABK810", phone1: "5315535182", phone2: "5317126941", block: "A1", apt: "19" },
    { name: "BEHSAT CİNKILIÇ", plate1: "", plate2: "", phone1: "", phone2: "", block: "A1", apt: "20" },
    { name: "Oytun AYDOĞAN", plate1: "67DF457", plate2: "", phone1: "5319934453", phone2: "5357475535", block: "A1", apt: "21" },
    { name: "Erkan KORKMAZ", plate1: "67ADF021", plate2: "", phone1: "5053995857", phone2: "5063550500", block: "A1", apt: "22" },
    { name: "Okan ilkbahar", plate1: "34NOT14", plate2: "34NOT15", phone1: "5427462967", phone2: "", block: "A1", apt: "23" },
    { name: "Recep ÖRENLİ", plate1: "67AAP078", plate2: "", phone1: "5424956178", phone2: "5536786178", block: "A1", apt: "24" },
    { name: "Gülay KUZU", plate1: "06BE2670", plate2: "", phone1: "5063592337", phone2: "5054773324", block: "A1", apt: "25" },
    { name: "Metin ATILGAN", plate1: "67EF706", plate2: "", phone1: "5533720235", phone2: "5072576628", block: "A1", apt: "26" },
    { name: "Ali VARLIK", plate1: "34AGE387", plate2: "41AOE552", phone1: "5055439908", phone2: "5055439909", block: "A1", apt: "27" },
    { name: "Serkan BAŞ", plate1: "67ACF442", plate2: "", phone1: "5384044101", phone2: "", block: "A1", apt: "28" },
    { name: "Cihat SÖNMEZ", plate1: "34HM4502", plate2: "", phone1: "5426844814", phone2: "5511494754", block: "A1", apt: "29" },
    { name: "Merve YOĞURTÇU", plate1: "67AS133", plate2: "67DY979", phone1: "5385150592", phone2: "5371916958", block: "A1", apt: "30" },
    { name: "Şeref ALTUNKAYA", plate1: "67ACH122", plate2: "", phone1: "5321560454", phone2: "", block: "A1", apt: "31" },
    { name: "Mustafa ÖZTÜRK", plate1: "67ACN637", plate2: "", phone1: "5072540144", phone2: "5072629268", block: "A1", apt: "32" },
    { name: "HASAN ÇAKIR", plate1: "", plate2: "", phone1: "5416836167", phone2: "", block: "A1", apt: "33" },
    { name: "Fatih ÖZTÜRK", plate1: "67SF610", plate2: "", phone1: "5052671008", phone2: "5448219185", block: "A1", apt: "34" },
    { name: "Nizamettin TALAS", plate1: "34COU261", plate2: "", phone1: "5355553668", phone2: "", block: "A1", apt: "35" },
    
    { name: "Hikmet KIZILBOĞA", plate1: "34EOT105", plate2: "", phone1: "5308843505", phone2: "5392162111", block: "A2", apt: "2" },
    { name: "Serhat TURHAN", plate1: "34AH6747", plate2: "", phone1: "5052787245", phone2: "5052787244", block: "A2", apt: "3" },
    { name: "Aygül ATEŞ", plate1: "67ACH413", plate2: "", phone1: "5325625342", phone2: "5439144542", block: "A2", apt: "4" },
    { name: "Akın MANTARCI", plate1: "67AAK250", plate2: "67EH379", phone1: "5425505920", phone2: "5447930205", block: "A2", apt: "5" },
    { name: "Aydın BOZKURT", plate1: "34GAJ626", plate2: "", phone1: "5052748488", phone2: "5052593091", block: "A2", apt: "6" },
    { name: "Hüseyin AYDIN", plate1: "67ez990", plate2: "67AEC122", phone1: "5308806161", phone2: "5074711132", block: "A2", apt: "8" },
    { name: "Murat Can AYGUN", plate1: "67ACG376", plate2: "67ADV031", phone1: "5319267792", phone2: "5398246031", block: "A2", apt: "7" },
    { name: "Onur", plate1: "34FVT028", plate2: "", phone1: "5365099640", phone2: "", block: "A2", apt: "9" },
    { name: "Ufuk EMANET", plate1: "34HAC062", plate2: "", phone1: "5058048620", phone2: "5455706721", block: "A2", apt: "10" },
    { name: "Serhat Güngör", plate1: "67SG234", plate2: "", phone1: "5427100599", phone2: "5377378886", block: "A2", apt: "11" },
    { name: "Burak ARSLAN", plate1: "23EB316", plate2: "", phone1: "5075448586", phone2: "5073048531", block: "A2", apt: "12" },
    { name: "İlkay AKBAŞ", plate1: "67AAZ898", plate2: "67AR896", phone1: "5334902348", phone2: "", block: "A2", apt: "14" },
    { name: "İnan DURCAN", plate1: "67DP085", plate2: "67NK315", phone1: "5373898958", phone2: "5079413777", block: "A2", apt: "13" },
    { name: "Hasret UÇAR", plate1: "67ACG340", plate2: "06FA1281", phone1: "5071356795", phone2: "5545275335", block: "A2", apt: "16" },
    { name: "Sertan ULAŞ", plate1: "67EZ151", plate2: "67AAG674", phone1: "5436336379", phone2: "", block: "A2", apt: "15" },
    { name: "Şafak ATALI", plate1: "34DSR014", plate2: "", phone1: "5068800747", phone2: "", block: "A2", apt: "17" },
    { name: "Hadi AYDIN", plate1: "67AAE697", plate2: "67EC055", phone1: "5462920034", phone2: "5462920044", block: "A2", apt: "18" },
    { name: "Ali Rıza ALTUNCU", plate1: "34GYU190", plate2: "34DZL578", phone1: "5399101999", phone2: "5370263100", block: "A2", apt: "19" },
    { name: "Şahin SÖNMEZ", plate1: "78ABV347", plate2: "", phone1: "5419389794", phone2: "5522555878", block: "A2", apt: "20" },
    { name: "Fatih YILDIZ", plate1: "67ABJ482", plate2: "67DU296", phone1: "5469109606", phone2: "5538737510", block: "A2", apt: "22" },
    { name: "Oktay ÖZKAN", plate1: "81KB188", plate2: "", phone1: "5537769534", phone2: "", block: "A2", apt: "21" },
    { name: "Hilmi ERMİŞ", plate1: "", plate2: "", phone1: "5076384078", phone2: "", block: "A2", apt: "23" },
    { name: "Erdem KESKİN", plate1: "67EK770", plate2: "67ADU204", phone1: "5439575561", phone2: "5070766415", block: "A2", apt: "24" },
    { name: "Ali UÇAR", plate1: "67ET525", plate2: "67ET500", phone1: "5423779317", phone2: "5333053289", block: "A2", apt: "26" },
    { name: "Mehmet KUNDAKÇIOĞLU", plate1: "67ACH814", plate2: "", phone1: "5464940999", phone2: "", block: "A2", apt: "25" },
    { name: "Bülent ÇELEBİ", plate1: "67ADS720", plate2: "", phone1: "5322239212", phone2: "5445581512", block: "A2", apt: "27" },
    { name: "Oğuzhan ŞEN", plate1: "09SN088", plate2: "67ACR938", phone1: "5436794141", phone2: "5395920154", block: "A2", apt: "28" },
    { name: "Cihan ÇITAK", plate1: "34DMT684", plate2: "67ACS222", phone1: "5336743658", phone2: "5357346540", block: "A2", apt: "29" },
    { name: "Musa BASAN", plate1: "67NB030", plate2: "", phone1: "5332546225", phone2: "", block: "A2", apt: "30" },
    { name: "Erdinç DEMİRCİ", plate1: "67AAY007", plate2: "", phone1: "5437377784", phone2: "5394108875", block: "A2", apt: "31" },
    { name: "Semih YİRMİBEŞCİK", plate1: "67AF675", plate2: "", phone1: "5448607182", phone2: "5462208764", block: "A2", apt: "32" },
    { name: "Arif SOFUOĞLU", plate1: "35BUY159", plate2: "", phone1: "5055449228", phone2: "5309939229", block: "A2", apt: "33" },
    { name: "Tuğçe KÖKSAL", plate1: "67ADA931", plate2: "67EZ818", phone1: "5383178182", phone2: "5452860421", block: "A2", apt: "34" },
    
    { name: "Hakan DEMİRCİ", plate1: "34DJ2900", plate2: "67DU380", phone1: "5362152586", phone2: "", block: "B1", apt: "1" },
    { name: "Ramazan ALTAY", plate1: "", plate2: "", phone1: "5359345919", phone2: "5378765947", block: "B1", apt: "2" },
    { name: "Sevda BAYAR", plate1: "67ACJ968", plate2: "", phone1: "5340233624", phone2: "", block: "B1", apt: "3" },
    { name: "Hamza KAYA", plate1: "67ADG654", plate2: "", phone1: "5349258865", phone2: "5396612723", block: "B1", apt: "4" },
    { name: "Şahin YENER", plate1: "66AAG444", plate2: "34FYP656", phone1: "5056522607", phone2: "5078171635", block: "B1", apt: "5" },
    { name: "Feride BÜKLÜ", plate1: "67NC905", plate2: "", phone1: "5324682421", phone2: "5308516700", block: "B1", apt: "6" },
    { name: "Kerem KAZAN", plate1: "34CVC749", plate2: "06 meg 424", phone1: "5327789465", phone2: "5387331706", block: "B1", apt: "8" },
    { name: "Sedat MANDIRACI", plate1: "67ED657", plate2: "", phone1: "5355979111", phone2: "5388908602", block: "B1", apt: "10" },
    { name: "Deniz ÇALICIOĞLU", plate1: "67DR534", plate2: "67ABF586", phone1: "5058668506", phone2: "5301781036", block: "B1", apt: "9" },
    { name: "Erkan GÜRGEN", plate1: "67LP078", plate2: "", phone1: "5301818167", phone2: "5061818167", block: "B1", apt: "11" },
    { name: "Yasin KAYA", plate1: "34LJ6904", plate2: "67ADT385", phone1: "5324342467", phone2: "5320532483", block: "B1", apt: "12" },
    { name: "Mahmut GÜLAY", plate1: "67ACS169", plate2: "67AJ103", phone1: "5306107061", phone2: "5413726706", block: "B1", apt: "14" },
    { name: "Özgür AYDIN", plate1: "07GTB67", plate2: "", phone1: "5062716767", phone2: "5370237867", block: "B1", apt: "13" },
    { name: "Kürşad BAYIRHAN", plate1: "34BB2320", plate2: "", phone1: "5062645886", phone2: "5062904117", block: "B1", apt: "15" },
    { name: "Emrah Şen", plate1: "34GU0801", plate2: "", phone1: "5075102830", phone2: "5422826623", block: "B1", apt: "16" },
    { name: "Tolga UZUN", plate1: "67 ADE 205", plate2: "67 ES 017", phone1: "5468001611", phone2: "5309319464", block: "B1", apt: "17" },
    { name: "Çağrı ÖZ", plate1: "67DD010", plate2: "06BNP390", phone1: "5535440095", phone2: "5071150648", block: "B1", apt: "18" },
    { name: "Hasan ÖZYÜREK", plate1: "34DJY745", plate2: "", phone1: "5380540672", phone2: "5050704766", block: "B1", apt: "19" },
    { name: "Süleyman TOPALOĞLU", plate1: "67FC008", plate2: "", phone1: "5322374252", phone2: "5392269561", block: "B1", apt: "20" },
    { name: "Numan ÜSTÜN", plate1: "06BB2418", plate2: "", phone1: "5414102276", phone2: "5433292351", block: "B1", apt: "21" },
    { name: "Selim KÜÇÜK", plate1: "67SB090", plate2: "34FUD083", phone1: "5535048718", phone2: "5078197351", block: "B1", apt: "22" },
    { name: "Fatih BİLGİN", plate1: "67 AAZ 391", plate2: "67 DB 019", phone1: "5413611544", phone2: "", block: "B1", apt: "23" },
    { name: "Ferya DARICI", plate1: "", plate2: "", phone1: "", phone2: "", block: "B1", apt: "24" },
    { name: "Ahmet AKTAŞ", plate1: "67ADK483", plate2: "", phone1: "5526364966", phone2: "5526362667", block: "B1", apt: "25" },
    { name: "Sedat YÜKSEL", plate1: "67AES698", plate2: "", phone1: "5324356091", phone2: "5339631983", block: "B1", apt: "26" },
    { name: "İlkay KAYA", plate1: "54FB189", plate2: "34DPJ789", phone1: "5514567151", phone2: "5012987173", block: "B1", apt: "27" },
    { name: "Hakan DEMİRAY", plate1: "67AD566", plate2: "34NGN310", phone1: "5356478890", phone2: "5412348161", block: "B1", apt: "28" },
    { name: "Aydın Yiğit Ergün", plate1: "32ADG256", plate2: "32ACF160", phone1: "5527067671", phone2: "5548152102", block: "B1", apt: "29" },
    { name: "Sait ASLAN", plate1: "67SB144", plate2: "", phone1: "5395725444", phone2: "5437620804", block: "B1", apt: "30" },
    { name: "Cemalettin BAYDAĞ", plate1: "67ABB044", plate2: "34EDT532", phone1: "552089555", phone2: "5444839550", block: "B1", apt: "31" },
    { name: "Ali Rıza KILIÇ", plate1: "67AH342", plate2: "", phone1: "5055114357", phone2: "", block: "B1", apt: "32" },

    { name: "Cansın KILIÇ (MARKET)", plate1: "67ACJ182", plate2: "", phone1: "5309350467", phone2: "", block: "B2", apt: "1" },
    { name: "Mehmet Ali Erdemir", plate1: "37 adu 495", plate2: "67ADN538", phone1: "5493800037", phone2: "5354586752", block: "B2", apt: "2" },
    { name: "Yılmaz YANIK", plate1: "34EZ0641", plate2: "", phone1: "5395977590", phone2: "5395977590", block: "B2", apt: "3" },
    { name: "Mustafa DURMUŞ", plate1: "67YD150", plate2: "", phone1: "5065849046", phone2: "5065849047", block: "B2", apt: "4" },
    { name: "Mustafa ÜSTÜNSOY", plate1: "67ACR522", plate2: "", phone1: "5348742842", phone2: "", block: "B2", apt: "5" },
    { name: "Muhammed Ali CEYHAN", plate1: "23DM863", plate2: "", phone1: "5350414346", phone2: "5373038432", block: "B2", apt: "8" },
    { name: "Memduh KÖSE", plate1: "67ACV926", plate2: "", phone1: "5050191032", phone2: "5419265658", block: "B2", apt: "9" },
    { name: "MURAT KAMER", plate1: "67DK997", plate2: "", phone1: "5306639986", phone2: "", block: "B2", apt: "10" },
    { name: "Hakan BİRCAN", plate1: "56AAD807", plate2: "", phone1: "5076202484", phone2: "", block: "B2", apt: "11" },
    { name: "Betül AYGÜN", plate1: "61LK841", plate2: "61ACG171", phone1: "5458665352", phone2: "5321355615", block: "B2", apt: "13" },
    { name: "Enes KARAOĞLU", plate1: "", plate2: "", phone1: "5352801940", phone2: "5432405581", block: "B2", apt: "12" },
    { name: "Selçuk KALEMBAŞI", plate1: "67SB996", plate2: "34HG1530", phone1: "5532116785", phone2: "", block: "B2", apt: "14" },
    { name: "Ali ÖZTÜRK", plate1: "67ADN290", plate2: "", phone1: "5396403273", phone2: "5434308911", block: "B2", apt: "15" },
    { name: "Ali ALPARSLAN", plate1: "67ER225", plate2: "", phone1: "5413476818", phone2: "5432160095", block: "B2", apt: "16" },
    { name: "Hakkı PEHLİVAN", plate1: "67AES043", plate2: "", phone1: "5075776837", phone2: "5058999137", block: "B2", apt: "17" },
    { name: "Burak YAYLA", plate1: "67ADM583", plate2: "67ACD257", phone1: "5393764799", phone2: "5428925500", block: "B2", apt: "19" },
    { name: "Emre DEMİR", plate1: "74AAV317", plate2: "67TK485", phone1: "5445828761", phone2: "5436696019", block: "B2", apt: "18" },
    { name: "Fatih ATAY", plate1: "67AY726", plate2: "", phone1: "5432769860", phone2: "", block: "B2", apt: "21" },
    { name: "Mürsel HAZALOĞLU", plate1: "19ABE393", plate2: "43DR101", phone1: "5422638408", phone2: "5535104711", block: "B2", apt: "20" },
    { name: "Bülent Karakaya", plate1: "06EF8112", plate2: "06GD8112", phone1: "5365110322", phone2: "5358446883", block: "B2", apt: "23" },
    { name: "Alkan KOCAADAM", plate1: "67ADE880", plate2: "", phone1: "5301369167", phone2: "5346005372", block: "B2", apt: "22" },
    { name: "Alaattin ÖZTÜRK", plate1: "67AAT773", plate2: "", phone1: "5052352905", phone2: "5300226467", block: "B2", apt: "24" },
    { name: "KAZIM KIRAN", plate1: "67AAY047", plate2: "67YC773", phone1: "5072084806", phone2: "5437730767", block: "B2", apt: "25" },
    { name: "Özlem PETÜK", plate1: "67DP668", plate2: "", phone1: "5317902997", phone2: "", block: "B2", apt: "26" },
    { name: "Emre ZİLAN", plate1: "67AAZ788", plate2: "67FB008", phone1: "5314387639", phone2: "5314387639", block: "B2", apt: "27" },
    { name: "Mehmet Demirkurt", plate1: "67TM111", plate2: "", phone1: "5315778871", phone2: "5306319483", block: "B2", apt: "28" },
    { name: "Muhammed YALAZ", plate1: "34EE9974", plate2: "67ACV727", phone1: "5336718676", phone2: "5534058767", block: "B2", apt: "29" },
    { name: "Zihni YAMAK", plate1: "67AAT287", plate2: "67ABG815", phone1: "5053563144", phone2: "5445680081", block: "B2", apt: "30" },
    { name: "Şuayip EROĞLU", plate1: "06REK61", plate2: "", phone1: "5052722433", phone2: "5052722411", block: "B2", apt: "31" },
    { name: "Erdal CİHAN", plate1: "67EC003", plate2: "", phone1: "5326049867", phone2: "5432109639", block: "B2", apt: "32" },
    { name: "Gökhan EROĞLU", plate1: "67AFP032", plate2: "", phone1: "5412506166", phone2: "5073779223", block: "B2", apt: "33" },

    { name: "Emre ŞAHİN", plate1: "67SH310", plate2: "67AAS322", phone1: "5534120596", phone2: "5427493929", block: "C1", apt: "1" },
    { name: "Bilgehan Sarı", plate1: "67ACN909", plate2: "67ABE928", phone1: "5333781717", phone2: "", block: "C1", apt: "2" },
    { name: "Ersin YILMAZ", plate1: "67ABU259", plate2: "67NL671", phone1: "5355143322", phone2: "5343892272", block: "C1", apt: "3" },
    { name: "Yunus Emre ÖZDEMİR", plate1: "41YH377", plate2: "", phone1: "5314516190", phone2: "5456489101", block: "C1", apt: "5" },
    { name: "Sefa ARSLAN", plate1: "67AEH365", plate2: "", phone1: "5345217268", phone2: "", block: "C1", apt: "6" },
    { name: "Yahya HEKİM", plate1: "06CYT531", plate2: "67AAF833", phone1: "5447272412", phone2: "", block: "C1", apt: "7" },
    { name: "Ali NAYİR", plate1: "67TS617", plate2: "", phone1: "5532669285", phone2: "5520797726", block: "C1", apt: "9" },
    { name: "Ertan FİDAN", plate1: "67 BF 300", plate2: "", phone1: "5417208055", phone2: "5385293108", block: "C1", apt: "10" },
    { name: "Ceyhun İNCE", plate1: "67AG066", plate2: "", phone1: "5446686428", phone2: "5465918987", block: "C1", apt: "12" },
    { name: "Ayhan YEŞİL", plate1: "34YSL67", plate2: "34EJK760", phone1: "5325866362", phone2: "", block: "C1", apt: "13" },
    { name: "Sadettin KARABULUT", plate1: "67ACV913", plate2: "", phone1: "5374941692", phone2: "5319369134", block: "C1", apt: "14" },
    { name: "Ali Poyraz", plate1: "67 AT 112", plate2: "", phone1: "5303244067", phone2: "", block: "C1", apt: "15" },
    { name: "Zekai ÇAĞLAR", plate1: "", plate2: "", phone1: "5411257467", phone2: "", block: "C1", apt: "16" },
    { name: "Mustafa Kaan USLU", plate1: "06DBF578", plate2: "", phone1: "5054542308", phone2: "5076000873", block: "C1", apt: "18" },
    { name: "Ahmet Fevzi KURU", plate1: "67DR007", plate2: "74AAH555", phone1: "5434552856", phone2: "5462572329", block: "C1", apt: "19" },
    { name: "Murat ASDARLI", plate1: "67ADN486", plate2: "", phone1: "5375243604", phone2: "5553331451", block: "C1", apt: "20" },
    { name: "Özkan ÖZTÜRK", plate1: "34HKV276", plate2: "06EU4971", phone1: "5067408341", phone2: "5365981279", block: "C1", apt: "21" },
    { name: "Mesut BAYRAKTAR", plate1: "71BG519", plate2: "48DD853", phone1: "5539584849", phone2: "", block: "C1", apt: "23" },
    { name: "Emre Can SARIHAN", plate1: "67ADF680", plate2: "67ADE547", phone1: "5417954101", phone2: "", block: "C1", apt: "24" },
    { name: "Ayman BÜYÜKOĞLU", plate1: "06VMR67", plate2: "34EVC332", phone1: "5325147648", phone2: "5353510669", block: "C1", apt: "25" },
    { name: "Ufuk TOK", plate1: "06CUC992", plate2: "", phone1: "5469500660", phone2: "5548687619", block: "C1", apt: "26" },
    { name: "Tuncay SARIOĞLU", plate1: "67TR607", plate2: "", phone1: "5459231458", phone2: "", block: "C1", apt: "27" },
    { name: "Enes SERBEST", plate1: "06P3292", plate2: "", phone1: "5380809969", phone2: "", block: "C1", apt: "28" },
    { name: "Mesut KARACA", plate1: "67ADG546", plate2: "", phone1: "5357087699", phone2: "", block: "C1", apt: "29" },
    { name: "Sertaç BALTA", plate1: "67SB048", plate2: "67SB044", phone1: "5325263433", phone2: "", block: "C1", apt: "30" },
    { name: "Zafer YAVUZ", plate1: "67ZH420", plate2: "67TY489", phone1: "5344191290", phone2: "5304417167", block: "C1", apt: "31" },
    { name: "Tuğba Nihal Erhan", plate1: "06DSH264", plate2: "34DPM239", phone1: "5437861409", phone2: "5539036614", block: "C1", apt: "32" },

    { name: "Adil KAYHAN", plate1: "67 ADC 322", plate2: "", phone1: "5383581674", phone2: "5551673433", block: "C2", apt: "1" },
    { name: "Eray AYDEMİR", plate1: "67ACN126", plate2: "", phone1: "5315509083", phone2: "5423043135", block: "C2", apt: "2" },
    { name: "Osman TAŞKIRAN", plate1: "67EU706", plate2: "", phone1: "5337011464", phone2: "5392338108", block: "C2", apt: "3" },
    { name: "Birol Özkul", plate1: "67NB323", plate2: "34ERB681", phone1: "5074718161", phone2: "5303178167", block: "C2", apt: "5" },
    { name: "Burak KAYA", plate1: "06ACT193", plate2: "", phone1: "5070356007", phone2: "", block: "C2", apt: "6" },
    { name: "Serhat SEVİM", plate1: "67ES963", plate2: "", phone1: "5443320261", phone2: "", block: "C2", apt: "8" },
    { name: "Erdal KIRINTI", plate1: "67AEY119", plate2: "67ACV035", phone1: "5071652489", phone2: "5071652489", block: "C2", apt: "9" },
    { name: "Nurgül SÖNMEZ", plate1: "40AAD456", plate2: "", phone1: "5052338336", phone2: "", block: "C2", apt: "11" },
    { name: "İismail ÖRSEL", plate1: "67AEZ583", plate2: "", phone1: "5543313111", phone2: "5363987870", block: "C2", apt: "12" },
    { name: "Ayman BÜYÜKOĞLU", plate1: "34ECV332", plate2: "", phone1: "5325147648", phone2: "", block: "C2", apt: "14" },
    { name: "Eda ak", plate1: "74AAB922", plate2: "", phone1: "5316533750", phone2: "", block: "C2", apt: "15" },
    { name: "Oğuzhan AKYOL", plate1: "67AK215", plate2: "06ENK879", phone1: "5064813956", phone2: "5319902067", block: "C2", apt: "16" },
    { name: "Alper ATEŞ", plate1: "06DLN437", plate2: "67M0031", phone1: "5422476167", phone2: "5380200480", block: "C2", apt: "17" },
    { name: "Hasan MUTLU", plate1: "07BPF730", plate2: "", phone1: "5317465162", phone2: "", block: "C2", apt: "19" },
    { name: "Uğur YANIK", plate1: "67DB500", plate2: "", phone1: "5351045365", phone2: "5437379506", block: "C2", apt: "20" },
    { name: "İlbay KILIÇ", plate1: "67AES017", plate2: "", phone1: "5313463534", phone2: "5373971405", block: "C2", apt: "21" },
    { name: "Erdal HATİLOĞLU", plate1: "FN013EF", plate2: "", phone1: "33663529272", phone2: "", block: "C2", apt: "22" },
    { name: "Okan GENÇ", plate1: "41DR216", plate2: "41 SA 625", phone1: "5358289895", phone2: "5312572514", block: "C2", apt: "23" },
    { name: "Kureyş GÖÇMEN", plate1: "25ADR667", plate2: "", phone1: "5358210523", phone2: "", block: "C2", apt: "24" },
    { name: "Emrah DEMİRCİ", plate1: "67AR461", plate2: "", phone1: "5446686457", phone2: "5069311006", block: "C2", apt: "25" },
    { name: "Suat ATAYAN", plate1: "67AAV422", plate2: "", phone1: "5363946569", phone2: "5421992075", block: "C2", apt: "26" },
    { name: "Ahmet UNCU", plate1: "67AG607", plate2: "78ABY409", phone1: "5428410067", phone2: "5321783628", block: "C2", apt: "27" },
    { name: "Sevim BAŞAR", plate1: "34RY0923", plate2: "", phone1: "5056336209", phone2: "", block: "C2", apt: "28" },
    { name: "Buse SARAL", plate1: "67UB094", plate2: "67ABS887", phone1: "5321378775", phone2: "5307202873", block: "C2", apt: "29" },
    { name: "Yasin Gökmen", plate1: "06CIL017", plate2: "", phone1: "5536839026", phone2: "5062894812", block: "C2", apt: "30" },
    { name: "Asilkan ÖZYURT", plate1: "34GEN305", plate2: "", phone1: "5320659767", phone2: "", block: "C2", apt: "31" },
    { name: "Ünal ÖZDEMİR", plate1: "DUKM101", plate2: "DUKM121", phone1: "5397284376", phone2: "", block: "C2", apt: "32" },
];

export const users: User[] = [
    { 
        id: 1, 
        name: 'Yönetici', 
        email: 'admin@site.com', 
        password: 'admin67', 
        role: 'Yönetici', 
        isActive: true,
        lastLogin: 'Şimdi', 
        notificationPreferences: defaultPreferences 
    }
];

rawResidents.forEach((res, index) => {
    let email = "";
    
    // ÖZEL DURUM: Gökhan EROĞLU kullanıcısı için talep edilen e-posta set edilir.
    if (res.name === "Gökhan EROĞLU") {
        email = "gokhaneroglu@gmail.com";
    } else {
        const emailName = res.name.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '') + (index + 100);
        email = `${emailName}@site.com`;
    }

    users.push({
        id: index + 100, 
        name: formatNameSurname(res.name), 
        email: email,
        password: res.phone1 ? res.phone1.trim() : '123456',
        role: 'Daire Sahibi', 
        isActive: true,
        lastLogin: 'Giriş yapılmadı',
        vehiclePlate1: res.plate1,
        vehiclePlate2: res.plate2,
        contactNumber1: res.phone1,
        contactNumber2: res.phone2,
        notificationPreferences: defaultPreferences
    });
});

export const mockAnnouncements: Announcement[] = [
    { id: 1, title: 'Yeni Yönetim Sistemi', content: 'Yeni site yönetim sistemimiz aktif edilmiştir. Tüm sakinlerimizin bilgileri güncellenmiştir. Giriş için mail adresinizi veya cep telefonu numaranızı kullanabilirsiniz. Şifreniz varsayılan olarak sistemde kayıtlı olan birinci telefon numaranızdır.', date: new Date().toLocaleDateString('tr-TR') },
];

const generateApartments = (blockName: string, count: number): Apartment[] => {
    return Array.from({ length: count }, (_, i) => {
        const aptNumber = (i + 1).toString();
        const rawResIndex = rawResidents.findIndex(r => r.block === blockName && r.apt === aptNumber);
        
        let residentId: number | undefined = undefined;
        let status: 'Boş' | 'Dolu' = 'Boş';

        if (rawResIndex !== -1) {
            residentId = rawResIndex + 100; 
            status = 'Dolu';
        }

        return {
            id: parseInt(`${blockName.charCodeAt(0)}${blockName.charCodeAt(1) || 0}${100 + i}`),
            number: aptNumber,
            status: status,
            residentId: residentId
        };
    });
};

export const mockBlocks: Block[] = [
    { id: 1, name: 'A1 Blok', apartments: generateApartments('A1', 35) },
    { id: 2, name: 'A2 Blok', apartments: generateApartments('A2', 34) },
    { id: 3, name: 'B1 Blok', apartments: generateApartments('B1', 32) },
    { id: 4, name: 'B2 Blok', apartments: generateApartments('B2', 33) },
    { id: 5, name: 'C1 Blok', apartments: generateApartments('C1', 32) },
    { id: 6, name: 'C2 Blok', apartments: generateApartments('C2', 32) }
];
