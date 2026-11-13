import { Link } from 'react-router-dom';
import { Eye, Flag } from 'lucide-react';
import { useActiveLives, type SocialLive } from '@/services/socialLive';
import { compactNumber } from '@/lib/utils';

export function RainbowRing({ size, width = 2.5, children, className = '' }: { size: number; width?: number; children?: React.ReactNode; className?: string }) {
  return (
    <span className={`rainbow-ring inline-flex shrink-0 items-center justify-center rounded-full ${className}`} style={{ width: size, height: size, padding: width }}>
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-800">{children}</span>
    </span>
  );
}

export function HostAvatar({ live, size = 22 }: { live: Pick<SocialLive, 'hostAvatar' | 'hostName'>; size?: number }) {
  return live.hostAvatar ? (
    <img src={live.hostAvatar} alt="" loading="lazy" className="h-full w-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex h-full w-full items-center justify-center bg-brand-500 text-[11px] font-black text-white">{live.hostName.slice(0, 1).toUpperCase()}</span>
  );
}

function LiveCard({ live }: { live: SocialLive }) {
  return (
    <Link to={`/live/${encodeURIComponent(live.id)}`} className="group shrink-0 snap-start" aria-label={`Regarder le direct de ${live.hostName}`}>
      <span className="rainbow-ring block rounded-[24px] p-[2.5px] transition group-hover:scale-[1.02]" style={{ width: 132, height: 172 }}>
        <span className="relative block h-full w-full overflow-hidden rounded-[21px] bg-[#0C2528]">
          {live.hostAvatar ? <img src={live.hostAvatar} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 bg-[linear-gradient(160deg,#0A2E32,#145D61,#2FA5A9)]" />}
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.05)_45%,rgba(0,0,0,.88))]" />
          <span className="absolute left-2 right-2 top-2 flex items-center justify-between">
            <span className={`inline-flex h-[18px] items-center gap-1 rounded-full px-2 text-[8px] font-black tracking-wide text-white ${live.hostPaused ? 'bg-[#F79009]' : 'bg-brand-800'}`}>
              <span className={`h-[5px] w-[5px] rounded-full ${live.hostPaused ? 'bg-white' : 'animate-pulse bg-[#2ED47A]'}`} />
              {live.hostPaused ? 'PAUSE' : 'LIVE'}
            </span>
            {live.hostType === 'page' && (
              <span className="inline-flex h-[22px] items-center gap-1 rounded-md bg-black/50 px-1.5 text-[7.5px] font-black text-white"><Flag size={10} />PAGE</span>
            )}
          </span>
          <span className="absolute inset-x-2.5 bottom-2.5 text-white">
            <span className="flex items-center gap-1.5">
              <span className="h-[22px] w-[22px] overflow-hidden rounded-full border border-white/80"><HostAvatar live={live} /></span>
              <span className="truncate text-[10px] font-black">{live.hostName}</span>
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[12px] font-black leading-[15px]">{live.title}</span>
            <span className="mt-1.5 flex items-center gap-1 text-[8.5px] font-bold text-white/85"><Eye size={12} />{compactNumber(live.viewerCount)} en direct</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/** Bandeau « En direct » de l'accueil, même construction que LiveDiscoveryRail de l'app (anneau arc-en-ciel, cartes verticales). */
export function LiveRail() {
  const { lives } = useActiveLives();
  if (!lives.length) return null;
  return (
    <section aria-label="Directs en cours" className="mb-4">
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-black leading-none text-ink">En direct</h2>
          <p className="mt-1 text-[11px] text-ink-muted">Louange, partage et joie en ce moment</p>
        </div>
      </div>
      <div className="rainbow-bar mb-3 h-[3px] w-24 rounded-full" />
      <div className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:-mx-5 sm:px-5">
        {lives.map((l) => <LiveCard key={l.id} live={l} />)}
      </div>
    </section>
  );
}
