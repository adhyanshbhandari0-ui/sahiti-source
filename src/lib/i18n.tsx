import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "hi" | "mr" | "gu" | "bn" | "ta" | "te";

type Dict = Record<string, string>;

const en: Dict = {
  dashboard: "Dashboard",
  calculations: "Business calculations",
  feed: "Live feed",
  heatmap: "Risk map",
  profile: "Profile",
  assistant: "Sahiti AI",
  settings: "Settings",
  logout: "Log out",
  loan: "Loan calculator",
  documents: "Document guide",
  roi: "ROI tracker",
  market: "Market report",
  language: "Language",
  save: "Save",
  saved: "Saved",
  comment: "Comment",
  share: "Share",
  search: "Search",
  post: "Post",
  sampleData: "Demonstration data",
};

const labels: Record<Locale, Dict> = {
  en,
  hi: {
    dashboard: "डैशबोर्ड",
    calculations: "व्यापार गणना",
    feed: "लाइव फ़ीड",
    heatmap: "जोखिम मानचित्र",
    profile: "प्रोफ़ाइल",
    assistant: "साहिति AI",
    settings: "सेटिंग्स",
    logout: "लॉग आउट",
    loan: "ऋण कैलकुलेटर",
    documents: "दस्तावेज़ गाइड",
    roi: "आरओआई ट्रैकर",
    market: "बाज़ार रिपोर्ट",
    language: "भाषा",
    save: "सहेजें",
    saved: "सहेजा गया",
    comment: "टिप्पणी",
    share: "साझा करें",
    search: "खोजें",
    post: "पोस्ट करें",
    sampleData: "प्रदर्शन डेटा",
  },
  mr: {
    dashboard: "डॅशबोर्ड",
    calculations: "व्यवसाय गणना",
    feed: "लाइव्ह फीड",
    heatmap: "जोखीम नकाशा",
    profile: "प्रोफाइल",
    assistant: "साहिति AI",
    settings: "सेटिंग्ज",
    logout: "लॉग आउट",
    loan: "कर्ज कॅल्क्युलेटर",
    documents: "कागदपत्र मार्गदर्शक",
    roi: "आरओआय ट्रॅकर",
    market: "बाजार अहवाल",
    language: "भाषा",
    save: "जतन करा",
    saved: "जतन केले",
    comment: "टिप्पणी",
    share: "सामायिक करा",
    search: "शोधा",
    post: "पोस्ट करा",
    sampleData: "प्रात्यक्षिक माहिती",
  },
  gu: {
    dashboard: "ડેશબોર્ડ",
    calculations: "વ્યવસાય ગણતરી",
    feed: "લાઇવ ફીડ",
    heatmap: "જોખમ નકશો",
    profile: "પ્રોફાઇલ",
    assistant: "સાહિતિ AI",
    settings: "સેટિંગ્સ",
    logout: "લૉગ આઉટ",
    loan: "લોન કેલ્ક્યુલેટર",
    documents: "દસ્તાવેજ માર્ગદર્શિકા",
    roi: "આરઓઆઈ ટ્રેકર",
    market: "બજાર અહેવાલ",
    language: "ભાષા",
    save: "સાચવો",
    saved: "સાચવેલ",
    comment: "ટિપ્પણી",
    share: "શેર કરો",
    search: "શોધો",
    post: "પોસ્ટ કરો",
    sampleData: "નિદર્શન માહિતી",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    calculations: "ব্যবসার হিসাব",
    feed: "লাইভ ফিড",
    heatmap: "ঝুঁকির মানচিত্র",
    profile: "প্রোফাইল",
    assistant: "সাহিতি AI",
    settings: "সেটিংস",
    logout: "লগ আউট",
    loan: "ঋণ ক্যালকুলেটর",
    documents: "নথি নির্দেশিকা",
    roi: "আরওআই ট্র্যাকার",
    market: "বাজার প্রতিবেদন",
    language: "ভাষা",
    save: "সংরক্ষণ",
    saved: "সংরক্ষিত",
    comment: "মন্তব্য",
    share: "শেয়ার",
    search: "খুঁজুন",
    post: "পোস্ট",
    sampleData: "প্রদর্শন তথ্য",
  },
  ta: {
    dashboard: "முகப்பு",
    calculations: "வணிக கணக்கீடுகள்",
    feed: "நேரடி பதிவு",
    heatmap: "இடர் வரைபடம்",
    profile: "சுயவிவரம்",
    assistant: "சாஹிதி AI",
    settings: "அமைப்புகள்",
    logout: "வெளியேறு",
    loan: "கடன் கணிப்பான்",
    documents: "ஆவண வழிகாட்டி",
    roi: "ஆர்ஓஐ கண்காணிப்பு",
    market: "சந்தை அறிக்கை",
    language: "மொழி",
    save: "சேமி",
    saved: "சேமிக்கப்பட்டது",
    comment: "கருத்து",
    share: "பகிர்",
    search: "தேடு",
    post: "பதிவிடு",
    sampleData: "விளக்கத் தரவு",
  },
  te: {
    dashboard: "డ్యాష్‌బోర్డ్",
    calculations: "వ్యాపార లెక్కలు",
    feed: "లైవ్ ఫీడ్",
    heatmap: "రిస్క్ మ్యాప్",
    profile: "ప్రొఫైల్",
    assistant: "సాహితి AI",
    settings: "సెట్టింగ్‌లు",
    logout: "లాగ్ అవుట్",
    loan: "రుణ కాలిక్యులేటర్",
    documents: "పత్రాల మార్గదర్శి",
    roi: "ఆర్ఓఐ ట్రాకర్",
    market: "మార్కెట్ నివేదిక",
    language: "భాష",
    save: "సేవ్",
    saved: "సేవ్ చేయబడింది",
    comment: "వ్యాఖ్య",
    share: "షేర్",
    search: "వెతకండి",
    post: "పోస్ట్",
    sampleData: "ప్రదర్శన డేటా",
  },
};

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("sahiti-locale") as Locale | null;
    if (saved && labels[saved]) setLocaleState(saved);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: (next: Locale) => {
        setLocaleState(next);
        window.localStorage.setItem("sahiti-locale", next);
      },
      t: (key: string) => labels[locale][key] ?? en[key] ?? key,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLanguage(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}

export const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "bn", label: "বাংলা" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
];
