import { useState } from 'react';
import { Download, X } from 'lucide-react';

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.celeoneapp';
const APP_STORE = 'https://apps.apple.com/search?term=Cele%20One';

export function AppDownloadBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('celeone-download-banner-dismissed') === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('celeone-download-banner-dismissed', '1');
    } catch {
      // Keep the banner dismissal for this session if storage is unavailable.
    }
  };

  return (
    <aside className="relative z-50 bg-brand-900 px-3 py-2 text-white sm:px-5" aria-label="Télécharger l’application Cele One">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-3 gap-y-2 pr-8 text-center text-xs font-semibold sm:justify-between sm:text-sm">
        <p className="flex items-center gap-2"><Download size={16} aria-hidden="true" /> Retrouvez toutes les fonctionnalités dans l’application Cele One.</p>
        <div className="flex items-center gap-2">
          <a href={PLAY_STORE} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-brand-900 hover:bg-mint-100 sm:text-xs">Android</a>
          <a href={APP_STORE} target="_blank" rel="noreferrer" className="rounded-full border border-white/50 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/10 sm:text-xs">iPhone</a>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Fermer le message" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white">
        <X size={16} />
      </button>
    </aside>
  );
}
