import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

/** Lien YouTube / Vimeo / Facebook → adresse d'intégration ; null pour un fichier ou un flux direct. */
export function embedUrl(src: string, autoplay = true): string | null {
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    const ap = autoplay ? '1' : '0';
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=${ap}&rel=0`;
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const id = u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|live|shorts|v)\/([\w-]+)/)?.[1];
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=${ap}&rel=0`;
      const channel = u.pathname.match(/\/channel\/([\w-]+)/)?.[1];
      if (channel) return `https://www.youtube.com/embed/live_stream?channel=${channel}&autoplay=${ap}`;
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.match(/(\d{6,})/)?.[1];
      if (id) return `https://player.vimeo.com/video/${id}?autoplay=${ap}`;
    }
    if (host.endsWith('facebook.com') || host === 'fb.watch') return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(src)}&autoplay=${autoplay}`;
  } catch {
    /* adresse invalide : traitée comme un fichier */
  }
  return null;
}

/** Flux adaptatif (HLS) : extension .m3u8 ou adresse typique d'un manifeste. */
export const isHls = (src: string) => /\.m3u8(\?|#|$)|\/manifest(\.|\/|\?|$)|\/playlist\.m3u|format=m3u8|\/hls\//i.test(src);
/** Lien lisible directement par une balise <video> (pas une intégration ni un flux HLS). */
export const isFile = (src: string) => !embedUrl(src) && !isHls(src);

/**
 * Couverture d'une vidéo : image fournie ; sinon une image extraite de la vidéo elle-même ;
 * sinon le logo. Une image cassée bascule automatiquement sur la solution suivante.
 */
export function VideoCover({ image, sources = [], className, logoClass = 'h-14 w-14' }: { image?: string; sources?: string[]; className?: string; logoClass?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const file = sources.find(isFile);
  useEffect(() => {
    setImgFailed(false);
    setFrameFailed(false);
    setFrameReady(false);
  }, [image, file]);
  // L'image tirée de la vidéo n'est demandée que lorsque la vignette arrive à l'écran.
  useEffect(() => {
    const el = box.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setVisible(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, image, imgFailed]);
  if (image && !imgFailed) return <img src={image} alt="" loading="lazy" onError={() => setImgFailed(true)} className={cn('h-full w-full object-cover', className)} />;
  if (file && !frameFailed) {
    return (
      <span ref={box} className={cn('relative block h-full w-full bg-night', className)}>
        {/* « #t=1 » : le navigateur affiche l'image située à 1 seconde de la vidéo. */}
        {visible && <video src={`${file}#t=1`} preload="metadata" muted playsInline onLoadedData={() => setFrameReady(true)} onError={() => setFrameFailed(true)} className={cn('pointer-events-none h-full w-full object-cover transition-opacity duration-300', frameReady ? 'opacity-100' : 'opacity-0')} aria-hidden />}
        {!frameReady && <span className="absolute inset-0 flex items-center justify-center bg-brand-700/90"><LogoMark className={cn(logoClass, 'opacity-80')} /></span>}
      </span>
    );
  }
  return <span className={cn('flex h-full w-full items-center justify-center bg-brand-600', className)}><LogoMark className={logoClass} /></span>;
}

const STALL_MS = 20000;

/**
 * Lecteur réel : essaie chaque lien dans l'ordre (intégration YouTube…, flux HLS via hls.js, fichier vidéo ou audio).
 * Un lien en erreur passe au suivant ; un lien lent aussi (20 s) s'il en reste un autre. Le dernier lien n'est jamais
 * abandonné pour lenteur : certains fichiers doivent être en grande partie téléchargés avant de démarrer.
 */
export function MediaPlayer({ sources, poster, live, title, className }: { sources: string[]; poster?: string; live?: boolean; title: string; className?: string }) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const key = sources.join('|');
  const src = sources[index];
  const embed = src ? embedUrl(src) : null;

  useEffect(() => {
    setStarted(false);
    setFailed(false);
    setIndex(0);
  }, [key]);

  const next = () => {
    if (index < sources.length - 1) setIndex((i) => i + 1);
    else setFailed(true);
  };

  useEffect(() => {
    if (!started || !src || embed) return;
    const el = videoRef.current;
    if (!el) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    let ok = false;
    setWaiting(true);
    const onReady = () => {
      ok = true;
      setWaiting(false);
    };
    el.addEventListener('loadeddata', onReady);
    const hasNext = index < sources.length - 1;
    const stall = hasNext ? window.setTimeout(() => !ok && !cancelled && next(), STALL_MS) : undefined;
    const native = () => {
      el.src = src;
      void el.play().catch(() => undefined);
    };
    if (isHls(src) && !el.canPlayType('application/vnd.apple.mpegurl')) {
      void import('hls.js')
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) return next();
          const hls = new Hls({ lowLatencyMode: !!live });
          hls.on(Hls.Events.ERROR, (_e, data) => data.fatal && !cancelled && next());
          hls.on(Hls.Events.MANIFEST_PARSED, () => void el.play().catch(() => undefined));
          hls.loadSource(src);
          hls.attachMedia(el);
          destroy = () => hls.destroy();
        })
        .catch(() => !cancelled && next());
    } else native();
    return () => {
      cancelled = true;
      window.clearTimeout(stall);
      el.removeEventListener('loadeddata', onReady);
      destroy?.();
      el.removeAttribute('src');
      el.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, src, embed, live, attempt, index]);

  if (failed || !src) {
    return (
      <div className={cn('flex h-full flex-col items-center justify-center gap-3 bg-night px-6 text-center text-white', className)}>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/25"><TriangleAlert size={30} /></span>
        <p className="text-xl font-black">Lecture indisponible</p>
        <p className="text-sm text-white/70">{live ? 'Le direct ne répond pas pour le moment.' : 'Cette vidéo ne peut pas être lue pour le moment.'}</p>
        {src && <Button icon={RotateCcw} onClick={() => { setFailed(false); setIndex(0); setAttempt((a) => a + 1); setStarted(true); }}>Réessayer</Button>}
      </div>
    );
  }

  if (!started) {
    return (
      <button onClick={() => setStarted(true)} className={cn('relative block h-full w-full bg-night', className)} aria-label={`Lire : ${title}`}>
        <VideoCover image={poster} sources={sources} logoClass="h-24 w-24 opacity-95 sm:h-32 sm:w-32" />
        <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"><Play size={34} className="ml-1 fill-white" /></span>
      </button>
    );
  }

  if (embed) {
    return <iframe key={`${attempt}-${index}`} src={embed} title={title} className={cn('h-full w-full border-0 bg-night', className)} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />;
  }

  return (
    <div className={cn('relative h-full w-full bg-night', className)}>
      <video
        key={`${attempt}-${index}`}
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        autoPlay
        onError={(e) => e.currentTarget.currentSrc && next()}
        className="h-full w-full object-contain"
        aria-label={title}
      />
      {waiting && (
        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-white" />
          <span className="text-sm font-semibold text-white/80">Chargement de la vidéo…</span>
        </span>
      )}
    </div>
  );
}
