import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Heart, MessageCircle, Pause, Pin, Radio, Send, Share2, Volume2, VolumeX, X, WifiOff } from 'lucide-react';
import { fetchActiveLives, postLiveComment, useActiveLives, useLiveComments, type SocialLive } from '@/services/socialLive';
import { HostAvatar, RainbowRing } from '@/components/live/LiveRail';
import { useApp } from '@/store/app';
import { compactNumber } from '@/lib/utils';

const StreamingPage = lazy(() => import('@/pages/streaming/StreamingPage').then((m) => ({ default: m.StreamingPage })));

const HEARTS = ['#FF3B5C', '#FF9F1C', '#FFD60A', '#2ED47A', '#2FA5A9', '#4C6FFF', '#9B5CFF'];
type HeartBurst = { id: number; dx: number; color: string };

/** Lecture HLS (hls.js, ou HLS natif sur Safari). Le flux démarre muet : les navigateurs bloquent le son automatique. */
function LivePlayer({ src, paused, muted, landscape, onState }: { src: string; paused: boolean; muted: boolean; landscape: boolean; onState: (s: 'loading' | 'playing' | 'error') => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    let retry: number | undefined;
    onState('loading');
    const fail = () => {
      if (cancelled) return;
      onState('error');
      // même logique que l'app : nouvelle tentative toutes les 2 s (12 maximum)
      if (attempt < 12) retry = window.setTimeout(() => setAttempt((a) => a + 1), 2000);
    };
    const ok = () => !cancelled && onState('playing');
    el.addEventListener('playing', ok);
    const url = `${src}${src.includes('?') ? '&' : '?'}_live_refresh=${Date.now()}`;
    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = url;
      el.addEventListener('error', fail, { once: true });
      void el.play().catch(() => undefined);
    } else {
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return fail();
        const hls = new Hls({ lowLatencyMode: false, liveSyncDurationCount: 3, maxBufferLength: 12, backBufferLength: 0 });
        hls.on(Hls.Events.ERROR, (_e, d) => d.fatal && fail());
        hls.on(Hls.Events.MANIFEST_PARSED, () => void el.play().catch(() => undefined));
        hls.loadSource(url);
        hls.attachMedia(el);
        destroy = () => hls.destroy();
      }).catch(fail);
    }
    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      el.removeEventListener('playing', ok);
      destroy?.();
      el.removeAttribute('src');
      el.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, attempt]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (paused) el.pause();
    else void el.play().catch(() => undefined);
  }, [paused]);
  return <video ref={ref} muted={muted} playsInline autoPlay className={`absolute inset-0 h-full w-full ${landscape ? 'object-contain' : 'object-cover'}`} />;
}

function GoalBar({ live }: { live: SocialLive }) {
  const g = live.goal;
  if (!g || g.type === 'gift') return null; // la progression des cadeaux se calcule depuis les cadeaux reçus (app)
  const value = g.type === 'likes' ? live.likes : live.viewerCount;
  const ratio = Math.min(1, value / g.target);
  return (
    <div className="w-[210px] rounded-xl bg-[rgba(6,29,32,.6)] px-2.5 py-1.5 backdrop-blur">
      <div className="flex justify-between text-[10px] font-extrabold text-white"><span>{g.type === 'likes' ? '♥ Cœurs' : '👁 Spectateurs'}</span><span>{compactNumber(value)}/{compactNumber(g.target)}</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/25"><div className="rainbow-bar h-full rounded-full" style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
    </div>
  );
}

function LiveViewer({ live, ended }: { live: SocialLive; ended: boolean }) {
  const navigate = useNavigate();
  const account = useApp((s) => s.account);
  const comments = useLiveComments(live.id, !ended);
  const [state, setState] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(true);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const heartId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const canComment = !!account?.remote && !!account.uid && live.commentsEnabled;

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [comments.length]);
  useEffect(() => { if (!notice) return; const t = window.setTimeout(() => setNotice(''), 2600); return () => window.clearTimeout(t); }, [notice]);

  const burst = useCallback((count = 1) => {
    const add: HeartBurst[] = Array.from({ length: Math.min(8, count) }, () => { heartId.current += 1; return { id: heartId.current, dx: (heartId.current % 2 ? 1 : -1) * (8 + (heartId.current % 5) * 6), color: HEARTS[heartId.current % HEARTS.length] }; });
    setHearts((h) => [...h.slice(-18), ...add]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => !add.some((a) => a.id === x.id))), 1200);
  }, []);

  const close = () => (window.history.length > 1 ? navigate(-1) : navigate('/accueil'));
  const share = async () => {
    const url = `https://celeonetv.com/live/${encodeURIComponent(live.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: live.title, text: `Rejoins mon direct « ${live.title} » sur Cèlè One`, url });
      else { await navigator.clipboard.writeText(url); setNotice('Lien copié'); }
    } catch { /* partage annulé */ }
  };
  const send = async () => {
    const v = text.trim();
    if (!v || !account?.uid) return;
    setText('');
    try {
      await postLiveComment(live.id, v, { uid: account.uid, name: `${account.firstName} ${account.lastName}`.trim(), avatar: account.avatar });
    } catch {
      setNotice('Commentaire non envoyé. Utilisez l’application pour commenter.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] select-none bg-black text-white">
      <style>{`@keyframes celeHeart{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:1;transform:translate(0,-18px) scale(1.2)}100%{opacity:0;transform:translate(var(--dx),-170px) scale(.85)}}`}</style>
      <LivePlayer src={live.playbackUrl} paused={ended || live.hostPaused} muted={muted} landscape={live.orientation === 'landscape'} onState={setState} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.58),transparent_30%,transparent_55%,rgba(0,0,0,.82))]" />
      {!ended && <button type="button" aria-label="J’aime" onClick={() => burst(1)} className="absolute inset-x-0 top-20 bottom-44 cursor-pointer" />}

      <div className="rainbow-bar absolute inset-x-0 top-0 z-30 h-1" />
      <header className="absolute inset-x-3 top-3.5 z-20 flex items-center gap-2.5">
        <div className="flex min-h-[50px] min-w-0 flex-1 items-center gap-2 rounded-full bg-[rgba(6,29,32,.55)] p-1 pr-3.5 backdrop-blur">
          <RainbowRing size={42}><HostAvatar live={live} size={42} /></RainbowRing>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[12.5px] font-black">{live.hostName}</p>
              {live.hostType === 'page' && <span className="rounded-md bg-brand-500 px-1.5 text-[7px] font-black leading-[18px]">PAGE</span>}
            </div>
            <p className="truncate text-[9.5px] font-bold text-[#6EE7E3]">{ended ? 'Direct terminé' : live.hostPaused ? 'En pause' : '● EN DIRECT'}{live.topic ? ` · ${live.topic}` : ''}</p>
          </div>
        </div>
        <button onClick={close} aria-label="Fermer" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[rgba(6,29,32,.55)] backdrop-blur"><X size={22} /></button>
      </header>

      <div className="pointer-events-none absolute left-3 top-[70px] z-20 flex gap-1.5">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[rgba(6,29,32,.55)] px-2.5 text-[10px] font-extrabold"><Eye size={12} />{compactNumber(live.viewerCount)}</span>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[rgba(6,29,32,.55)] px-2.5 text-[10px] font-extrabold"><MessageCircle size={12} />{compactNumber(Math.max(live.commentCount, comments.length))}</span>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[rgba(6,29,32,.55)] px-2.5 text-[10px] font-extrabold"><Heart size={12} />{compactNumber(live.likes)}</span>
      </div>
      <div className="pointer-events-none absolute left-3 top-[100px] z-20"><GoalBar live={live} /></div>
      {live.aboutMe && <p className="pointer-events-none absolute inset-x-3.5 top-[142px] z-20 line-clamp-2 text-[10.5px] text-white/90 [text-shadow:0_0_3px_#000]">{live.aboutMe}</p>}

      {state === 'loading' && !live.hostPaused && !ended && <div className="pointer-events-none absolute left-1/2 top-[43%] z-20 -translate-x-1/2 rounded-2xl bg-black/45 px-5 py-3.5 text-center text-[10.5px] font-extrabold"><span className="mx-auto mb-2 block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Connexion au direct…</div>}
      {state === 'error' && !ended && <div className="pointer-events-none absolute left-1/2 top-[43%] z-20 -translate-x-1/2 rounded-2xl bg-black/45 px-5 py-3.5 text-center text-[10.5px] font-extrabold"><WifiOff size={24} className="mx-auto mb-2" />Reconnexion en cours…</div>}
      {live.hostPaused && !ended && (
        <div className="pointer-events-none absolute inset-x-7 top-[38%] z-20 flex flex-col items-center rounded-[22px] bg-black/50 p-5 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/15"><Pause size={25} /></span>
          <p className="mt-3 text-[19px] font-black">Direct en pause</p>
          <p className="mt-1.5 text-[11px] leading-4 text-white/80">{live.hostName} revient dans un instant.</p>
        </div>
      )}
      {ended && (
        <div className="absolute inset-x-7 top-[32%] z-30 mx-auto flex max-w-sm flex-col items-center rounded-[22px] bg-[rgba(6,29,32,.88)] p-6 text-center">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/15"><Radio size={30} /></span>
          <p className="mt-3 text-[21px] font-black">Direct terminé</p>
          <p className="mt-1.5 text-[13px] font-bold text-white/80">Ce direct est terminé.</p>
          <button onClick={close} className="mt-4 rounded-2xl bg-brand-500 px-6 py-2.5 font-black">Fermer</button>
        </div>
      )}
      {notice && <div className="pointer-events-none absolute left-1/2 top-[130px] z-30 max-w-[80%] -translate-x-1/2 rounded-2xl bg-black/70 px-3.5 py-2 text-center text-[11px] font-bold">{notice}</div>}

      <div className="pointer-events-none absolute bottom-20 right-4 z-10 h-[210px] w-16">
        {hearts.map((h) => <Heart key={h.id} size={34} fill={h.color} color={h.color} className="absolute bottom-0 left-1/2 -ml-[17px]" style={{ ['--dx' as string]: `${h.dx}px`, animation: 'celeHeart 1.15s cubic-bezier(.2,.7,.3,1) forwards' } as React.CSSProperties} />)}
      </div>

      <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-xl">
        {live.pinned && (
          <div className="mb-1.5 rounded-[13px] border border-white/20 bg-[rgba(47,165,169,.7)] px-2.5 py-2">
            <p className="flex items-center gap-1 text-[8px] font-black uppercase"><Pin size={11} />Épinglé</p>
            <p className="text-[9px] font-black text-[#6EE7E3]">{live.pinned.author}</p>
            <p className="text-[10.5px]">{live.pinned.text}</p>
          </div>
        )}
        <div ref={listRef} className="mb-2 max-h-[186px] w-[84%] overflow-y-auto scrollbar-none">
          {comments.slice(-5).map((c) => (
            <div key={c.id} className="mt-[7px] flex max-w-full items-center gap-[7px]">
              {c.avatar ? <img src={c.avatar} alt="" className="h-[29px] w-[29px] shrink-0 rounded-full object-cover" /> : <span className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-white/25 text-[11px] font-black">{c.author.slice(0, 1).toUpperCase()}</span>}
              <div className="max-w-[88%] rounded-xl border-l-[3px] border-brand-500 bg-[rgba(6,29,32,.55)] px-[9px] py-1.5">
                <p className="truncate text-[9px] font-black text-[#6EE7E3]">{c.author}</p>
                <p className="line-clamp-2 text-[10.5px]">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[7px]">
          <div className={`flex h-[42px] flex-1 items-center rounded-full border pl-3.5 pr-1 ${canComment ? 'border-[rgba(110,231,227,.35)] bg-[rgba(6,29,32,.7)]' : 'border-white/10 bg-[rgba(80,80,80,.58)]'}`}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} disabled={!canComment} maxLength={300}
              placeholder={!account?.remote ? 'Connectez-vous pour commenter' : live.commentsEnabled ? 'Dites quelque chose…' : 'Les commentaires sont désactivés'}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/70" />
            <button onClick={send} disabled={!canComment || !text.trim()} aria-label="Envoyer" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 disabled:opacity-40"><Send size={15} /></button>
          </div>
          <button onClick={() => burst(1)} aria-label="J’aime" className="rainbow-bar flex h-10 w-10 items-center justify-center rounded-[14px]"><Heart size={20} fill="#fff" /></button>
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Activer le son' : 'Couper le son'} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-500">{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
          <button onClick={share} aria-label="Partager" className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/20 bg-[rgba(6,29,32,.7)]"><Share2 size={19} /></button>
        </div>
      </div>
    </div>
  );
}

/** /live/:liveId : direct social (liens partagés par l'app) ; sinon on retombe sur le lecteur streaming existant. */
export function LiveRoute() {
  const { liveId = '' } = useParams();
  const { lives, loaded } = useActiveLives();
  const [probe, setProbe] = useState<'pending' | 'social' | 'other'>('pending');
  const everSeen = useRef(false);
  const live = useMemo(() => lives.find((l) => l.id === liveId), [lives, liveId]);
  if (live) everSeen.current = true;

  useEffect(() => {
    if (!loaded || live || everSeen.current) return;
    let off = false;
    void fetchActiveLives().then((l) => !off && setProbe(l.some((x) => x.id === liveId) ? 'social' : 'other')).catch(() => !off && setProbe('other'));
    return () => { off = true; };
  }, [loaded, live, liveId]);

  if (live) return <LiveViewer live={live} ended={false} />;
  if (everSeen.current) return <LiveViewer live={{ id: liveId, title: 'Direct', hostName: 'Cèlè One', hostType: 'user', playbackUrl: '', viewerCount: 0, likes: 0, commentCount: 0, hostPaused: false, startedAtMs: 0, orientation: 'portrait', commentsEnabled: false }} ended />;
  if (!loaded || probe === 'pending') return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#080808] text-white"><span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /></div>;
  return <Suspense fallback={null}><StreamingPage /></Suspense>;
}
