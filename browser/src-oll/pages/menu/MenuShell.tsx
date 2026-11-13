import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Table2 } from 'lucide-react';
import { findMenuEntry } from '@/data/navigation';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/** Gabarit commun des pages du menu ☰ : fil d'Ariane, titre, description et actions. */
export function MenuShell({ title, description, actions, children, wide }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; wide?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const entry = findMenuEntry(pathname);
  const Icon = entry?.item.icon;
  return (
    <div className={cn('pb-16', wide && 'mx-auto max-w-5xl')}>
      <nav aria-label="Fil d'Ariane" className="mb-3 flex flex-wrap items-center gap-1 text-[13px] text-ink-muted">
        <Link to="/accueil" className="hover:text-brand-700 hover:underline">Accueil</Link>
        {entry && (<><ChevronRight size={14} /><span>{entry.group.label}</span></>)}
        <ChevronRight size={14} />
        <span className="font-semibold text-ink">{title ?? entry?.item.label}</span>
      </nav>
      <div className="mb-5 flex items-start gap-3">
        <IconButton icon={ChevronLeft} label="Retour" variant="soft" shape="square" onClick={() => navigate(-1)} />
        {Icon && <span className="icon-tile hidden h-12 w-12 rounded-2xl sm:inline-flex"><Icon size={22} /></span>}
        <div className="min-w-0 flex-1">
          {entry && <p className="eyebrow">{entry.group.label}</p>}
          <h1 className="font-display text-[26px] font-black leading-tight text-brand-900">{title ?? entry?.item.label}</h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function StatTile({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon?: typeof Table2 }) {
  return (
    <div className="card rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">{Icon && <Icon size={14} />}{label}</p>
      <p className="mt-1 font-display text-[26px] font-black leading-none text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Pills<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)} className={cn('h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition', value === o.id ? 'bg-brand-700 text-white' : 'bg-surface-sunken text-ink-soft hover:bg-line')}>{o.label}</button>
      ))}
    </div>
  );
}

/**
 * Graphique en barres d'une seule série (couleur de marque validée, pas de légende),
 * barres fines à extrémités arrondies, grille discrète, infobulle au survol et vue tableau.
 */
export function BarChart({ title, data, unit = '', height = 180 }: { title: string; data: { label: string; value: number }[]; unit?: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(...data.map((d) => d.value), 1);
  const nice = Math.ceil(max / 4 / 10) * 10 * 4 || 4;
  const W = 600;
  const H = height;
  const pad = { l: 36, r: 8, t: 10, b: 24 };
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / nice);
  const fmt = (v: number) => `${v.toLocaleString('fr-FR')}${unit}`;

  return (
    <figure className="card rounded-2xl p-4">
      <figcaption className="mb-2 flex items-center justify-between">
        <span className="font-extrabold">{title}</span>
        <button onClick={() => setTable((t) => !t)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-surface-sunken" aria-pressed={table}>
          <Table2 size={14} /> {table ? 'Graphique' : 'Tableau'}
        </button>
      </figcaption>
      {table ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-muted"><th className="py-1.5 font-semibold">Période</th><th className="py-1.5 text-right font-semibold">Valeur</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.label} className="border-t border-line"><td className="py-1.5">{d.label}</td><td className="py-1.5 text-right tabular-nums">{fmt(d.value)}</td></tr>)}</tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${title} : ${data.map((d) => `${d.label} ${fmt(d.value)}`).join(', ')}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(nice * t)} y2={y(nice * t)} stroke="rgb(var(--line))" strokeWidth={1} />
                <text x={pad.l - 6} y={y(nice * t) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--ink-muted))">{(nice * t).toLocaleString('fr-FR')}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = pad.l + i * bw + bw * 0.22;
              const w = bw * 0.56;
              const top = y(d.value);
              const h = Math.max(0, H - pad.b - top);
              const r = Math.min(4, w / 2, h);
              return (
                <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
                  <path d={`M${x},${H - pad.b} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${H - pad.b} Z`} fill="#0E8C7E" opacity={hover === null || hover === i ? 1 : 0.55} />
                  <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="rgb(var(--ink-muted))">{d.label}</text>
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-night px-2.5 py-1.5 text-xs font-semibold text-white shadow-md" style={{ left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%`, top: 0 }}>
              {data[hover].label} · {fmt(data[hover].value)}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
