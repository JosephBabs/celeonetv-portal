import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck, Bell, Briefcase, Camera, Check, ChevronLeft, ChevronRight, ChevronUp, CreditCard, Crown, Database, Ellipsis, FileText, Gauge,
  HardDrive, Hand, Info, KeyRound, Languages, Laptop, LifeBuoy, Lock, LogOut, Mail, MapPin, Mic, Pencil, Phone, PlayCircle, Save, Search, Settings, Share2,
  ShieldCheck, Smartphone, SunMoon, UserRound, Wrench, X,
} from 'lucide-react';
import { accountName, actions, appStore, useApp } from '@/store/app';
import { authService } from '@/services/auth';
import { ApiError } from '@/lib/api';
import { settings, useSettings } from '@/store/settings';
import { confirmDialog, openShare, toast, withLoader } from '@/store/ui';
import { compressImage } from '@/lib/image';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { Toggle } from '@/components/ui/Toggle';
import { LogoMark } from '@/components/ui/Logo';
import { MenuItem, Popover } from '@/components/ui/Popover';
import { cn, formatDate, normalize, sleep, timeAgo } from '@/lib/utils';

const parishSuggestions = ['Paroisse Alpha Oméga, Lokossa', 'Paroisse Jéricho, Cotonou', 'Paroisse Sion, Porto-Novo', 'Paroisse Béthel, Abomey-Calavi', 'Paroisse Emmanuel, Ouidah', 'Paroisse Canaan, Bohicon'];
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const planLabel = { gratuit: 'Formule gratuite', premium: 'Premium', famille: 'Famille' } as const;
const languageOptions = [
  { id: 'fr', label: 'Français', native: 'Français' },
  { id: 'en', label: 'Anglais', native: 'English (US)' },
  { id: 'yoruba', label: 'Yoruba', native: 'Yorùbá' },
  { id: 'goun', label: 'Goun', native: 'Gungbe' },
  { id: 'fon', label: 'Fon', native: 'Fɔngbe' },
];

/* ───────────── Mettre à jour le profil ───────────── */

function IconField({ icon: Icon, label, error, children }: { icon: typeof UserRound; label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-muted">{label}</span>
      <span className={cn('flex h-14 items-center gap-3 rounded-2xl border bg-surface-sunken px-4 transition focus-within:border-brand-400 focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand-500/10', error ? 'border-danger' : 'border-transparent')}>
        <Icon size={19} className="shrink-0 text-ink-muted" />
        {children}
      </span>
      {error && <span className="mt-1 block text-xs font-medium text-danger-700">{error}</span>}
    </label>
  );
}

const providers = [
  { name: 'Koffi Amoussou', job: 'Électricien', years: 8, city: 'Cotonou' },
  { name: 'Rose Agbodjan', job: 'Couturière (soutanes)', years: 12, city: 'Porto-Novo' },
  { name: 'Hervé Dossou', job: 'Plombier', years: 6, city: 'Abomey-Calavi' },
  { name: 'Clarisse Hounkpè', job: 'Comptable', years: 10, city: 'Lokossa' },
  { name: 'Marcel Zannou', job: 'Maçon', years: 15, city: 'Ouidah' },
  { name: 'Sylvie Ahouansou', job: 'Infographiste', years: 4, city: 'Cotonou' },
];

function SkilledWorkers() {
  const [query, setQuery] = useState('');
  const [contact, setContact] = useState<(typeof providers)[number] | null>(null);
  const [message, setMessage] = useState('');
  const found = useMemo(() => providers.filter((p) => normalize(`${p.name} ${p.job} ${p.city}`).includes(normalize(query))), [query]);
  return (
    <div className="card rounded-3xl p-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><Wrench size={18} className="text-brand-600" /> Trouver des prestataires</h2>
      <p className="mb-3 text-sm text-ink-muted">Recherchez des professionnels vérifiés et envoyez votre demande à l'administration. L'administration contactera le prestataire et lui proposera le travail.</p>
      <IconField icon={Search} label="Rechercher un prestataire">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, métier ou ville" className="h-full flex-1 bg-transparent text-[15px] outline-none" />
      </IconField>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {found.length === 0 && <p className="py-6 text-center text-sm text-ink-muted">Aucun prestataire trouvé.</p>}
        {found.map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-2xl border border-line p-3">
            <Avatar name={p.name} hue={p.name.length * 23} size="md" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate font-bold">{p.name} <BadgeCheck size={15} className="shrink-0 fill-brand-600 text-white" /></p>
              <p className="truncate text-xs text-ink-muted">{p.job} · {p.city}</p>
              <p className="text-xs text-ink-muted">Professionnel vérifié · {p.years} ans</p>
            </div>
            <Button size="sm" onClick={() => setContact(p)}>Contacter l'admin</Button>
          </div>
        ))}
      </div>
      <Modal open={!!contact} onClose={() => setContact(null)} title="Demande de mise en relation" description={contact ? `${contact.name} · ${contact.job}` : ''} size="sm"
        footer={<Button icon={Mail} disabled={message.trim().length < 5} onClick={() => { setContact(null); setMessage(''); toast('Demande transmise à l’administration'); }}>Envoyer à l'administration</Button>}>
        <textarea autoFocus value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="field h-auto resize-none py-2.5" placeholder="Décrivez votre besoin…" />
      </Modal>
    </div>
  );
}

/** Confidentialité : appliquée tout de suite, puis synchronisée avec l'API pour un compte réel. */
async function updatePrivacy(key: 'hidePhone' | 'hideEmail', value: boolean) {
  const account = appStore.get().account;
  const previous = account?.[key];
  actions.updateAccount({ [key]: value });
  const label = key === 'hidePhone' ? 'Numéro' : 'E-mail';
  if (!account?.remote) return toast(value ? `${label} masqué sur votre profil` : `${label} visible sur votre profil`);
  try {
    await authService.updatePrivacy({ [key]: value });
    toast(value ? `${label} masqué sur votre profil` : `${label} visible sur votre profil`);
  } catch (err) {
    actions.updateAccount({ [key]: previous });
    toast(err instanceof ApiError ? err.message : 'Modification impossible.', { tone: 'danger' });
  }
}

function UpdateProfileSection() {
  const account = useApp((s) => s.account)!;
  const defaultEmail = account.email ?? (isEmail(account.identifier) ? account.identifier : '');
  const [form, setForm] = useState({ firstName: account.firstName, lastName: account.lastName, parish: account.parish, phone: account.phone, email: defaultEmail, bio: account.bio ?? '' });
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errors = {
    firstName: form.firstName.trim() ? '' : 'Le prénom est requis.',
    lastName: form.lastName.trim() ? '' : 'Le nom est requis.',
    phone: !form.phone || form.phone.replace(/\D/g, '').length >= 8 ? '' : 'Numéro de téléphone invalide.',
    email: !form.email || isEmail(form.email) ? '' : 'Adresse e-mail invalide.',
  };
  const valid = !Object.values(errors).some(Boolean);
  const dirty = form.firstName !== account.firstName || form.lastName !== account.lastName || form.parish !== account.parish || form.phone !== account.phone || form.email !== defaultEmail || form.bio !== (account.bio ?? '');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    await sleep(700);
    actions.updateAccount({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), parish: form.parish.trim(), phone: form.phone.trim(), email: form.email.trim(), bio: form.bio.trim() });
    setSaving(false);
    toast('Profil mis à jour');
  };
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const inputCls = 'h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-ink-faint';

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0B565A,#2FA5A9)] p-4 shadow-md">
        <div className="mb-4 flex items-center gap-3 text-white">
          <h2 className="flex-1 font-display text-[22px] font-black">Mettre à jour le profil</h2>
          <LogoMark className="h-11 w-11 rounded-full bg-white p-0.5" />
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-mint-50 p-4">
          <div className="relative shrink-0">
            {account.avatar ? <img src={account.avatar} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : <span className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: `linear-gradient(135deg, hsl(${account.hue} 62% 52%), hsl(${(account.hue + 40) % 360} 58% 38%))` }}>{account.firstName[0]}{account.lastName[0]}</span>}
            <IconButton icon={Camera} label="Changer la photo de profil" size="sm" variant="white" className="absolute -bottom-1.5 -right-1.5 ring-1 ring-line" onClick={() => input.current?.click()} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-ink">{accountName(account)}</p>
            <p className="truncate text-sm text-ink-soft">{defaultEmail || account.identifier}</p>
            <p className="text-xs text-ink-muted">Touchez l'appareil photo pour changer votre photo de profil</p>
          </div>
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { actions.updateAccount({ avatar: await compressImage(f, 480) }); toast('Photo de profil mise à jour'); } catch (err) { toast((err as Error).message, { tone: 'danger' }); } }} />

      <form onSubmit={submit} className="card space-y-4 rounded-3xl p-5" noValidate>
        <h2 className="text-lg font-extrabold">Informations personnelles</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <IconField icon={UserRound} label="Prénom" error={errors.firstName}><input value={form.firstName} onChange={set('firstName')} autoComplete="given-name" className={inputCls} /></IconField>
          <IconField icon={UserRound} label="Nom" error={errors.lastName}><input value={form.lastName} onChange={set('lastName')} autoComplete="family-name" className={inputCls} /></IconField>
          <IconField icon={MapPin} label="Nom de la paroisse"><input list="profile-parishes" value={form.parish} onChange={set('parish')} className={inputCls} placeholder="Votre paroisse" /></IconField>
          <IconField icon={Phone} label="Numéro de téléphone" error={errors.phone}><input value={form.phone} onChange={set('phone')} autoComplete="tel" className={inputCls} placeholder="+229 …" /></IconField>
        </div>
        <datalist id="profile-parishes">{parishSuggestions.map((p) => <option key={p} value={p} />)}</datalist>
        <IconField icon={Mail} label="Adresse e-mail" error={errors.email}><input type="email" value={form.email} onChange={set('email')} autoComplete="email" className={inputCls} placeholder="nom@exemple.com" /></IconField>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-muted">Présentation (visible sur le profil social)</span>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 160) })} rows={3} className="field h-auto resize-none rounded-2xl py-3" placeholder="Quelques mots sur vous…" />
        </label>

        <div className="rounded-2xl border border-line p-4">
          <h3 className="font-extrabold">Confidentialité du profil</h3>
          <p className="mb-2 text-sm text-ink-muted">Choisissez les coordonnées visibles sur votre profil. Les modifications sont enregistrées immédiatement.</p>
          <div className="divide-y divide-line">
            <Row title="Masquer mon numéro de téléphone"><Toggle checked={!!account.hidePhone} onChange={(v) => updatePrivacy('hidePhone', v)} label="Masquer mon numéro de téléphone" /></Row>
            <Row title="Masquer mon adresse e-mail"><Toggle checked={!!account.hideEmail} onChange={(v) => updatePrivacy('hideEmail', v)} label="Masquer mon adresse e-mail" /></Row>
          </div>
        </div>

        <Button type="submit" size="lg" block icon={Save} disabled={!valid || !dirty} loading={saving} loadingText="Enregistrement…">Enregistrer</Button>
        <p className="text-center text-sm text-ink-muted">Votre profil est enregistré sur votre compte Cèlè One et vous suit dans tous les modules où vous êtes connecté.</p>
      </form>

      <SkilledWorkers />
    </div>
  );
}

/* ───────────── Langue, pages légales, À propos ───────────── */

function LanguageSection() {
  const language = useApp((s) => s.language);
  return (
    <div>
      <h2 className="text-lg font-extrabold">Langue</h2>
      <p className="mb-4 text-sm text-ink-muted">Langue de l'interface. Les traductions arrivent progressivement ; le contenu reste en français en attendant.</p>
      <div className="space-y-1.5">
        {languageOptions.map((l) => (
          <button key={l.id} onClick={() => { actions.setLanguage(l.id); toast(l.id === 'fr' ? 'Langue : français' : `${l.label} sélectionné — traduction bientôt disponible`); }} aria-pressed={language === l.id} className={cn('flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition', language === l.id ? 'border-brand-400 bg-mint-50' : 'border-line hover:bg-surface-sunken')}>
            <span className="flex-1"><span className="block font-bold">{l.label}</span><span className="block text-xs text-ink-muted">{l.native}</span></span>
            {language === l.id && <Check size={18} className="text-brand-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}

const legal: Record<string, { title: string; updated: string; sections: [string, string][] }> = {
  confidentialite: {
    title: 'Politique de confidentialité', updated: '2026-09-01',
    sections: [
      ['Données collectées', 'Nom, coordonnées, paroisse, contenus publiés et préférences. Texte de démonstration à remplacer par la politique officielle.'],
      ['Utilisation', 'Les données servent au fonctionnement des services (social, discussions, agenda, notifications) et ne sont pas revendues.'],
      ['Visibilité', 'Vous choisissez les coordonnées visibles sur votre profil depuis « Mettre à jour le profil ».'],
      ['Vos droits', 'Vous pouvez demander l’accès, la rectification ou la suppression de vos données auprès du support.'],
    ],
  },
  conditions: {
    title: "Conditions d'utilisation", updated: '2026-09-01',
    sections: [
      ['Objet', 'Les présentes conditions encadrent l’usage de la plateforme Cèlè One (texte de démonstration).'],
      ['Comportement', 'Respect des membres, de la doctrine et des règles de la communauté ; tout contenu offensant peut être retiré.'],
      ['Contenus', 'Vous restez propriétaire de vos contenus et accordez à Cèlè One le droit de les diffuser sur la plateforme.'],
      ['Résiliation', 'Vous pouvez supprimer votre compte à tout moment depuis le support.'],
    ],
  },
  mentions: {
    title: 'Mentions légales', updated: '2026-09-01',
    sections: [
      ['Éditeur', 'Cèlè One International — informations d’immatriculation de démonstration.'],
      ['Hébergement', 'Hébergeur et adresse à compléter par l’administration.'],
      ['Contact', 'support@celeone.demo'],
    ],
  },
};

function LegalSection({ id }: { id: string }) {
  const doc = legal[id];
  return (
    <article>
      <h2 className="text-lg font-extrabold">{doc.title}</h2>
      <p className="mb-4 text-xs text-ink-muted">Dernière mise à jour : {formatDate(doc.updated)}</p>
      <p className="mb-4 rounded-xl bg-gold-50 px-4 py-2.5 text-sm text-gold-700">Texte de démonstration — la version juridique officielle sera fournie par l'administration.</p>
      {doc.sections.map(([t, x]) => (
        <section key={t} className="mb-4"><h3 className="font-bold">{t}</h3><p className="text-sm leading-relaxed text-ink-soft">{x}</p></section>
      ))}
    </article>
  );
}

function AboutSection() {
  return (
    <div className="text-center">
      <LogoMark className="mx-auto h-24 w-24" />
      <h2 className="mt-3 font-display text-2xl font-black text-brand-900">Cèlè<span className="text-brand-600">One</span> Web</h2>
      <p className="text-sm text-ink-muted">Version 1.0.0 (démonstration) · {formatDate(new Date().toISOString())}</p>
      <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">La plateforme des célestes : cantiques, Bible, cultes en direct, discussions, agenda et vie de votre paroisse, réunis sur le web et le mobile.</p>
      <div className="mx-auto mt-5 max-w-sm divide-y divide-line rounded-2xl border border-line text-left text-sm">
        {[['Application mobile', 'Android et iOS'], ['Support', 'support@celeone.demo'], ['Licences', 'Lucide, Leaflet, OpenStreetMap']].map(([a, b]) => (
          <p key={a} className="flex justify-between gap-3 px-4 py-2.5"><span className="text-ink-muted">{a}</span><span className="font-semibold">{b}</span></p>
        ))}
      </div>
      <p className="mt-5 text-xs text-ink-faint">© 2026 CélèOne — Église du Christianisme Céleste</p>
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p>{hint && <p className="text-xs text-ink-muted">{hint}</p>}</div>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl bg-surface-sunken p-1">
      {options.map((o) => (
        <button key={String(o.value)} onClick={() => onChange(o.value)} className={cn('h-8 rounded-lg px-3 text-xs font-semibold transition', value === o.value ? 'bg-surface text-brand-800 shadow-xs' : 'text-ink-muted hover:text-ink')}>{o.label}</button>
      ))}
    </div>
  );
}

function SecuritySection() {
  const sessions = useSettings((s) => s.sessions);
  const twoFactor = useSettings((s) => s.twoFactor);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.current.length < 8) return setError('Mot de passe actuel incorrect (8 caractères minimum).');
    if (pwd.next.length < 8) return setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    if (pwd.next !== pwd.confirm) return setError('Les mots de passe ne correspondent pas.');
    setError('');
    setSaving(true);
    await sleep(800);
    setSaving(false);
    setPwd({ current: '', next: '', confirm: '' });
    toast('Mot de passe modifié');
  };
  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <h3 className="flex items-center gap-2 font-extrabold"><KeyRound size={17} /> Changer le mot de passe</h3>
        {(['current', 'next', 'confirm'] as const).map((k) => (
          <input key={k} type="password" value={pwd[k]} onChange={(e) => setPwd({ ...pwd, [k]: e.target.value })} placeholder={{ current: 'Mot de passe actuel', next: 'Nouveau mot de passe', confirm: 'Confirmer le nouveau mot de passe' }[k]} className="field" />
        ))}
        {error && <p className="text-sm font-medium text-danger-700">{error}</p>}
        <Button type="submit" loading={saving} loadingText="Modification…">Modifier le mot de passe</Button>
      </form>
      <div className="divide-y divide-line">
        <Row title="Validation en deux étapes" hint="Un code vous sera envoyé par SMS à chaque connexion"><Toggle checked={twoFactor} onChange={(v) => { settings.set({ twoFactor: v }); toast(v ? 'Validation en deux étapes activée' : 'Validation en deux étapes désactivée'); }} label="Validation en deux étapes" /></Row>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-extrabold">Sessions actives</h3>
          {sessions.length > 1 && <Button size="sm" variant="danger-soft" icon={LogOut} onClick={async () => { if (await confirmDialog({ title: 'Déconnecter les autres appareils ?', confirmLabel: 'Déconnecter', tone: 'danger' })) { settings.revokeOthers(); toast('Autres appareils déconnectés'); } }}>Déconnecter les autres</Button>}
        </div>
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 border-t border-line py-3">
            <span className="icon-tile h-10 w-10 rounded-xl">{s.device.includes('Téléphone') ? <Smartphone size={18} /> : <Laptop size={18} />}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.device}</p><p className="text-xs text-ink-muted">{s.location} · {s.current ? 'Session actuelle' : timeAgo(s.lastActive)}</p></div>
            {!s.current && <Button size="sm" variant="ghost" onClick={() => { settings.revokeSession(s.id); toast('Appareil déconnecté'); }}>Déconnecter</Button>}
          </div>
        ))}
      </div>
    </div>
  );
}

const plans = [
  { id: 'gratuit' as const, name: 'Gratuit', price: '0 FCFA', perks: ['Cantiques, Bible et documents', 'Social et discussions', 'Live TV avec publicité'] },
  { id: 'premium' as const, name: 'Premium', price: '1 500 FCFA / mois', perks: ['Tout le gratuit', 'Streaming sans publicité', 'Téléchargements hors connexion', 'Audio haute qualité'] },
  { id: 'famille' as const, name: 'Famille', price: '3 000 FCFA / mois', perks: ['Premium pour 5 comptes', 'Contrôle parental Jeunesse', 'Support prioritaire'] },
];

function SubscriptionSection() {
  const plan = useSettings((s) => s.plan);
  const payment = useSettings((s) => s.paymentMethod);
  const [choice, setChoice] = useState<(typeof plans)[number] | null>(null);
  const [method, setMethod] = useState('MTN Mobile Money');
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={cn('flex flex-col rounded-2xl border-2 p-4', plan === p.id ? 'border-brand-500 bg-mint-50' : 'border-line')}>
            <p className="flex items-center gap-2 font-extrabold">{p.id !== 'gratuit' && <Crown size={16} className="text-gold-500" />}{p.name}</p>
            <p className="font-display text-xl font-black">{p.price}</p>
            <ul className="my-3 flex-1 space-y-1 text-sm text-ink-soft">{p.perks.map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-brand-600" />{x}</li>)}</ul>
            {plan === p.id ? <span className="rounded-full bg-brand-600 py-2 text-center text-sm font-bold text-white">Formule actuelle</span> : <Button variant={p.id === 'gratuit' ? 'ghost' : 'primary'} onClick={() => (p.id === 'gratuit' ? confirmDialog({ title: 'Revenir à la formule gratuite ?', confirmLabel: 'Confirmer' }).then((ok) => { if (ok) { settings.set({ plan: 'gratuit' }); toast('Abonnement résilié'); } }) : setChoice(p))}>{p.id === 'gratuit' ? 'Rétrograder' : 'Choisir'}</Button>}
          </div>
        ))}
      </div>
      <div className="divide-y divide-line">
        <Row title="Moyen de paiement" hint={payment ?? 'Aucun moyen enregistré'}><CreditCard size={18} className="text-ink-muted" /></Row>
      </div>
      <Modal open={!!choice} onClose={() => setChoice(null)} title={`Passer à ${choice?.name}`} description={choice?.price} size="sm"
        footer={<Button loading={paying} loadingText="Paiement en cours…" disabled={method !== 'Carte bancaire' && phone.replace(/\D/g, '').length < 8} onClick={async () => { setPaying(true); await sleep(1300); setPaying(false); settings.set({ plan: choice!.id, paymentMethod: method === 'Carte bancaire' ? 'Carte •••• 4242' : `${method} · ${phone}` }); setChoice(null); toast(`Bienvenue dans la formule ${choice!.name} !`); }}>Payer et confirmer</Button>}>
        <p className="mb-2 text-sm font-semibold">Moyen de paiement (démo)</p>
        <div className="mb-3 space-y-1.5">
          {['MTN Mobile Money', 'Moov Money', 'Carte bancaire'].map((m) => (
            <label key={m} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm', method === m ? 'border-brand-400 bg-mint-50' : 'border-line')}>
              <input type="radio" checked={method === m} onChange={() => setMethod(m)} className="accent-brand-600" /> {m}
            </label>
          ))}
        </div>
        {method !== 'Carte bancaire' ? <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numéro Mobile Money" className="field" /> : <p className="rounded-xl bg-surface-sunken p-3 text-sm text-ink-muted">Le paiement par carte est simulé pour la démonstration.</p>}
      </Modal>
    </div>
  );
}


/* ───────────── Hub « Profil » (paramètres généraux) ───────────── */

interface Entry { id: string; label: string; icon: typeof UserRound; toggle?: boolean }

const groups: Entry[][] = [
  [
    { id: 'profil', label: 'Profil', icon: UserRound },
    { id: 'notifications', label: 'Notifications', icon: Bell, toggle: true },
    { id: 'apparence', label: 'Apparence', icon: SunMoon },
    { id: 'audio-video', label: 'Audio & vidéo', icon: Mic },
    { id: 'lecture', label: 'Lecture', icon: PlayCircle },
    { id: 'donnees', label: 'Données & stockage', icon: Database },
    { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
    { id: 'abonnement', label: 'Abonnement', icon: CreditCard },
    { id: 'langue', label: 'Langue', icon: Languages },
  ],
  [
    { id: 'confidentialite', label: 'Politique de confidentialité', icon: FileText },
    { id: 'conditions', label: "Conditions d'utilisation", icon: Hand },
    { id: 'mentions', label: 'Mentions légales', icon: Briefcase },
    { id: 'a-propos', label: "À propos de l'application", icon: Info },
  ],
];
const allEntries = groups.flat();

const notifLabels: [string, string, string][] = [
  ['messages', 'Messages', 'Nouveaux messages et appels manqués'],
  ['social', 'Social', 'Demandes d’amis, mentions, réactions'],
  ['publications', 'Publications', 'Commentaires sur vos publications'],
  ['evenements', 'Événements', 'Rappels d’agenda et événements'],
  ['cultes', 'Cultes en direct', 'Quand une chaîne suivie passe en direct'],
  ['jeunesse', 'Jeunesse', 'Résultats et calendrier du concours'],
  ['email', 'Résumé par e-mail', 'Un récapitulatif chaque semaine'],
];

function SectionContent({ id }: { id: string }) {
  const s = useSettings((x) => x);
  switch (id) {
    case 'apparence':
      return (
        <div>
          <h2 className="text-lg font-extrabold">Apparence</h2>
          <p className="mb-4 text-sm text-ink-muted">Choisissez le thème de CélèOne. « Système » suit le réglage de votre appareil.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              { id: 'clair', label: 'Clair', bg: '#f3f6f5', card: '#ffffff', ink: '#14231f' },
              { id: 'sombre', label: 'Sombre', bg: '#0a1312', card: '#131e1d', ink: '#e8f0ee' },
              { id: 'systeme', label: 'Système', bg: 'linear-gradient(90deg,#f3f6f5 50%,#0a1312 50%)', card: 'linear-gradient(90deg,#ffffff 50%,#131e1d 50%)', ink: '#1D8A8F' },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => { settings.set({ theme: t.id }); toast(`Thème ${t.label.toLowerCase()} appliqué`); }} aria-pressed={s.theme === t.id} className={cn('overflow-hidden rounded-2xl border-2 text-left transition', s.theme === t.id ? 'border-brand-500 ring-4 ring-brand-500/15' : 'border-line hover:border-line-strong')}>
                <div className="h-24 p-3" style={{ background: t.bg }}>
                  <div className="h-full rounded-xl p-2.5 shadow-sm" style={{ background: t.card }}>
                    <div className="mb-1.5 h-2 w-1/2 rounded-full" style={{ background: t.ink, opacity: 0.8 }} />
                    <div className="mb-1.5 h-2 w-3/4 rounded-full" style={{ background: t.ink, opacity: 0.3 }} />
                    <div className="h-4 w-1/3 rounded-full bg-brand-600" />
                  </div>
                </div>
                <p className="flex items-center justify-between px-3 py-2.5 text-sm font-bold">{t.label}{s.theme === t.id && <Check size={16} className="text-brand-600" />}</p>
              </button>
            ))}
          </div>
        </div>
      );
    case 'notifications':
      return (
        <div>
          <h2 className="text-lg font-extrabold">Notifications</h2>
          <div className="mt-2 rounded-2xl bg-mint-50 px-4">
            <Row title="Activer les notifications" hint="Coupe toutes les alertes de l'application"><Toggle checked={s.pushEnabled} onChange={(v) => { settings.set({ pushEnabled: v }); toast(v ? 'Notifications activées' : 'Notifications désactivées'); }} label="Activer les notifications" /></Row>
          </div>
          <div className={cn('divide-y divide-line', !s.pushEnabled && 'pointer-events-none opacity-45')} aria-disabled={!s.pushEnabled}>
            {notifLabels.map(([k, t, h]) => <Row key={k} title={t} hint={h}><Toggle checked={!!s.notifications[k]} disabled={!s.pushEnabled} onChange={() => settings.toggleNotification(k)} label={t} /></Row>)}
          </div>
        </div>
      );
    case 'audio-video':
      return (
        <div>
          <h2 className="text-lg font-extrabold">Audio & vidéo</h2>
          <div className="divide-y divide-line">
            <Row title="Qualité vidéo par défaut"><Segmented value={s.videoQuality} onChange={(v) => settings.set({ videoQuality: v })} options={[{ value: 'auto', label: 'Auto' }, { value: 'haute', label: 'Haute' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'basse', label: 'Basse' }]} /></Row>
            <Row title="Qualité audio"><Segmented value={s.audioQuality} onChange={(v) => settings.set({ audioQuality: v })} options={[{ value: 'normale', label: 'Normale' }, { value: 'haute', label: 'Haute' }]} /></Row>
            <Row title="Sous-titres" hint="Afficher les sous-titres lorsqu'ils existent"><Toggle checked={s.subtitles} onChange={(v) => settings.set({ subtitles: v })} label="Sous-titres" /></Row>
          </div>
        </div>
      );
    case 'lecture':
      return (
        <div>
          <h2 className="text-lg font-extrabold">Lecture</h2>
          <div className="divide-y divide-line">
            <Row title="Vitesse de lecture"><Segmented value={s.playbackSpeed} onChange={(v) => settings.set({ playbackSpeed: v })} options={[0.75, 1, 1.25, 1.5].map((v) => ({ value: v, label: `${v}×` }))} /></Row>
            <Row title="Lecture automatique" hint="Enchaîner la vidéo ou le cantique suivant"><Toggle checked={s.autoplay} onChange={(v) => settings.set({ autoplay: v })} label="Lecture automatique" /></Row>
          </div>
        </div>
      );
    case 'donnees':
      return (
        <div>
          <h2 className="text-lg font-extrabold">Données & stockage</h2>
          <div className="divide-y divide-line">
            <Row title="Économiseur de données" hint="Réduit la qualité des médias sur réseau mobile"><Toggle checked={s.dataSaver} onChange={(v) => settings.set({ dataSaver: v })} label="Économiseur de données" /></Row>
            <Row title="Téléchargements en Wi-Fi uniquement"><Toggle checked={s.wifiOnlyDownloads} onChange={(v) => settings.set({ wifiOnlyDownloads: v })} label="Wi-Fi uniquement" /></Row>
            <Row title="Cache de l'application" hint={`${s.cacheMb} Mo utilisés`}><Button size="sm" variant="ghost" icon={HardDrive} disabled={s.cacheMb === 0} onClick={async () => { await sleep(500); settings.set({ cacheMb: 0 }); toast('Cache vidé'); }}>Vider</Button></Row>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, s.cacheMb / 5)}%` }} /></div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><Gauge size={13} /> {s.cacheMb} Mo sur 500 Mo alloués</p>
        </div>
      );
    case 'securite':
      return <div><h2 className="mb-3 text-lg font-extrabold">Sécurité</h2><SecuritySection /></div>;
    case 'abonnement':
      return <div><h2 className="mb-3 text-lg font-extrabold">Paramètres d'abonnement</h2><SubscriptionSection /></div>;
    case 'langue':
      return <LanguageSection />;
    case 'confidentialite':
    case 'conditions':
    case 'mentions':
      return <LegalSection id={id} />;
    case 'a-propos':
      return <AboutSection />;
    default:
      return null;
  }
}

function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const [topic, setTopic] = useState('Problème technique');
  return (
    <Modal open={open} onClose={onClose} title="Contacter le support" description="Obtenez de l'aide ou signalez un problème" size="sm"
      footer={<Button icon={LifeBuoy} disabled={msg.trim().length < 10} onClick={() => { onClose(); setMsg(''); toast('Message envoyé — réponse sous 24 h'); }}>Envoyer</Button>}>
      <div className="mb-3 flex flex-wrap gap-2">
        {['Problème technique', 'Compte', 'Abonnement', 'Suggestion'].map((t) => (
          <button key={t} onClick={() => setTopic(t)} className={cn('h-9 rounded-full border px-3.5 text-sm font-semibold', topic === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{t}</button>
        ))}
      </div>
      <textarea autoFocus value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} className="field h-auto resize-none py-2.5" placeholder="Décrivez votre problème…" />
      <Link to="/menu/compte/aide" onClick={onClose} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">Consulter la FAQ</Link>
    </Modal>
  );
}

export function ProfilePage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const account = useApp((s) => s.account);
  const language = useApp((s) => s.language);
  const plan = useSettings((s) => s.plan);
  const pushEnabled = useSettings((s) => s.pushEnabled);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [support, setSupport] = useState(false);
  if (!account) return null;

  const active = allEntries.find((e) => e.id === section) ? section! : null;
  const shown = active ?? 'profil';
  const q = normalize(query.trim());
  const filtered = groups.map((g) => g.filter((e) => !q || normalize(e.label).includes(q))).filter((g) => g.length);
  const email = account.email ?? (isEmail(account.identifier) ? account.identifier : account.identifier);
  const valueFor = (id: string) => (id === 'abonnement' ? planLabel[plan] : id === 'langue' ? languageOptions.find((l) => l.id === language)?.native ?? 'Français' : null);
  const open = (id: string) => navigate(`/profil/parametres/${id}`);

  const logout = async () => {
    if (!(await confirmDialog({ title: 'Se déconnecter ?', message: 'Vous pourrez vous reconnecter avec votre profil enregistré.', confirmLabel: 'Se déconnecter', tone: 'danger' }))) return;
    withLoader('Déconnexion…', 800, () => {
      actions.logout();
      navigate('/connexion');
    });
  };

  const entryRow = (e: Entry) => {
    const value = valueFor(e.id);
    const isActive = shown === e.id;
    return (
      <div key={e.id} className={cn('flex items-center gap-3 px-3 transition md:rounded-xl', isActive && 'md:bg-mint-100')}>
        <button onClick={() => open(e.id)} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 text-left" aria-current={isActive ? 'page' : undefined}>
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isActive ? 'bg-surface-sunken text-ink-soft md:bg-surface md:text-brand-700' : 'bg-surface-sunken text-ink-soft')}><e.icon size={19} /></span>
          <span className={cn('min-w-0 flex-1 truncate text-[15.5px] font-semibold', isActive && 'md:text-brand-900')}>{e.label}</span>
          {value && <span className="shrink-0 text-sm text-ink-muted">{value}</span>}
        </button>
        {e.toggle ? <Toggle checked={pushEnabled} onChange={(v) => { settings.set({ pushEnabled: v }); toast(v ? 'Notifications activées' : 'Notifications désactivées'); }} label="Activer les notifications" /> : <ChevronRight size={18} className="shrink-0 text-ink-faint" />}
      </div>
    );
  };

  return (
    <div className="pb-12">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[340px_minmax(0,1fr)]">
        {/* Colonne hub */}
        <div className={cn('space-y-4', active && 'hidden md:block')}>
          <div className="card rounded-3xl p-4 shadow-md">
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-brand-800"><Settings size={20} /></span>
              <h1 className="flex-1 font-display text-[26px] font-black text-brand-900">Profil</h1>
              <Popover className="w-72" trigger={({ toggle, open: o }) => <IconButton icon={Ellipsis} label="Plus d'options" shape="square" active={o} onClick={toggle} />}>
                {(close) => (
                  <div className="p-2">
                    <p className="px-3 pt-1 font-extrabold">Plus d'options</p>
                    <p className="mb-1 px-3 text-xs text-ink-muted">Partage, support et informations</p>
                    <MenuItem icon={Share2} hint="Envoyer le lien de l'application à vos amis" onClick={() => { close(); openShare({ title: 'Rejoignez-moi sur Cèlè One, la plateforme des célestes', url: '/' }); }}>Partager l'application</MenuItem>
                    <MenuItem icon={LifeBuoy} hint="Obtenir de l'aide et signaler un problème" onClick={() => { close(); setSupport(true); }}>Contacter le support</MenuItem>
                  </div>
                )}
              </Popover>
              <IconButton icon={Search} label="Rechercher un paramètre" shape="square" active={searching} onClick={() => { setSearching((v) => !v); setQuery(''); }} />
              <IconButton icon={ChevronUp} label={collapsed ? 'Déplier' : 'Replier'} shape="square" className={cn('transition-transform', collapsed && 'rotate-180')} onClick={() => setCollapsed((c) => !c)} />
            </div>
            {searching && (
              <label className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-surface-sunken px-3">
                <Search size={16} className="text-ink-muted" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un paramètre…" className="flex-1 bg-transparent text-sm outline-none" />
                {query && <button aria-label="Effacer" onClick={() => setQuery('')}><X size={15} /></button>}
              </label>
            )}
            {!collapsed && (
              <>
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface-sunken/60 p-3">
                  <button onClick={() => open('profil')} className="relative shrink-0" aria-label="Modifier le profil">
                    <Avatar name={accountName(account)} hue={account.hue} src={account.avatar} size="lg" />
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-white ring-2 ring-surface"><Pencil size={13} strokeWidth={2.4} /></span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-black text-brand-900">{accountName(account)}</p>
                    <p className="truncate text-sm text-ink-muted">{email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button onClick={() => open('abonnement')} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold"><Lock size={12} /> {planLabel[plan]}</button>
                      <button onClick={() => open('abonnement')} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold"><CreditCard size={12} /> Gérer l'abonnement</button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
                  {[['donnees', 'Données & stockage', Database], ['audio-video', 'Audio & vidéo', Mic], ['securite', 'Sécurité', ShieldCheck], ['apparence', 'Apparence', SunMoon]].map(([id, label, Icon]) => {
                    const I = Icon as typeof Mic;
                    return <button key={id as string} onClick={() => open(id as string)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface-sunken px-4 text-sm font-semibold hover:bg-line"><I size={16} /> {label as string}</button>;
                  })}
                </div>
              </>
            )}
          </div>

          {filtered.length === 0 && <p className="py-6 text-center text-sm text-ink-muted">Aucun paramètre ne correspond à « {query} ».</p>}
          {filtered.map((g, i) => (
            <div key={i} className="card divide-y divide-line overflow-hidden rounded-3xl md:divide-y-0 md:p-1.5">{g.map(entryRow)}</div>
          ))}
          {!q && (
            <div className="card overflow-hidden rounded-3xl md:p-1.5">
              <button onClick={logout} className="flex w-full items-center gap-3 px-3 py-3.5 text-left text-danger-700 transition hover:bg-danger-50 md:rounded-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-50"><LogOut size={19} /></span>
                <span className="flex-1 text-[15.5px] font-semibold">Se déconnecter</span>
                <ChevronRight size={18} className="text-ink-faint" />
              </button>
            </div>
          )}
        </div>

        {/* Contenu de la section */}
        <div className={cn('min-w-0', !active && 'hidden md:block')}>
          {active && (
            <button onClick={() => navigate('/profil')} className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3.5 py-2 text-sm font-semibold hover:bg-line md:hidden">
              <ChevronLeft size={16} /> Profil
            </button>
          )}
          {shown === 'profil' ? <UpdateProfileSection key={account.id} /> : <section className="card rounded-3xl p-5"><SectionContent id={shown} /></section>}
        </div>
      </div>
      <SupportModal open={support} onClose={() => setSupport(false)} />
    </div>
  );
}

/** Les paramètres font partie du hub « Profil ». */
export const SettingsPage = ProfilePage;
