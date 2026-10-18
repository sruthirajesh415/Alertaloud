export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
}

// 1. Core global & regional languages with verified native names
export const PRIORITY_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", region: "Kerala, India" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "Tamil Nadu, India / Sri Lanka / Singapore" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "India" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "Andhra Pradesh / Telangana, India" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "Karnataka, India" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "West Bengal / Bangladesh" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "Maharashtra, India" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "Gujarat, India" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "Punjab, India" },
  { code: "ur", name: "Urdu", nativeName: "اردو", region: "South Asia" },
  { code: "es", name: "Spanish", nativeName: "Español", region: "Spain / Latin America" },
  { code: "fr", name: "French", nativeName: "Français", region: "France / Africa / Canada" },
  { code: "de", name: "German", nativeName: "Deutsch", region: "Germany / Austria / Switzerland" },
  { code: "ja", name: "Japanese", nativeName: "日本語", region: "Japan" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "中文 (简体)", region: "China / Singapore" },
  { code: "ar", name: "Arabic", nativeName: "العربية", region: "Middle East / North Africa" },
  { code: "pt", name: "Portuguese", nativeName: "Português", region: "Brazil / Portugal" },
  { code: "ru", name: "Russian", nativeName: "Русский", region: "Russia / Eastern Europe" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", region: "Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", region: "Malaysia / Singapore" },
  { code: "ko", name: "Korean", nativeName: "한국어", region: "South Korea" },
  { code: "it", name: "Italian", nativeName: "Italiano", region: "Italy" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", region: "Turkey" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", region: "Vietnam" },
  { code: "th", name: "Thai", nativeName: "ไทย", region: "Thailand" },
  { code: "tl", name: "Tagalog / Filipino", nativeName: "Filipino", region: "Philippines" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", region: "Netherlands / Belgium" },
  { code: "pl", name: "Polish", nativeName: "Polski", region: "Poland" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", region: "Ukraine" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", region: "East Africa" },
];

// 2. Full 100+ world language codes
export const ALL_WORLD_LANGUAGE_CODES = [
  "af", "am", "ar", "as", "az", "be", "bg", "bn", "bs", "ca",
  "ceb", "co", "cs", "cy", "da", "de", "el", "en", "eo", "es",
  "et", "eu", "fa", "fi", "fil", "fr", "fy", "ga", "gd", "gl",
  "gu", "ha", "haw", "he", "hi", "hmn", "hr", "ht", "hu", "hy",
  "id", "ig", "is", "it", "ja", "jv", "ka", "kk", "km", "kn",
  "ko", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi",
  "mk", "ml", "mn", "mr", "ms", "mt", "my", "ne", "nl", "no",
  "ny", "or", "pa", "pl", "ps", "pt", "ro", "ru", "rw", "sd",
  "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "st", "su",
  "sv", "sw", "ta", "te", "tg", "th", "tk", "tl", "tr", "tt",
  "ug", "uk", "ur", "uz", "vi", "xh", "yi", "yo", "zh", "zu"
];

// Helper to get formatted list of all world languages
export function getAllWorldLanguages(): LanguageOption[] {
  const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
  
  const map = new Map<string, LanguageOption>();
  for (const item of PRIORITY_LANGUAGES) {
    map.set(item.code, item);
  }

  for (const code of ALL_WORLD_LANGUAGE_CODES) {
    if (!map.has(code)) {
      try {
        const nativeNames = new Intl.DisplayNames([code], { type: "language" });
        const name = languageNames.of(code) || code;
        const nativeName = nativeNames.of(code) || name;
        map.set(code, { code, name, nativeName });
      } catch {
        map.set(code, { code, name: code.toUpperCase(), nativeName: code.toUpperCase() });
      }
    }
  }

  return Array.from(map.values());
}

// 3. Auto-detect native language based on Country and State/Region
export function detectNativeLanguage(country: string, state: string): LanguageOption {
  const c = (country || "").toLowerCase();
  const s = (state || "").toLowerCase();

  // India State-by-State regional detection
  if (c.includes("india")) {
    if (s.includes("kerala")) return PRIORITY_LANGUAGES.find(l => l.code === "ml")!;
    if (s.includes("tamil nadu")) return PRIORITY_LANGUAGES.find(l => l.code === "ta")!;
    if (s.includes("karnataka")) return PRIORITY_LANGUAGES.find(l => l.code === "kn")!;
    if (s.includes("andhra") || s.includes("telangana")) return PRIORITY_LANGUAGES.find(l => l.code === "te")!;
    if (s.includes("maharashtra") || s.includes("mumbai") || s.includes("pune")) return PRIORITY_LANGUAGES.find(l => l.code === "mr")!;
    if (s.includes("gujarat")) return PRIORITY_LANGUAGES.find(l => l.code === "gu")!;
    if (s.includes("bengal") || s.includes("kolkata")) return PRIORITY_LANGUAGES.find(l => l.code === "bn")!;
    if (s.includes("punjab")) return PRIORITY_LANGUAGES.find(l => l.code === "pa")!;
    if (s.includes("odisha") || s.includes("orissa")) return PRIORITY_LANGUAGES.find(l => l.code === "or")!;
    return PRIORITY_LANGUAGES.find(l => l.code === "hi")!;
  }

  // Global country mappings
  if (c.includes("japan")) return PRIORITY_LANGUAGES.find(l => l.code === "ja")!;
  if (c.includes("germany") || c.includes("austria") || c.includes("switzerland")) return PRIORITY_LANGUAGES.find(l => l.code === "de")!;
  if (c.includes("france") || c.includes("belgium")) return PRIORITY_LANGUAGES.find(l => l.code === "fr")!;
  if (c.includes("spain") || c.includes("mexico") || c.includes("colombia") || c.includes("argentina") || c.includes("chile") || c.includes("peru")) return PRIORITY_LANGUAGES.find(l => l.code === "es")!;
  if (c.includes("brazil") || c.includes("portugal")) return PRIORITY_LANGUAGES.find(l => l.code === "pt")!;
  if (c.includes("italy")) return PRIORITY_LANGUAGES.find(l => l.code === "it")!;
  if (c.includes("russia")) return PRIORITY_LANGUAGES.find(l => l.code === "ru")!;
  if (c.includes("china") || c.includes("taiwan")) return PRIORITY_LANGUAGES.find(l => l.code === "zh")!;
  if (c.includes("indonesia")) return PRIORITY_LANGUAGES.find(l => l.code === "id")!;
  if (c.includes("malaysia")) return PRIORITY_LANGUAGES.find(l => l.code === "ms")!;
  if (c.includes("korea")) return PRIORITY_LANGUAGES.find(l => l.code === "ko")!;
  if (c.includes("turkey") || c.includes("türkiye")) return PRIORITY_LANGUAGES.find(l => l.code === "tr")!;
  if (c.includes("vietnam")) return PRIORITY_LANGUAGES.find(l => l.code === "vi")!;
  if (c.includes("thailand")) return PRIORITY_LANGUAGES.find(l => l.code === "th")!;
  if (c.includes("philippines")) return PRIORITY_LANGUAGES.find(l => l.code === "tl")!;
  if (c.includes("saudi") || c.includes("emirates") || c.includes("dubai") || c.includes("egypt") || c.includes("qatar")) return PRIORITY_LANGUAGES.find(l => l.code === "ar")!;
  if (c.includes("netherlands")) return PRIORITY_LANGUAGES.find(l => l.code === "nl")!;
  if (c.includes("poland")) return PRIORITY_LANGUAGES.find(l => l.code === "pl")!;
  if (c.includes("ukraine")) return PRIORITY_LANGUAGES.find(l => l.code === "uk")!;

  // Default to English
  return PRIORITY_LANGUAGES.find(l => l.code === "en")!;
}

// 4. UI dictionary for instantaneous navigation & labels across top languages
export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    tagline: "One alert. Everything you need. Read aloud.",
    safeStatus: "Safe — No Active Official Alerts",
    safeSubtext: "All verified civil defense and meteorological feeds are normal in your region.",
    tabHome: "Home",
    tabAlerts: "Alerts",
    tabGuides: "Guides",
    tabAsk: "Ask",
    tabProfile: "Profile",
    readAloud: "Read Aloud",
    stopAudio: "Stop Audio",
    reportEmergency: "Report / Handle Emergency Now",
    callHelpline: "Emergency Helplines",
    simulateAlert: "Test / Simulate Alert",
    subOverview: "Overview",
    subWhatToDo: "What to do",
    subWhatToTake: "What to take",
    subWhereToGo: "Where to go",
    subWhomToCall: "Whom to call",
    verifiedOfficial: "Verified Official Government Guidelines",
    practicalFallback: "AI Practical Emergency Steps (Red Cross Standard)",
    shareRescueCard: "Share Family Rescue Card with Authorities",
    rescueCardSharedSuccess: "Family Rescue Card transmitted to Local Control Room",
    officialsPortal: "Officials' Control Room",
    enterPin: "Enter 4-Digit Officials PIN",
    changeLocation: "Change Location",
    whatsappSos: "WhatsApp Neighbour SOS",
    recordingAudio: "Recording Voice SOS (30s max)...",
    recordVoice: "Record 30s Voice SOS",
  },
  ml: {
    tagline: "ഒരു മുന്നറിയിപ്പ്. നിങ്ങൾക്കാവശ്യമായതെല്ലാം. ഉച്ചത്തിൽ കേൾക്കാം.",
    safeStatus: "സുരക്ഷിതം — സജീവമായ ഔദ്യോഗിക മുന്നറിയിപ്പുകളൊന്നുമില്ല",
    safeSubtext: "നിങ്ങളുടെ പ്രദേശത്ത് എല്ലാ സിവിൽ ഡിഫൻസ് റിപ്പോർട്ടുകളും സാധാരണ നിലയിലാണ്.",
    tabHome: "ഹോം",
    tabAlerts: "മുന്നറിയിപ്പുകൾ",
    tabGuides: "മാർഗ്ഗനിർദ്ദേശങ്ങൾ",
    tabAsk: "ചോദിക്കൂ",
    tabProfile: "പ്രൊഫൈൽ",
    readAloud: "വായിച്ചു കേൾക്കൂ",
    stopAudio: "നിർത്തുക",
    reportEmergency: "അടിയന്തര സാഹചര്യം ഉടൻ റിപ്പോർട്ട് ചെയ്യുക",
    callHelpline: "അടിയന്തര ഹെൽപ്പ്‌ലൈനുകൾ",
    simulateAlert: "മുന്നറിയിപ്പ് പരീക്ഷിക്കുക",
    subOverview: "അവലോകനം",
    subWhatToDo: "ചെയ്യേണ്ട കാര്യങ്ങൾ",
    subWhatToTake: "എടുക്കേണ്ട വസ്തുക്കൾ",
    subWhereToGo: "എങ്ങോട്ട് പോകണം",
    subWhomToCall: "ആരെ വിളിക്കണം",
    verifiedOfficial: "സ്ഥിരീകരിച്ച ഔദ്യോഗിക സർക്കാർ മാർഗ്ഗനിർദ്ദേശങ്ങൾ",
    practicalFallback: "AI പ്രായോഗിക ഘട്ടങ്ങൾ (റെഡ് ക്രോസ് മാനദണ്ഡം)",
    shareRescueCard: "കുടുംബ റെസ്ക്യൂ കാർഡ് അധികാരികൾക്ക് അയയ്ക്കുക",
    rescueCardSharedSuccess: "കൺട്രോൾ റൂമിലേക്ക് റെസ്ക്യൂ കാർഡ് വിജയകരമായി അയച്ചു",
    officialsPortal: "അധികാരികളുടെ കൺട്രോൾ റൂം",
    enterPin: "4 അക്ക കൺട്രോൾ റൂം പിൻ നൽകുക",
    changeLocation: "സ്ഥലം മാറ്റുക",
    whatsappSos: "അയൽവാസികൾക്ക് വാട്സ്ആപ്പ് SOS",
    recordingAudio: "വോയ്‌സ് SOS റെക്കോർഡ് ചെയ്യുന്നു (30 സെക്കൻഡ്)...",
    recordVoice: "30 സെക്കൻഡ് വോയ്‌സ് SOS റെക്കോർഡ് ചെയ്യുക",
  },
  ta: {
    tagline: "ஒரு எச்சரிக்கை. உங்களுக்கு தேவையான அனைத்தும். குரல் வழிகாட்டி.",
    safeStatus: "பாதுகாப்பானது — தீவிர அரசு எச்சரிக்கைகள் இல்லை",
    safeSubtext: "உங்கள் பகுதியில் உள்ள அனைத்து அதிகாரப்பூர்வ அவசர அறிவிப்புகளும் இயல்பாக உள்ளன.",
    tabHome: "முகப்பு",
    tabAlerts: "எச்சரிக்கைகள்",
    tabGuides: "வழிகாட்டிகள்",
    tabAsk: "கேளுங்கள்",
    tabProfile: "சுயவிவரம்",
    readAloud: "வாசித்துக் காட்டு",
    stopAudio: "நிறுத்து",
    reportEmergency: "அவசரநிலையை உடனே அறிவியுங்கள்",
    callHelpline: "அவசர உதவி எண்கள்",
    simulateAlert: "சோதனை எச்சரிக்கை",
    subOverview: "கண்ணோட்டம்",
    subWhatToDo: "என்ன செய்ய வேண்டும்",
    subWhatToTake: "எடுத்துச்செல்ல வேண்டியவை",
    subWhereToGo: "எங்கு செல்ல வேண்டும்",
    subWhomToCall: "யாரை அழைக்க வேண்டும்",
    verifiedOfficial: "சரிபார்க்கப்பட்ட அரசு வழிகாட்டுதல்கள்",
    practicalFallback: "AI அவசர உதவி வழிகாட்டல் (ரெட் கிராஸ் தரம்)",
    shareRescueCard: "மீட்பு அட்டையை அதிகாரிகளுடன் பகிரவும்",
    rescueCardSharedSuccess: "மீட்புக் குழுவுக்குத் தகவல் அனுப்பப்பட்டது",
    officialsPortal: "அதிகாரிகள் கட்டுப்பாட்டு அறை",
    enterPin: "4-இலக்க பின்னை உள்ளிடவும்",
    changeLocation: "இருப்பிடத்தை மாற்றவும்",
    whatsappSos: "அண்டை வீட்டாருக்கு வாட்ஸ்அப் SOS",
    recordingAudio: "குரல் SOS பதிவு செய்யப்படுகிறது...",
    recordVoice: "30 நொடி குரல் SOS பதிவுசெய்",
  },
  hi: {
    tagline: "एक चेतावनी। आपकी हर जरूरत। बोलकर सुनाया गया।",
    safeStatus: "सुरक्षित — कोई सक्रिय आधिकारिक चेतावनी नहीं",
    safeSubtext: "आपके क्षेत्र में सभी मौसम एवं नागरिक सुरक्षा मानक सामान्य हैं।",
    tabHome: "होम",
    tabAlerts: "चेतावनी",
    tabGuides: "गाइड",
    tabAsk: "पूछें",
    tabProfile: "प्रोफ़ाइल",
    readAloud: "सुनें (बोलकर बताएं)",
    stopAudio: "रोकें",
    reportEmergency: "आपातकाल की तुरंत सूचना दें",
    callHelpline: "आपातकालीन हेल्पलाइन",
    simulateAlert: "चेतावनी का परीक्षण करें",
    subOverview: "विवरण",
    subWhatToDo: "क्या करें",
    subWhatToTake: "क्या साथ लें",
    subWhereToGo: "कहाँ जाएं",
    subWhomToCall: "किसे कॉल करें",
    verifiedOfficial: "सत्यापित आधिकारिक सरकारी दिशा-निर्देश",
    practicalFallback: "AI व्यावहारिक आपातकालीन कदम (रेड क्रॉस मानक)",
    shareRescueCard: "बचाव कार्ड अधिकारियों को भेजें",
    rescueCardSharedSuccess: "बचाव कार्ड कंट्रोल रूम को भेज दिया गया",
    officialsPortal: "अधिकारियों का कंट्रोल रूम",
    enterPin: "4-अंकों का पिन दर्ज करें",
    changeLocation: "स्थान बदलें",
    whatsappSos: "पड़ोसियों को WhatsApp SOS",
    recordingAudio: "वॉयस SOS रिकॉर्ड हो रहा है...",
    recordVoice: "30 सेकंड का वॉयस SOS रिकॉर्ड करें",
  },
  es: {
    tagline: "Una alerta. Todo lo que necesitas. Leído en voz alta.",
    safeStatus: "Seguro — Sin alertas oficiales activas",
    safeSubtext: "Todas las redes meteorológicas y de protección civil reportan normalidad.",
    tabHome: "Inicio",
    tabAlerts: "Alertas",
    tabGuides: "Guías",
    tabAsk: "Preguntar",
    tabProfile: "Perfil",
    readAloud: "Leer en voz alta",
    stopAudio: "Detener",
    reportEmergency: "Reportar emergencia ahora",
    callHelpline: "Líneas de emergencia",
    simulateAlert: "Simular alerta de prueba",
    subOverview: "Resumen",
    subWhatToDo: "Qué hacer",
    subWhatToTake: "Qué llevar",
    subWhereToGo: "A dónde ir",
    subWhomToCall: "A quién llamar",
    verifiedOfficial: "Pautas oficiales gubernamentales verificadas",
    practicalFallback: "Pasos prácticos de IA (Estándar Cruz Roja)",
    shareRescueCard: "Compartir tarjeta familiar con autoridades",
    rescueCardSharedSuccess: "Tarjeta enviada a la sala de control de rescate",
    officialsPortal: "Sala de Control Oficial",
    enterPin: "Ingrese PIN de 4 dígitos",
    changeLocation: "Cambiar ubicación",
    whatsappSos: "WhatsApp SOS para vecinos",
    recordingAudio: "Grabando voz SOS (máx 30s)...",
    recordVoice: "Grabar SOS de voz de 30s",
  },
  ja: {
    tagline: "ひとつの警報。必要なすべてを、音声で読み上げ。",
    safeStatus: "安全 — 現在発令中の公式警報はありません",
    safeSubtext: "お住まいの地域の気象庁および防災機関の警報は平穏です。",
    tabHome: "ホーム",
    tabAlerts: "警報",
    tabGuides: "ガイド",
    tabAsk: "質問する",
    tabProfile: "設定",
    readAloud: "音声で読み上げ",
    stopAudio: "停止",
    reportEmergency: "緊急事態をすぐに報告",
    callHelpline: "緊急連絡先",
    simulateAlert: "警報テスト・シミュレーション",
    subOverview: "概要",
    subWhatToDo: "行動手順",
    subWhatToTake: "持ち出し品",
    subWhereToGo: "避難所・避難先",
    subWhomToCall: "通報・連絡先",
    verifiedOfficial: "確認済みの公式自治体・気象庁ガイドライン",
    practicalFallback: "AI応急処置ガイド（赤十字基準）",
    shareRescueCard: "救助支援カードを救助本部に共有",
    rescueCardSharedSuccess: "救助本部に世帯情報が送信されました",
    officialsPortal: "防災司令本部（関係者専用）",
    enterPin: "4桁の暗証番号を入力",
    changeLocation: "現在地を変更",
    whatsappSos: "近隣住民へWhatsApp SOS送信",
    recordingAudio: "音声SOSを録音中（最長30秒）...",
    recordVoice: "30秒の音声SOSを録音",
  },
  de: {
    tagline: "Ein Alarm. Alles, was Sie brauchen. Laut vorgelesen.",
    safeStatus: "Sicher — Keine aktiven amtlichen Warnungen",
    safeSubtext: "Alle Zivilschutz- und Wetterdienste melden normale Lage.",
    tabHome: "Startseite",
    tabAlerts: "Warnungen",
    tabGuides: "Leitfäden",
    tabAsk: "Fragen",
    tabProfile: "Profil",
    readAloud: "Laut vorlesen",
    stopAudio: "Anhalten",
    reportEmergency: "Notfall sofort melden",
    callHelpline: "Notrufnummern",
    simulateAlert: "Warnung testen",
    subOverview: "Übersicht",
    subWhatToDo: "Verhalten",
    subWhatToTake: "Notgepäck",
    subWhereToGo: "Schutzort",
    subWhomToCall: "Notruf",
    verifiedOfficial: "Geprüfte amtliche Behördenrichtlinien",
    practicalFallback: "Praktische KI-Notfallschritte (Rotes Kreuz Standard)",
    shareRescueCard: "Rettungskarte an Behörden übermitteln",
    rescueCardSharedSuccess: "Rettungskarte an Leitstelle übermittelt",
    officialsPortal: "Leitstelle für Einsatzkräfte",
    enterPin: "4-stellige PIN eingeben",
    changeLocation: "Standort ändern",
    whatsappSos: "Nachbarschafts-WhatsApp-SOS",
    recordingAudio: "Sprach-SOS wird aufgenommen (max. 30s)...",
    recordVoice: "30s Sprach-SOS aufnehmen",
  },
};

// UI translation accessor with fallback to English
export function t(key: string, langCode: string): string {
  const dict = UI_TRANSLATIONS[langCode] || UI_TRANSLATIONS.en;
  return dict[key] || UI_TRANSLATIONS.en[key] || key;
}
