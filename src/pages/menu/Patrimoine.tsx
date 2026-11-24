import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Globe, Image as ImageIcon, Play, Share2, Star, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { SceneVariant } from '@/data/types';
import { openShare, toast } from '@/store/ui';
import { Scene, VideoFrame } from '@/components/feed/Scene';
import { Poster } from '@/components/feed/Poster';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal, useEscape } from '@/components/ui/Overlay';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { MenuShell, StatTile } from './MenuShell';

const demoNote = <p className="mb-5 rounded-xl bg-gold-50 px-4 py-2.5 text-sm text-gold-700">Contenu de démonstration — le texte historique officiel sera intégré par l'administration.</p>;

function Article({ sections }: { sections: { title: string; text: string }[] }) {
  return (
    <article className="card rounded-3xl px-6 py-7 text-[17px] leading-relaxed sm:px-10">
      {demoNote}
      {sections.map((s) => (
        <section key={s.title} className="mb-6">
          <h2 className="mb-2 font-display text-xl font-black">{s.title}</h2>
          <p className="text-ink-soft">{s.text}</p>
        </section>
      ))}
    </article>
  );
}

export function HistoirePage() {
  return (
    <MenuShell description="Des origines à aujourd'hui" actions={<IconButton icon={Share2} label="Partager" onClick={() => openShare({ title: "Histoire de l'Église", url: '/menu/patrimoine-eglise/histoire' })} />}>
      <div className="mb-4 aspect-[16/7] overflow-hidden rounded-3xl"><Poster variant="founder" /></div>
      <Article sections={[
        { title: 'Les origines (1947)', text: "L'Église naît à Porto-Novo en 1947. Ce paragraphe de démonstration présente le contexte spirituel et social de l'époque, les premiers fidèles et la vision fondatrice." },
        { title: 'Les premières années', text: "Description fictive de la constitution des premières paroisses, de l'organisation des cultes et de la formation des premiers responsables." },
        { title: "L'expansion", text: "Texte de démonstration sur l'extension en Afrique de l'Ouest, puis vers l'Europe et l'Amérique, portée par la diaspora." },
        { title: "L'Église aujourd'hui", text: "Présentation fictive de l'organisation actuelle : diocèses, paroisses, chorales, mouvements de jeunesse et médias, dont Cèlè One." },
      ]} />
    </MenuShell>
  );
}

export function BiographiePage() {
  return (
    <MenuShell description="Samuel Bilewu Joseph Oshoffa (1909 — 1985)">
      <div className="mb-4 grid gap-4 sm:grid-cols-[240px_minmax(0,1fr)]">
        <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#d5e7ee,#9bb7c0)]">
          <div className="flex h-full items-end justify-center"><div className="h-[72%] w-[70%] rounded-t-full bg-[linear-gradient(180deg,#5d8793,#3c5f69)]" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start">
          <StatTile label="Naissance" value="1909" hint="Porto-Novo (démo)" />
          <StatTile label="Fondation" value="1947" hint="Porto-Novo" />
          <StatTile label="Ministère" value="38 ans" hint="Donnée de démonstration" />
          <StatTile label="Héritage" value="Mondial" hint="Paroisses sur plusieurs continents" />
        </div>
      </div>
      <Article sections={[
        { title: 'Enfance et jeunesse', text: 'Paragraphe biographique de démonstration : famille, formation et métier exercé avant la vocation.' },
        { title: 'La vision', text: 'Texte fictif résumant le moment fondateur et la mission reçue, tel que le relate la tradition de l’Église.' },
        { title: 'Le ministère', text: 'Description de démonstration du ministère, des voyages et de l’organisation de l’Église naissante.' },
        { title: 'Héritage', text: 'Texte fictif sur l’héritage spirituel transmis aux générations suivantes.' },
      ]} />
    </MenuShell>
  );
}

const timeline = [
  { year: '1909', title: 'Naissance du fondateur', text: 'Naissance à Porto-Novo (donnée de démonstration détaillée dans la biographie).' },
  { year: '1947', title: 'Fondation de l’Église', text: 'Les débuts de l’Église à Porto-Novo et les premiers cultes.' },
  { year: '1950', title: 'Premières paroisses', text: 'Ouverture fictive des premières paroisses hors de Porto-Novo.' },
  { year: '1960', title: 'Expansion régionale', text: 'Implantation de démonstration au Nigeria et au Togo.' },
  { year: '1976', title: 'Grands pèlerinages', text: 'Organisation des premiers grands rassemblements annuels (démo).' },
  { year: '1985', title: 'Fin du ministère du fondateur', text: 'Texte de démonstration sur la transition et la continuité.' },
  { year: '2000', title: 'Diaspora', text: 'Paroisses ouvertes en Europe et en Amérique du Nord (démo).' },
  { year: '2026', title: 'Cèlè One', text: 'Lancement de la plateforme numérique Cèlè One et de sa version web.' },
];

export function ChronologiePage() {
  const [active, setActive] = useState(1);
  const ev = timeline[active];
  return (
    <MenuShell description="Touchez une date pour découvrir l'événement">
      <div className="card mb-4 overflow-x-auto rounded-3xl p-5 scrollbar-none">
        <div className="relative flex min-w-[600px] justify-between px-2 pt-2">
          <span className="rainbow-bar absolute left-0 right-0 top-[22px] h-1 rounded-full opacity-70" />
          {timeline.map((t, i) => (
            <button key={t.year} onClick={() => setActive(i)} className="relative z-10 flex flex-col items-center gap-2" aria-pressed={active === i}>
              <span className={cn('h-6 w-6 rounded-full border-4 transition', active === i ? 'scale-125 border-brand-700 bg-white' : 'border-white bg-brand-500')} />
              <span className={cn('text-sm font-black', active === i ? 'text-brand-800' : 'text-ink-muted')}>{t.year}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="card flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center">
        <span className="font-display text-5xl font-black text-brand-600">{ev.year}</span>
        <div className="flex-1"><h2 className="text-xl font-black">{ev.title}</h2><p className="mt-1 text-ink-soft">{ev.text}</p></div>
        <div className="flex gap-2">
          <IconButton icon={ChevronLeft} label="Événement précédent" disabled={active === 0} onClick={() => setActive(active - 1)} />
          <IconButton icon={ChevronRight} label="Événement suivant" disabled={active === timeline.length - 1} onClick={() => setActive(active + 1)} />
        </div>
      </div>
    </MenuShell>
  );
}

const countries = [
  { name: 'Bénin', parishes: 1240, region: 'Afrique de l’Ouest' }, { name: 'Nigeria', parishes: 980, region: 'Afrique de l’Ouest' },
  { name: 'Togo', parishes: 310, region: 'Afrique de l’Ouest' }, { name: 'Ghana', parishes: 120, region: 'Afrique de l’Ouest' },
  { name: 'Côte d’Ivoire', parishes: 95, region: 'Afrique de l’Ouest' }, { name: 'France', parishes: 42, region: 'Europe' },
  { name: 'Royaume-Uni', parishes: 38, region: 'Europe' }, { name: 'États-Unis', parishes: 27, region: 'Amériques' },
  { name: 'Canada', parishes: 12, region: 'Amériques' }, { name: 'Gabon', parishes: 18, region: 'Afrique centrale' },
];

export function ExpansionPage() {
  const [region, setRegion] = useState('Toutes');
  const regions = ['Toutes', ...new Set(countries.map((c) => c.region))];
  const list = countries.filter((c) => region === 'Toutes' || c.region === region);
  const max = Math.max(...countries.map((c) => c.parishes));
  return (
    <MenuShell description="Présence de l'Église dans le monde (chiffres de démonstration)">
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Pays" value={countries.length} icon={Globe} />
        <StatTile label="Paroisses" value={countries.reduce((n, c) => n + c.parishes, 0).toLocaleString('fr-FR')} />
        <StatTile label="Continents" value="4" />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {regions.map((r) => <button key={r} onClick={() => setRegion(r)} className={cn('h-9 rounded-full px-4 text-sm font-semibold', region === r ? 'bg-brand-700 text-white' : 'bg-surface-sunken hover:bg-line')}>{r}</button>)}
      </div>
      <div className="card space-y-3 rounded-3xl p-5">
        {list.map((c) => (
          <div key={c.name} className="grid grid-cols-[120px_minmax(0,1fr)_60px] items-center gap-3 text-sm">
            <span className="truncate font-semibold">{c.name}</span>
            <span className="h-3 overflow-hidden rounded-full bg-surface-sunken"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${(c.parishes / max) * 100}%` }} /></span>
            <span className="text-right tabular-nums text-ink-muted">{c.parishes}</span>
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

const moments: { title: string; year: string; scene: SceneVariant; text: string }[] = [
  { title: 'Le premier culte', year: '1947', scene: 'candles', text: 'Récit de démonstration du tout premier rassemblement.' },
  { title: 'Les premières oppositions', year: '1948', scene: 'prayer', text: 'La croissance du mouvement suscite également des réactions.' },
  { title: 'Le grand pèlerinage', year: '1976', scene: 'beach', text: 'Des milliers de fidèles réunis au bord de la mer (démo).' },
  { title: 'Les chorales s’organisent', year: '1982', scene: 'choir', text: 'Naissance des grandes chorales paroissiales (démo).' },
  { title: 'Le jubilé', year: '1997', scene: 'birthday', text: 'Célébration des 50 ans de l’Église (démo).' },
  { title: 'L’ère numérique', year: '2026', scene: 'youth', text: 'Lancement de Cèlè One sur mobile et sur le web.' },
];

export function MomentsPage() {
  const [open, setOpen] = useState<(typeof moments)[number] | null>(null);
  return (
    <MenuShell description="Les événements qui ont marqué l'histoire de l'Église">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {moments.map((m) => (
          <button key={m.title} onClick={() => setOpen(m)} className="card card-hover overflow-hidden rounded-3xl text-left">
            <div className="relative h-36"><Scene variant={m.scene} playing={false} /><Chip tone="night" className="absolute left-3 top-3 bg-black/50">{m.year}</Chip></div>
            <div className="p-4"><p className="flex items-center gap-1.5 font-extrabold"><Star size={15} className="text-gold-500" />{m.title}</p><p className="text-sm text-ink-muted">{m.text}</p></div>
          </button>
        ))}
      </div>
      {open && (
        <Modal open onClose={() => setOpen(null)} title={open.title} description={open.year}>
          <div className="mb-3 h-44 overflow-hidden rounded-2xl"><Scene variant={open.scene} /></div>
          <p className="text-ink-soft">{open.text} Ce récit détaillé est un contenu de démonstration qui sera remplacé par les archives officielles.</p>
        </Modal>
      )}
    </MenuShell>
  );
}

const photos: { scene: SceneVariant; caption: string; year: string }[] = [
  { scene: 'candles', caption: 'Veillée de prière', year: '1952' }, { scene: 'choir', caption: 'Chorale de Porto-Novo', year: '1961' },
  { scene: 'beach', caption: 'Pèlerinage', year: '1976' }, { scene: 'sunrise', caption: 'Procession du matin', year: '1980' },
  { scene: 'drums', caption: 'Tambours de la fête', year: '1984' }, { scene: 'prayer', caption: 'Culte de miséricorde', year: '1990' },
  { scene: 'birthday', caption: 'Jubilé des 50 ans', year: '1997' }, { scene: 'youth', caption: 'Rencontre des jeunes', year: '2005' },
  { scene: 'choir', caption: 'Grande chorale', year: '2012' },
];

export function PhotosPage() {
  const [index, setIndex] = useState<number | null>(null);
  useEscape(index !== null, () => setIndex(null));
  return (
    <MenuShell description={`${photos.length} photos d'archives (visuels de démonstration)`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((p, i) => (
          <button key={i} onClick={() => setIndex(i)} className="group relative aspect-square overflow-hidden rounded-2xl" aria-label={`Ouvrir ${p.caption}`}>
            <Scene variant={p.scene} playing={false} className="grayscale-[40%] sepia-[30%] transition duration-300 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-left text-sm font-semibold text-white">{p.caption} · {p.year}</span>
          </button>
        ))}
      </div>
      {index !== null && createPortal(
        <div className="fixed inset-0 z-[80] flex animate-fade-in flex-col bg-night/95">
          <div className="flex items-center gap-2 p-4 text-white">
            <ImageIcon size={18} /><span className="flex-1 font-semibold">{photos[index].caption} · {photos[index].year}</span>
            <IconButton icon={Download} label="Télécharger" variant="glass" onClick={() => toast('Photo téléchargée (démo)')} />
            <IconButton icon={X} label="Fermer" variant="glass" onClick={() => setIndex(null)} />
          </div>
          <div className="relative flex flex-1 items-center justify-center p-4">
            <div className="aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-2xl"><Scene variant={photos[index].scene} playing={false} className="grayscale-[40%] sepia-[30%]" /></div>
            <IconButton icon={ChevronLeft} label="Photo précédente" variant="glass" size="lg" className="absolute left-4 top-1/2 -translate-y-1/2" disabled={index === 0} onClick={() => setIndex(index - 1)} />
            <IconButton icon={ChevronRight} label="Photo suivante" variant="glass" size="lg" className="absolute right-4 top-1/2 -translate-y-1/2" disabled={index === photos.length - 1} onClick={() => setIndex(index + 1)} />
          </div>
          <p className="pb-6 text-center text-sm text-white/60">{index + 1} / {photos.length}</p>
        </div>,
        document.body,
      )}
    </MenuShell>
  );
}

const historicVideos: { title: string; scene: SceneVariant; duration: string; year: string }[] = [
  { title: 'Archives : le pèlerinage de 1976', scene: 'beach', duration: '12:40', year: '1976' },
  { title: 'Témoignages des anciens', scene: 'prayer', duration: '24:05', year: '1995' },
  { title: 'Le jubilé des 50 ans', scene: 'birthday', duration: '38:12', year: '1997' },
  { title: 'Concert historique des chorales', scene: 'choir', duration: '45:30', year: '2003' },
];

export function VideosHistoriquesPage() {
  const [open, setOpen] = useState<(typeof historicVideos)[number] | null>(null);
  return (
    <MenuShell description="Documents filmés du patrimoine de l'Église">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {historicVideos.map((v) => (
          <button key={v.title} onClick={() => setOpen(v)} className="card card-hover overflow-hidden rounded-3xl text-left">
            <div className="relative aspect-video"><Scene variant={v.scene} playing={false} className="sepia-[25%]" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 text-white"><Play size={24} className="ml-1 fill-white" /></span></span><span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 text-xs font-semibold text-white">{v.duration}</span></div>
            <div className="p-4"><p className="font-extrabold">{v.title}</p><p className="text-sm text-ink-muted">Archive {v.year}</p></div>
          </button>
        ))}
      </div>
      {open && (
        <Modal open onClose={() => setOpen(null)} title={open.title} size="lg" footer={<Button variant="ghost" icon={Share2} onClick={() => openShare({ title: open.title, url: '/menu/patrimoine-eglise/videos-historiques' })}>Partager</Button>}>
          <VideoFrame scene={open.scene} className="aspect-video" />
        </Modal>
      )}
    </MenuShell>
  );
}
