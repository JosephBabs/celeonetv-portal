import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Hammer, Sparkles } from 'lucide-react';
import { findMenuEntry, titleForPath } from '@/data/navigation';
import { Button } from '@/components/ui/Button';

/** Page provisoire pour les sections prévues aux étapes suivantes du plan. */
export function ComingSoonPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const entry = findMenuEntry(pathname);
  const title = titleForPath(pathname);
  const Icon = entry?.item.icon ?? Sparkles;

  return (
    <div className="space-y-4">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-[13px] text-ink-muted">
        <Link to="/accueil" className="hover:text-brand-700 hover:underline">Accueil</Link>
        {entry && (
          <>
            <ChevronRight size={14} />
            <span>{entry.group.label}</span>
          </>
        )}
        <ChevronRight size={14} />
        <span className="font-semibold text-ink">{title}</span>
      </nav>
      <div className="card relative overflow-hidden px-6 py-14 text-center">
        <div className="rainbow-bar absolute inset-x-0 top-0 h-1" />
        <span className="icon-tile mx-auto mb-5 h-20 w-20 rounded-3xl">
          <Icon size={34} strokeWidth={1.6} />
        </span>
        {entry && <p className="eyebrow mb-1">{entry.group.label}</p>}
        <h1 className="text-[28px] font-black text-ink">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-muted">
          Cette page fait partie des prochaines étapes du redesign. Sa structure et ses boutons seront entièrement fonctionnels très bientôt.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-50 px-4 py-2 text-sm font-semibold text-gold-700">
          <Hammer size={16} /> En cours de construction
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Retour
          </Button>
          <Button to="/accueil">Revenir à l'accueil</Button>
        </div>
      </div>
    </div>
  );
}
