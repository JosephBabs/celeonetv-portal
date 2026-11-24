import { useMemo, useState } from 'react';
import { Check, Download, HandCoins, HeartHandshake, Receipt, Wallet } from 'lucide-react';
import type { SceneVariant } from '@/data/types';
import { accountName, useApp } from '@/store/app';
import { menu, useMenu, type Donation } from '@/store/menu';
import { toast } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Overlay';
import { Scene } from '@/components/feed/Scene';
import { cn, formatDate, sleep } from '@/lib/utils';
import { BarChart, MenuShell, StatTile } from './MenuShell';

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

const projects: { id: string; name: string; text: string; goal: number; raised: number; scene: SceneVariant }[] = [
  { id: 'temple', name: 'Construction du temple de Djègbé', text: 'Achever la toiture et les finitions du nouveau temple.', goal: 25_000_000, raised: 16_400_000, scene: 'sunrise' },
  { id: 'jeunesse', name: 'Concours Jeunesse 2026', text: 'Prix, transport et restauration des candidats.', goal: 3_000_000, raised: 2_150_000, scene: 'youth' },
  { id: 'medias', name: 'Studio Cèlè One TV', text: 'Équiper le studio pour la diffusion en direct.', goal: 12_000_000, raised: 4_800_000, scene: 'choir' },
  { id: 'solidarite', name: 'Fonds de solidarité', text: 'Aide aux familles en difficulté et aux sinistrés.', goal: 5_000_000, raised: 3_900_000, scene: 'candles' },
  { id: 'dime', name: 'Dîme mensuelle', text: 'Contribution régulière à la vie de votre paroisse.', goal: 0, raised: 0, scene: 'prayer' },
];

function DonateModal({ project, onClose }: { project: (typeof projects)[number]; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState('MTN Mobile Money');
  const [phone, setPhone] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [paying, setPaying] = useState(false);
  const [don, setDon] = useState<Donation | null>(null);
  const pay = async () => {
    setPaying(true);
    await sleep(1400);
    setPaying(false);
    setDon(menu.donate({ projectId: project.id, projectName: project.name, amount, method, anonymous }));
    setStep(3);
  };
  return (
    <Modal open onClose={onClose} title={step === 3 ? 'Merci pour votre don !' : 'Faire un don'} description={project.name} size="sm"
      footer={step === 1 ? <Button disabled={amount < 500} onClick={() => setStep(2)}>Continuer · {fcfa(amount)}</Button> : step === 2 ? <><Button variant="ghost" onClick={() => setStep(1)}>Retour</Button><Button loading={paying} loadingText="Paiement…" disabled={method !== 'Carte bancaire' && phone.replace(/\D/g, '').length < 8} onClick={pay}>Confirmer le don</Button></> : <Button onClick={onClose}>Fermer</Button>}>
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">{[1000, 2000, 5000, 10000, 25000, 50000].map((v) => <button key={v} onClick={() => setAmount(v)} className={cn('h-12 rounded-xl border-2 text-sm font-bold', amount === v ? 'border-brand-600 bg-mint-100 text-brand-900' : 'border-line')}>{v.toLocaleString('fr-FR')}</button>)}</div>
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Autre montant (FCFA)</span><input type="number" min={500} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="field" /></label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-brand-600" /> Faire un don anonyme</label>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="rounded-xl bg-mint-100 px-4 py-2.5 text-sm font-semibold text-brand-900">Montant : {fcfa(amount)}</p>
          {['MTN Mobile Money', 'Moov Money', 'Carte bancaire'].map((m) => <label key={m} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm', method === m ? 'border-brand-400 bg-mint-50' : 'border-line')}><input type="radio" checked={method === m} onChange={() => setMethod(m)} className="accent-brand-600" />{m}</label>)}
          {method !== 'Carte bancaire' ? <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numéro Mobile Money" className="field" /> : <p className="text-xs text-ink-muted">Paiement par carte simulé pour la démonstration.</p>}
        </div>
      )}
      {step === 3 && don && (
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={30} strokeWidth={3} /></span>
          <p className="text-2xl font-black">{fcfa(don.amount)}</p>
          <p className="text-sm text-ink-muted">Reçu n° {don.id.toUpperCase()} disponible dans « Reçus ».</p>
        </div>
      )}
    </Modal>
  );
}

export function ProjetsPage() {
  const donations = useMenu((s) => s.donations);
  const [giving, setGiving] = useState<(typeof projects)[number] | null>(null);
  return (
    <MenuShell description="Soutenez les projets de l'Église (paiement simulé)">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((p) => {
          const mine = donations.filter((d) => d.projectId === p.id).reduce((n, d) => n + d.amount, 0);
          const pct = p.goal ? Math.min(100, Math.round(((p.raised + mine) / p.goal) * 100)) : null;
          return (
            <div key={p.id} className="card overflow-hidden rounded-3xl">
              <div className="h-28"><Scene variant={p.scene} playing={false} /></div>
              <div className="p-4">
                <p className="font-extrabold">{p.name}</p>
                <p className="text-sm text-ink-muted">{p.text}</p>
                {pct !== null && (
                  <>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
                    <p className="mt-1 text-xs text-ink-muted"><b className="text-ink">{fcfa(p.raised + mine)}</b> sur {fcfa(p.goal)} · {pct} %</p>
                  </>
                )}
                {mine > 0 && <p className="mt-1 text-xs font-semibold text-brand-700">Votre contribution : {fcfa(mine)}</p>}
                <Button className="mt-3" icon={HandCoins} onClick={() => setGiving(p)}>Faire un don</Button>
              </div>
            </div>
          );
        })}
      </div>
      {giving && <DonateModal project={giving} onClose={() => setGiving(null)} />}
    </MenuShell>
  );
}

function downloadReceipt(d: Donation, name: string) {
  const text = `REÇU DE DON — CÈLÈ ONE (démonstration)\n\nReçu n° : ${d.id.toUpperCase()}\nDonateur : ${d.anonymous ? 'Anonyme' : name}\nProjet : ${d.projectName}\nMontant : ${fcfa(d.amount)}\nMoyen de paiement : ${d.method}\nDate : ${formatDate(d.date)}\n\nMerci pour votre générosité.`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  a.download = `recu-${d.id}.txt`;
  a.click();
  toast('Reçu téléchargé');
}

export function RecusPage() {
  const donations = useMenu((s) => s.donations);
  const account = useApp((s) => s.account);
  return (
    <MenuShell description="Reçus de vos dons, téléchargeables">
      {donations.length === 0 ? <div className="card rounded-3xl"><EmptyState icon={Receipt} title="Aucun reçu" action={<Button to="/menu/dons/projets">Faire un don</Button>} /></div> : (
        <div className="space-y-2">
          {donations.map((d) => (
            <div key={d.id} className="card flex items-center gap-3 rounded-2xl p-4">
              <span className="icon-tile h-11 w-11 rounded-xl"><Receipt size={19} /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{d.projectName}</p><p className="text-xs text-ink-muted">N° {d.id.toUpperCase()} · {formatDate(d.date)} · {d.method}</p></div>
              <span className="font-black tabular-nums">{fcfa(d.amount)}</span>
              <Button size="sm" variant="soft" icon={Download} onClick={() => downloadReceipt(d, account ? accountName(account) : 'Membre')}>Reçu</Button>
            </div>
          ))}
        </div>
      )}
    </MenuShell>
  );
}

export function HistoriqueDonsPage() {
  const donations = useMenu((s) => s.donations);
  const years = [...new Set(donations.map((d) => new Date(d.date).getFullYear()))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear());
  const list = donations.filter((d) => new Date(d.date).getFullYear() === year);
  const months = useMemo(() => ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'].map((label, m) => ({ label, value: list.filter((d) => new Date(d.date).getMonth() === m).reduce((n, d) => n + d.amount, 0) })), [list]);
  const total = list.reduce((n, d) => n + d.amount, 0);
  return (
    <MenuShell description="Suivi de vos contributions">
      <div className="mb-3 flex gap-2">{(years.length ? years : [year]).map((y) => <button key={y} onClick={() => setYear(y)} className={cn('h-9 rounded-full px-4 text-sm font-semibold', year === y ? 'bg-brand-700 text-white' : 'bg-surface-sunken')}>{y}</button>)}</div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Total" value={fcfa(total)} icon={Wallet} />
        <StatTile label="Dons" value={list.length} icon={HeartHandshake} />
        <StatTile label="Projets soutenus" value={new Set(list.map((d) => d.projectId)).size} />
      </div>
      <BarChart title={`Dons par mois — ${year}`} data={months} unit=" FCFA" />
      <div className="mt-4 space-y-2">{list.map((d) => <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-xs"><span className="w-24 text-ink-muted">{formatDate(d.date)}</span><span className="flex-1 truncate font-semibold">{d.projectName}</span><span className="font-bold tabular-nums">{fcfa(d.amount)}</span></div>)}</div>
    </MenuShell>
  );
}
