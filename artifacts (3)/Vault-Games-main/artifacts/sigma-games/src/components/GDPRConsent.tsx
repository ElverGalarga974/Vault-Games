import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const CONSENT_KEY = 'vault_gdpr_consent';
const CONSENT_VERSION = '1';

interface ConsentPrefs {
  ads: boolean;
  analytics: boolean;
  functional: boolean;
  version: string;
  timestamp: number;
}

function isEEATimezone(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eeaZones = [
      'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Athens', 'Europe/Belgrade',
      'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest',
      'Europe/Budapest', 'Europe/Busingen', 'Europe/Chisinau', 'Europe/Copenhagen',
      'Europe/Dublin', 'Europe/Gibraltar', 'Europe/Guernsey', 'Europe/Helsinki',
      'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey', 'Europe/Kaliningrad',
      'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon', 'Europe/Ljubljana',
      'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta',
      'Europe/Mariehamn', 'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow',
      'Europe/Nicosia', 'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica',
      'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara',
      'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Simferopol', 'Europe/Skopje',
      'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane',
      'Europe/Uzhgorod', 'Europe/Vaduz', 'Europe/Vatican', 'Europe/Vienna',
      'Europe/Vilnius', 'Europe/Volgograd', 'Europe/Warsaw', 'Europe/Zagreb',
      'Europe/Zaporozhye', 'Europe/Zurich',
    ];
    return eeaZones.includes(tz);
  } catch {
    return true;
  }
}

function getStoredConsent(): ConsentPrefs | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setStoredConsent(prefs: ConsentPrefs) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
  updateGoogleConsent(prefs);
}

function updateGoogleConsent(prefs: ConsentPrefs) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      ad_storage: prefs.ads ? 'granted' : 'denied',
      ad_user_data: prefs.ads ? 'granted' : 'denied',
      ad_personalization: prefs.ads ? 'granted' : 'denied',
      personalization_storage: prefs.ads ? 'granted' : 'denied',
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      functionality_storage: prefs.functional ? 'granted' : 'denied',
    });
  }
}

export function GDPRConsent() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [prefs, setPrefs] = useState({ ads: true, analytics: true, functional: true });

  useEffect(() => {
    const existing = getStoredConsent();
    if (existing) {
      updateGoogleConsent(existing);
      return;
    }
    if (isEEATimezone()) {
      setShow(true);
    } else {
      const autoConsent: ConsentPrefs = { ads: true, analytics: true, functional: true, version: CONSENT_VERSION, timestamp: Date.now() };
      setStoredConsent(autoConsent);
    }
  }, []);

  const handleConsent = () => {
    const consent: ConsentPrefs = { ads: true, analytics: true, functional: true, version: CONSENT_VERSION, timestamp: Date.now() };
    setStoredConsent(consent);
    setShow(false);
  };

  const handleReject = () => {
    const consent: ConsentPrefs = { ads: false, analytics: false, functional: false, version: CONSENT_VERSION, timestamp: Date.now() };
    setStoredConsent(consent);
    setShow(false);
  };

  const handleSaveManaged = () => {
    const consent: ConsentPrefs = { ...prefs, version: CONSENT_VERSION, timestamp: Date.now() };
    setStoredConsent(consent);
    setShow(false);
    setShowManage(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6"
      >
        <div className="max-w-2xl mx-auto bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {!showManage ? (
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 text-lg">🔒</div>
                <div>
                  <h3 className="text-white font-bold text-lg">{t('consent.title')}</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">{t('consent.desc')}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-5">
                <button onClick={handleConsent}
                  className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm"
                >Consent</button>
                <button onClick={handleReject}
                  className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl border border-white/10 transition-colors text-sm"
                >Do not consent</button>
                <button onClick={() => setShowManage(true)}
                  className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl border border-white/10 transition-colors text-sm"
                >Manage options</button>
              </div>
              <p className="text-gray-500 text-[11px] mt-4 leading-relaxed">
                We use cookies and data to deliver and maintain Google services, track outages and protect against spam, fraud, and abuse, and measure audience engagement and site statistics to understand how our services are used and enhance the quality of those services.
              </p>
              <p className="text-gray-500 text-[11px] mt-2 leading-relaxed">
                If you choose to "Consent," we will also use cookies and data to develop and improve new services, deliver and measure the effectiveness of ads, show personalized content depending on your settings, and show personalized ads depending on your settings.
              </p>
              <p className="text-gray-600 text-[10px] mt-3 text-center">Google Certified CMP &middot; Applies to users in the EEA, UK &amp; Switzerland</p>
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-white font-bold text-lg mb-4">{t('consent.manage.title')}</h3>

              {[
                { key: 'ads', label: t('consent.purpose.ads'), desc: t('consent.purpose.ads.desc') },
                { key: 'analytics', label: t('consent.purpose.analytics'), desc: t('consent.purpose.analytics.desc') },
                { key: 'functional', label: t('consent.purpose.functional'), desc: t('consent.purpose.functional.desc') },
              ].map(purpose => (
                <div key={purpose.key} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{purpose.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{purpose.desc}</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, [purpose.key]: !p[purpose.key as keyof typeof p] }))}
                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 mt-1 ${prefs[purpose.key as keyof typeof prefs] ? 'bg-blue-600' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${prefs[purpose.key as keyof typeof prefs] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowManage(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl border border-white/10 transition-colors text-sm"
                >Back</button>
                <button onClick={handleSaveManaged}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm"
                >{t('consent.save')}</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
