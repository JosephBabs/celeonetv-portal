import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraOff, Eye, Heart, Mic, MicOff, MessageCircle, Power, X } from 'lucide-react';
import type { LocalTrack } from 'livekit-client';
import { liveErrorMessage, startWebLive, type LiveMediaHandle } from '@/services/liveHost';
import { useActiveLives, useLiveComments } from '@/services/socialLive';
import { RainbowRing } from '@/components/live/LiveRail';
import { useApp } from '@/store/app';
import { compactNumber } from '@/lib/utils';

const TOPICS = ['Gospel & Louange', 'Louange & Danse', 'Témoignage', 'Prière', 'Musique', 'Discussion', 'Éducation', 'Business', 'Humour', 'Cuisine', 'Mode', 'Sport', 'Art & Design', 'Actualités', 'Santé & Forme', 'Voyage', 'Tech'];
type Stage = 'setup' | 'connecting' | 'live' | 'ended';
const fmt = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; const p = (n: number) => String(n).padStart(2, '0'); return h ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`; };

/** Studio de direct web : mêmes étapes que LiveHostModal de l'app (préparation → connexion → direct → bilan). */
export function LiveHostPage() {
  const navigate = useNavigate();
  const account = useApp((s) => s.account);
  const name = `${account?.firstName ?? ''} ${account?.lastName ?? ''}`.trim() || 'Membre';
  const [stage, setStage] = useState<Stage>('setup');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [topic, setTopic] = useState('');
  const [goalType, setGoalType] = useState<'' | 'likes' | 'viewers'>('');
  const [goalTarget, setGoalTarget] = useState('100');
  const [commentsOn, setCommentsOn] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [recap, setRecap] = useState<{ duration: number; viewers: number; likes: number; comments: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const handleRef = useRef<LiveMediaHandle | null>(null);
  const peak = useRef(0);
  const startedAt = useRef(0);

  const { lives } = useActiveLives();
  const mine = lives.find((l) => l.id === sessionId);
  const comments = useLiveComments(sessionId, stage === 'live');
  if (mine) peak.current = Math.max(peak.current, mine.viewerCount);
  const eligible = !!account?.remote && !!account.uid;

  const openPreview = useCallback(async () => {
    setError('');
    try {
      const { createLocalTracks } = await import('livekit-client');
      const tracks = await createLocalTracks({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: { facingMode: 'user', resolution: { width: 1280, height: 720, frameRate: 30 } },
      });
      tracksRef.current.forEach((t) => t.stop());
      tracksRef.current = tracks;
      const v = tracks.find((t) => t.kind === 'video');
      if (v && videoRef.current) v.attach(videoRef.current);
    } catch (e) {
      setError(liveErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (eligible) void openPreview();
    return () => {
      // Quitter la page pendant un direct l'arrête proprement (egress + salle), sinon la diffusion resterait ouverte.
      if (handleRef.current) void handleRef.current.stop().catch(() => undefined);
      else tracksRef.current.forEach((t) => t.stop());
    };
  }, [eligible, openPreview]);

  useEffect(() => {
    if (stage !== 'live') return;
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { window.clearInterval(t); window.removeEventListener('beforeunload', warn); };
  }, [stage]);

  // La vidéo d'aperçu est remontée quand on passe de « préparation » à « direct » : on rattache la piste.
  useEffect(() => {
    const v = tracksRef.current.find((t) => t.kind === 'video');
    if (v && videoRef.current) v.attach(videoRef.current);
  }, [stage]);

  const start = async () => {
    if (!account || !eligible) return;
    setError('');
    setStage('connecting');
    try {
      const target = Math.max(1, Math.floor(Number(goalTarget) || 0));
      const { handle, warning: w } = await startWebLive(
        {
          hostType: 'user', hostId: account.uid!, hostName: name, hostAvatar: account.avatar ?? '',
          title: title.trim() || name, description: desc.trim(), topic,
          goal: goalType ? { type: goalType, target } : null, commentsEnabled: commentsOn,
        },
        tracksRef.current,
      );
      handleRef.current = handle;
      setSessionId(handle.sessionId ?? '');
      setWarning(w ?? '');
      startedAt.current = Date.now();
      peak.current = 0;
      setStage('live');
    } catch (e) {
      setError(liveErrorMessage(e));
      setStage('setup');
      void openPreview(); // pistes déjà arrêtées par l'échec : on rouvre l'aperçu
    }
  };

  const end = async () => {
    if (!window.confirm('Terminer le direct ? Partagez-le pour attirer plus de spectateurs.')) return;
    const duration = Math.floor((Date.now() - startedAt.current) / 1000);
    const snapshot = { duration, viewers: Math.max(peak.current, mine?.viewerCount ?? 0), likes: mine?.likes ?? 0, comments: Math.max(comments.length, mine?.commentCount ?? 0) };
    try {
      await handleRef.current?.stop();
    } catch (e) {
      setError(liveErrorMessage(e));
    }
    handleRef.current = null;
    setRecap(snapshot);
    setStage('ended');
  };

  const toggleMic = async () => { const next = !micOn; try { await handleRef.current?.setMic(next); } catch { /* piste indisponible */ } setMicOn(next); };
  const toggleCam = async () => { const next = !camOn; try { await handleRef.current?.setCamera(next); } catch { /* piste indisponible */ } setCamOn(next); };
  const share = async () => {
    const url = `https://celeonetv.com/live/${encodeURIComponent(sessionId)}`;
    try { if (navigator.share) await navigator.share({ title: title || name, url }); else await navigator.clipboard.writeText(url); } catch { /* annulé */ }
  };

  if (!eligible) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night p-6 text-white">
        <div className="max-w-sm text-center">
          <p className="font-display text-xl font-black">Connectez-vous pour passer en direct</p>
          <button onClick={() => navigate('/connexion')} className="mt-4 rounded-2xl bg-brand-500 px-6 py-2.5 font-black">Se connecter</button>
        </div>
      </div>
    );
  }

  if (stage === 'ended' && recap) {
    const tiles = [['Spectateurs', recap.viewers, '#2FA5A9'], ['Cœurs', recap.likes, '#FF3B5C'], ['Commentaires', recap.comments, '#4C6FFF']] as const;
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-canvas">
        <div className="bg-[linear-gradient(160deg,#061D20,#0B565A,#2FA5A9)] px-5 pb-6 pt-10 text-white">
          <button onClick={() => navigate('/accueil')} aria-label="Fermer" className="mb-2"><X size={26} /></button>
          <p className="text-[11px] font-black tracking-[2px] text-[#6EE7E3]">BILAN DU DIRECT</p>
          <h1 className="font-display mt-1 text-[26px] font-black">{title.trim() || name}</h1>
          <p className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-[11.5px] font-extrabold">Durée {fmt(recap.duration)}</p>
          <div className="rainbow-bar mt-4 h-[5px] rounded-full" />
        </div>
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-2.5 p-4">
          {tiles.map(([label, value, color]) => (
            <div key={label} className="relative overflow-hidden rounded-2xl bg-white p-3.5 pt-4 shadow-sm"><span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} /><p className="text-[26px] font-black text-ink">{compactNumber(value)}</p><p className="text-xs text-ink-muted">{label}</p></div>
          ))}
        </div>
        <div className="mx-auto max-w-xl px-4 pb-10"><button onClick={() => navigate('/accueil')} className="h-[52px] w-full rounded-full bg-brand-500 font-black text-white">Terminé</button></div>
      </div>
    );
  }

  const live = stage === 'live';
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#0B1417] text-white">
      <div className={live ? 'absolute inset-0' : 'mx-auto max-w-xl px-4 pb-10 pt-8'}>
        {!live && (
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => navigate(-1)} aria-label="Fermer"><X size={26} /></button>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[10.5px] font-black tracking-[1px]"><span className="h-[7px] w-[7px] rounded-full bg-[#2ED47A]" />STUDIO DIRECT</span>
            <span className="w-6" />
          </div>
        )}

        <div className={live ? 'absolute inset-0 bg-black' : 'relative aspect-video overflow-hidden rounded-[22px] border border-[rgba(110,231,227,.25)] bg-black'}>
          <video ref={videoRef} muted playsInline autoPlay className="h-full w-full -scale-x-100 object-cover" />
          {!camOn && <div className="absolute inset-0 flex items-center justify-center bg-night/90"><CameraOff size={40} /></div>}
          {stage === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center">
              <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
              <p className="mt-3 text-xl font-black">Connexion du direct…</p>
              <p className="mt-1.5 max-w-xs text-[11px] leading-[17px] text-white/80">Préparation de la diffusion. Ne fermez pas cette page.</p>
            </div>
          )}
        </div>

        {live && (
          <>
            <div className="rainbow-bar absolute inset-x-0 top-0 z-30 h-1" />
            <div className="absolute inset-x-3 top-3.5 z-20 flex items-center gap-2">
              <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-[rgba(6,29,32,.55)] p-1 pr-3 backdrop-blur">
                <RainbowRing size={38} width={2}>{account?.avatar ? <img src={account.avatar} alt="" className="h-full w-full object-cover" /> : <span className="font-black">{name.slice(0, 1)}</span>}</RainbowRing>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{name}</p><p className="text-[10px] font-bold text-[#6EE7E3]">● {fmt(elapsed)}</p></div>
                <span className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-xs font-black text-ink"><Heart size={14} color="#FF3B5C" fill="#FF3B5C" />{compactNumber(mine?.likes ?? 0)}</span>
              </div>
              <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[rgba(6,29,32,.55)] px-2.5 text-[10px] font-black"><Eye size={13} />{mine?.viewerCount ?? 0}</span>
              <button onClick={end} aria-label="Terminer le direct" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#D92D20]"><Power size={19} /></button>
            </div>
            {warning && <p className="absolute inset-x-3 top-[72px] z-20 rounded-xl bg-[#F79009]/90 px-3 py-2 text-[11px] font-bold">{warning}</p>}
            {error && <p className="absolute inset-x-3 top-[110px] z-20 rounded-xl bg-[#D92D20]/90 px-3 py-2 text-[11px] font-bold">{error}</p>}
            <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-xl">
              <div className="mb-2 max-h-[200px] w-[84%] overflow-y-auto scrollbar-none">
                {comments.slice(-6).map((c) => (
                  <div key={c.id} className="mt-[7px] rounded-[14px] border-l-[3px] border-brand-500 bg-[rgba(6,29,32,.5)] p-[7px]">
                    <p className="text-[9px] font-black text-[#6EE7E3]">{c.author}</p><p className="text-[10.5px] leading-[14px]">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 rounded-[22px] border border-[rgba(110,231,227,.25)] bg-[rgba(6,29,32,.78)] p-2">
                <button onClick={toggleMic} className="flex flex-1 flex-col items-center"><span className={`flex h-10 w-[46px] items-center justify-center rounded-[14px] ${micOn ? 'bg-[rgba(47,165,169,.35)]' : 'bg-[#D92D20]'}`}>{micOn ? <Mic size={20} /> : <MicOff size={20} />}</span><span className="mt-1 text-[9px] font-extrabold">{micOn ? 'Micro' : 'Muet'}</span></button>
                <button onClick={toggleCam} className="flex flex-1 flex-col items-center"><span className={`flex h-10 w-[46px] items-center justify-center rounded-[14px] ${camOn ? 'bg-[rgba(47,165,169,.35)]' : 'bg-[#D92D20]'}`}>{camOn ? <Camera size={20} /> : <CameraOff size={20} />}</span><span className="mt-1 text-[9px] font-extrabold">Caméra</span></button>
                <button onClick={share} className="flex flex-1 flex-col items-center"><span className="flex h-10 w-[46px] items-center justify-center rounded-[14px] bg-[rgba(47,165,169,.35)]"><MessageCircle size={20} /></span><span className="mt-1 text-[9px] font-extrabold">Partager</span></button>
              </div>
            </div>
          </>
        )}

        {stage === 'setup' && (
          <div className="mt-3 space-y-3">
            <div className="overflow-hidden rounded-[22px] border border-[rgba(110,231,227,.25)] bg-[rgba(6,29,32,.6)]">
              <div className="rainbow-bar h-1" />
              <div className="space-y-3 p-4">
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ajoutez un titre" className="w-full border-b border-white/25 bg-transparent py-1.5 text-center text-[21px] font-black outline-none placeholder:text-white/55" />
                <p className="text-center text-xs font-bold text-[#6EE7E3]">{name}</p>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="De quoi parle ce direct ?" className="w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/55" />
                <div className="flex flex-wrap gap-1.5">
                  {TOPICS.map((t) => <button key={t} onClick={() => setTopic(topic === t ? '' : t)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${topic === t ? 'bg-brand-500' : 'bg-white/12'}`}>{t}</button>)}
                </div>
                <div className="flex items-center gap-2">
                  <select value={goalType} onChange={(e) => setGoalType(e.target.value as '' | 'likes' | 'viewers')} className="h-10 flex-1 rounded-xl bg-white/12 px-3 text-sm outline-none"><option value="" className="text-ink">Aucun objectif</option><option value="likes" className="text-ink">Objectif : cœurs</option><option value="viewers" className="text-ink">Objectif : spectateurs</option></select>
                  {goalType && <input value={goalTarget} onChange={(e) => setGoalTarget(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-10 w-24 rounded-xl bg-white/12 px-3 text-sm outline-none" />}
                </div>
                <label className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold">Autoriser les commentaires<input type="checkbox" checked={commentsOn} onChange={(e) => setCommentsOn(e.target.checked)} className="h-5 w-5 accent-[#2FA5A9]" /></label>
              </div>
            </div>
            {error && <p className="rounded-xl bg-[#D92D20]/85 px-3 py-2 text-xs font-bold">{error}</p>}
            <p className="text-center text-xs text-white/80">Vous serez visible dès que vous lancez le direct. Utilisez un casque pour éviter l’écho.</p>
            <button onClick={start} className="rainbow-ring block h-[60px] w-full rounded-full p-[3px]"><span className="flex h-full w-full items-center justify-center rounded-full bg-brand-800 text-[17px] font-black tracking-[1px]">PASSER EN DIRECT</span></button>
          </div>
        )}
      </div>
    </div>
  );
}
