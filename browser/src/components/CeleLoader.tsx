import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const arcs = ['#FF3B5C', '#FF9F1C', '#FFD60A', '#2ED47A', '#2FA5A9', '#4C6FFF', '#9B5CFF'];

/** Logo CélèOne animé : l'arc-en-ciel se dessine bande par bande, puis le dôme et le « C1 » apparaissent. */
export function CeleLogoAnimated({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('co-loader relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <span className="co-halo absolute inset-[-14%] rounded-full" aria-hidden="true" />
      <span className="absolute inset-[-4%] rounded-full bg-surface shadow-lg" aria-hidden="true" />
      <svg viewBox="0 0 512 512" className="relative h-[86%] w-[86%]" aria-hidden="true">
        <g fill="none" strokeWidth="11.6" strokeLinecap="butt">
          {arcs.map((color, i) => {
            const r = 242.5 - i * 11;
            return <path key={color} className="co-arc" style={{ animationDelay: `${i * 0.09}s` }} d={`M${256 - r} 256a${r} ${r} 0 0 1 ${r * 2} 0`} stroke={color} pathLength={100} />;
          })}
        </g>
        <path className="co-dome" d="M96 264a160 160 0 0 1 320 0h88a248 248 0 0 1-496 0z" fill="#0BA393" />
        <path className="co-c" d="M280.1 256.3a68 68 0 1 0 0 87.4" fill="none" stroke="#fff" strokeWidth="40" pathLength={100} />
        <circle className="co-dot" cx="228" cy="300" r="20" fill="#fff" />
        <path className="co-one" d="M306 250l58-12v154h-36V280l-22 4z" fill="#fff" />
      </svg>
    </span>
  );
}

const messages = ['Préparation de votre espace…', 'Chargement des cantiques…', 'Connexion à la communauté…', 'Ouverture de la Parole…'];

/**
 * Loader CélèOne.
 * - `full` : plein écran (démarrage, connexion, déconnexion)
 * - `page` : dans la zone de contenu (chargement d'une page)
 */
export function CeleLoader({ variant = 'page', label }: { variant?: 'full' | 'page'; label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (label) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % messages.length), 1600);
    return () => window.clearInterval(t);
  }, [label]);
  const text = label ?? messages[i];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className={cn('flex flex-col items-center justify-center gap-6 text-center', variant === 'full' ? 'fixed inset-0 z-[95] animate-fade-in bg-canvas' : 'min-h-[60vh] py-16')}
    >
      {variant === 'full' && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(var(--mint-200)/0.7),transparent_60%)]" />}
      <CeleLogoAnimated size={variant === 'full' ? 132 : 104} />
      <div className="relative">
        <p className="font-display text-2xl font-black tracking-tight text-brand-900">
          Cèlè<span className="text-brand-600">One</span>
        </p>
        <p key={text} className="mt-1 animate-fade-in text-sm text-ink-muted">{text}</p>
      </div>
      <div className="relative h-1.5 w-44 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className="co-bar absolute inset-y-0 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
