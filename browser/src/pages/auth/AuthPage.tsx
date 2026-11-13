import { useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, ChevronRight, Eye, EyeOff, Globe, Heart, KeyRound, Music2, Play, Settings, X } from 'lucide-react';
import { accountName, actions, useApp, type Account } from '@/store/app';
import { toast, withLoader } from '@/store/ui';
import { ApiError } from '@/lib/api';
import { authService } from '@/services/auth';

/** « api » : vraie API CélèOne ; « demo » : données de démonstration uniquement. */
const API_MODE = (import.meta.env.VITE_DATA_MODE ?? 'api') !== 'demo';
import { Logo, LogoMark } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { cn, sleep } from '@/lib/utils';

const parishes = [
  'Paroisse Alpha Oméga, Lokossa', 'Paroisse Jéricho, Cotonou', 'Paroisse Sion, Porto-Novo', 'Paroisse Béthel, Abomey-Calavi',
  'Paroisse Emmanuel, Ouidah', 'Paroisse Canaan, Bohicon', 'Paroisse Galilée, Parakou', 'Paroisse Shiloh, Cotonou', 'Paroisse Horeb, Lomé', 'Paroisse Nazareth, Lagos',
];

const languages = ['Français', 'English', 'Yoruba', 'Goun', 'Fon'];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isPhone = (v: string) => /^\+?[\d\s.-]{8,18}$/.test(v.trim()) && v.replace(/\D/g, '').length >= 8;

function validateIdentifier(v: string) {
  if (!v.trim()) return 'Saisissez votre email ou votre numéro de téléphone.';
  if (!isEmail(v) && !isPhone(v)) return 'Format invalide : utilisez un email ou un numéro (ex. +229 01 97 00 00 00).';
  return '';
}
function validatePassword(v: string) {
  if (!v) return 'Saisissez votre mot de passe.';
  if (v.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  return '';
}

function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-[12.5px] font-medium text-danger-700" role="alert">{error}</span> : hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

function PasswordInput({ value, onChange, error, placeholder = '••••••••', autoComplete, autoFocus }: { value: string; onChange: (v: string) => void; error?: string; placeholder?: string; autoComplete?: string; autoFocus?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus} className={cn('field pr-11', error && 'field-error')} aria-invalid={!!error} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken">
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

/* ───────────── Panneau promotionnel (gauche) ───────────── */

function PromoPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#063c36,#0B565A_45%,#1D8A8F)] lg:flex lg:w-[54%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-[360px] w-[360px] rounded-full border-[40px] border-white/[0.05]" />
      <Logo light to="/connexion" />

      <div className="relative mx-auto my-10 h-[360px] w-full max-w-[520px]">
        {/* Carte Cantiques */}
        <div className="absolute left-0 top-6 w-[220px] animate-float rounded-3xl bg-white p-4 shadow-lg [animation-delay:-2s]">
          <div className="mb-3 flex items-center gap-2">
            <span className="icon-tile h-8 w-8 rounded-lg"><Music2 size={16} /></span>
            <span className="text-sm font-extrabold">Cantiques</span>
            <span className="ml-auto rounded-full bg-lavender-50 px-2 py-0.5 text-[10px] font-bold text-lavender">Goun</span>
          </div>
          {['Jelimoyamah', 'Mawu ma yi', 'Oluwa ni', 'Halleluya'].map((t, i) => (
            <div key={t} className="flex items-center gap-2 border-t border-line/70 py-1.5 text-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mint-100 font-bold text-brand-700">{i + 1}</span>
              <span className="font-medium">{t}</span>
            </div>
          ))}
        </div>
        {/* Carte Live TV */}
        <div className="absolute right-0 top-0 w-[250px] animate-float overflow-hidden rounded-3xl bg-night shadow-lg">
          <div className="relative flex aspect-video items-center justify-center bg-[linear-gradient(135deg,#1D8A8F,#063c36)]">
            <LogoMark className="h-14 w-14 opacity-90" />
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-black text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> EN DIRECT
            </span>
            <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-night"><Play size={16} className="ml-0.5 fill-night" /></span>
          </div>
          <div className="p-3 text-white">
            <p className="text-sm font-bold">Culte d'action de grâce</p>
            <p className="text-[11px] text-white/60">Cèlè One TV · 1,2 k spectateurs</p>
          </div>
        </div>
        {/* Carte Bible */}
        <div className="absolute bottom-0 left-[28%] w-[260px] animate-float rounded-3xl bg-white p-4 shadow-lg [animation-delay:-4s]">
          <div className="mb-2 flex items-center gap-2">
            <span className="icon-tile h-8 w-8 rounded-lg"><BookOpen size={16} /></span>
            <span className="text-sm font-extrabold">Bible · Psaume 23</span>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            <sup className="mr-1 font-bold text-brand-600">1</sup>L'Éternel est mon berger : je ne manquerai de rien.
          </p>
        </div>
        <span className="absolute bottom-[18%] right-[4%] flex h-14 w-14 animate-float items-center justify-center rounded-full bg-danger text-white shadow-lg [animation-delay:-3s]">
          <Heart size={26} className="fill-white" />
        </span>
        <span className="absolute bottom-[6%] left-[2%] rounded-full bg-gold-500 px-3 py-1.5 text-xs font-black text-night shadow-md">🙏 Amen · 214</span>
      </div>

      <div className="relative">
        <h1 className="font-display text-[44px] font-black leading-[1.05] text-white xl:text-[56px]">
          Restez connecté
          <br />à votre famille
          <br />
          <span className="relative inline-block text-mint-300">
            en Christ.
            <span className="rainbow-bar absolute -bottom-1 left-0 h-1.5 w-full rounded-full" />
          </span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] text-white/75">Cantiques, Bible, cultes en direct, discussions et vie de votre paroisse — réunis sur une seule plateforme.</p>
      </div>
    </section>
  );
}

/* ───────────── Modales annexes ───────────── */

function LanguageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const language = useApp((s) => s.language);
  return (
    <Modal open={open} onClose={onClose} title="Langue et région" description="Choisissez la langue de l'interface." size="sm">
      <div className="space-y-1.5">
        {languages.map((l) => {
          const id = l.toLowerCase();
          const active = language === id || (id === 'français' && language === 'fr');
          return (
            <button
              key={l}
              onClick={() => {
                actions.setLanguage(id === 'français' ? 'fr' : id);
                if (id !== 'français') toast(`${l} : traduction bientôt disponible, l'interface reste en français pour l'instant`);
                onClose();
              }}
              className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition', active ? 'bg-mint-100 text-brand-900' : 'hover:bg-surface-sunken')}
            >
              {l}
              {active && <Check size={17} className="text-brand-700" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function ForgotPasswordModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState(initial);
  const [code, setCode] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  const reset = () => {
    setStep(1);
    setCode('');
    setPwd('');
    setPwd2('');
    setError('');
    onClose();
  };

  const next = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (step === 1) {
      const err = validateIdentifier(identifier);
      if (err) return setError(err);
      if (API_MODE && !isEmail(identifier)) return setError('Saisissez l’adresse e-mail de votre compte : le code y sera envoyé.');
    }
    if (step === 2 && !/^\d{6}$/.test(code)) return setError(API_MODE ? 'Le code contient 6 chiffres.' : 'Le code contient 6 chiffres (essayez 123456 pour la démo).');
    if (step === 3) {
      const err = validatePassword(pwd);
      if (err) return setError(err);
      if (pwd !== pwd2) return setError('Les deux mots de passe ne correspondent pas.');
    }
    setLoading(true);
    try {
      if (API_MODE) {
        if (step === 1) await authService.resetRequest(identifier);
        if (step === 2) setVerificationToken((await authService.resetVerify(identifier, code)).verification_token);
        if (step === 3) await authService.resetComplete(identifier, verificationToken, pwd);
      } else {
        await sleep(700);
      }
    } catch (err) {
      setLoading(false);
      return setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    }
    setLoading(false);
    if (step < 3) setStep((s) => (s + 1) as 2 | 3);
    else {
      toast('Mot de passe mis à jour, vous pouvez vous connecter');
      reset();
    }
  };

  const titles = { 1: 'Mot de passe oublié', 2: 'Vérifiez votre identité', 3: 'Nouveau mot de passe' };
  const descs = {
    1: 'Indiquez votre email ou votre numéro : nous vous enverrons un code.',
    2: `Saisissez le code à 6 chiffres envoyé à ${identifier}.`,
    3: 'Choisissez un nouveau mot de passe d’au moins 8 caractères.',
  };

  return (
    <Modal open={open} onClose={reset} title={titles[step]} description={descs[step]} size="sm">
      <div className="mb-4 flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <span key={s} className={cn('h-1.5 flex-1 rounded-full', s <= step ? 'bg-brand-600' : 'bg-line')} />
        ))}
      </div>
      <form onSubmit={next} className="space-y-4" noValidate>
        {step === 1 && (
          <Field label={API_MODE ? 'Adresse e-mail' : 'Email ou numéro de téléphone'} error={error}>
            <input autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={cn('field', error && 'field-error')} placeholder="nom@exemple.com" />
          </Field>
        )}
        {step === 2 && (
          <Field label="Code de vérification" error={error} hint={API_MODE ? 'Le code expire après 10 minutes. Pensez à vérifier vos courriers indésirables.' : "Pour la démo, n'importe quel code à 6 chiffres fonctionne."}>
            <input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={cn('field text-center text-xl font-bold tracking-[0.5em]', error && 'field-error')} placeholder="······" />
          </Field>
        )}
        {step === 3 && (
          <>
            <Field label="Nouveau mot de passe">
              <PasswordInput autoFocus value={pwd} onChange={setPwd} autoComplete="new-password" />
            </Field>
            <Field label="Confirmer le mot de passe" error={error}>
              <PasswordInput value={pwd2} onChange={setPwd2} error={error} autoComplete="new-password" />
            </Field>
          </>
        )}
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as 1 | 2)}>
              Retour
            </Button>
          )}
          <Button type="submit" block loading={loading} loadingText="Envoi…" icon={step === 3 ? KeyRound : undefined}>
            {step === 1 ? 'Envoyer le code' : step === 2 ? 'Vérifier' : 'Enregistrer'}
          </Button>
        </div>
        {step === 2 && (
          <button type="button" onClick={async () => { try { if (API_MODE) await authService.resetRequest(identifier); toast('Un nouveau code a été envoyé'); } catch (err) { setError(err instanceof ApiError ? err.message : 'Envoi impossible.'); } }} className="w-full text-center text-[13px] font-semibold text-brand-700 hover:underline">
            Renvoyer le code
          </button>
        )}
      </form>
    </Modal>
  );
}

/* ───────────── Formulaires ───────────── */

function LoginForm({ prefill, onBack, onSignup, onForgot }: { prefill: Account | null; onBack?: () => void; onSignup: () => void; onForgot: (identifier: string) => void }) {
  const remembered = useApp((s) => s.rememberedAccounts);
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState(prefill?.identifier ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const remote = API_MODE && !(prefill && !prefill.remote);
    const next = {
      identifier: validateIdentifier(identifier) || (remote && !isEmail(identifier) ? 'La connexion se fait avec l’adresse e-mail de votre compte.' : ''),
      password: remote ? (password ? '' : 'Saisissez votre mot de passe.') : validatePassword(password),
    };
    setErrors(next);
    if (next.identifier || next.password) return;
    setLoading(true);
    if (remote) {
      try {
        const account = await authService.login(identifier, password);
        setLoading(false);
        withLoader(`Bienvenue, ${account.firstName}`, 1100, () => {
          actions.login(account);
          navigate((location.state as { from?: string } | null)?.from ?? '/accueil', { replace: true });
          toast(`Heureux de vous revoir, ${account.firstName} !`);
        });
      } catch (err) {
        setLoading(false);
        if (err instanceof ApiError) setErrors({ identifier: err.fields.email, password: err.fields.password ?? (err.fields.email ? undefined : err.message) });
        else setErrors({ password: 'Une erreur est survenue.' });
      }
      return;
    }
    await sleep(900);
    const known = remembered.find((a) => a.identifier.replace(/\s/g, '') === identifier.replace(/\s/g, ''));
    const local = identifier.split('@')[0].replace(/[._-]+/g, ' ').trim();
    const account: Account = known ?? {
      id: 'me',
      firstName: isEmail(identifier) ? local.split(' ')[0].replace(/^./, (c) => c.toUpperCase()) : 'Membre',
      lastName: isEmail(identifier) ? (local.split(' ')[1] ?? '').replace(/^./, (c) => c.toUpperCase()) : 'CélèOne',
      identifier: identifier.trim(),
      parish: '',
      phone: isPhone(identifier) ? identifier.trim() : '',
      hue: 168,
    };
    setLoading(false);
    withLoader(`Bienvenue, ${account.firstName}`, 1300, () => {
      actions.login(account);
      navigate((location.state as { from?: string } | null)?.from ?? '/accueil', { replace: true });
      toast(`Heureux de vous revoir, ${account.firstName} !`);
    });
  };

  return (
    <div className="animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Profils enregistrés
        </button>
      )}
      {prefill ? (
        <div className="mb-6 flex flex-col items-center text-center">
          <Avatar name={accountName(prefill)} hue={prefill.hue} size="xl" ring />
          <h2 className="mt-3 text-2xl font-black">{accountName(prefill)}</h2>
          <p className="text-sm text-ink-muted">{prefill.identifier}</p>
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-[26px] font-black text-ink">Se connecter</h2>
          <p className="mt-1 text-[15px] text-ink-muted">Ravi de vous revoir sur CélèOne.</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!prefill && (
          <Field label={API_MODE ? 'Adresse e-mail' : 'Email ou numéro de téléphone'} error={errors.identifier}>
            <input autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder={API_MODE ? 'nom@exemple.com' : 'nom@exemple.com ou +229…'} className={cn('field h-12', errors.identifier && 'field-error')} aria-invalid={!!errors.identifier} />
          </Field>
        )}
        <Field label="Mot de passe" error={errors.password}>
          <PasswordInput autoFocus={!!prefill} value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
        </Field>
        <Button type="submit" size="lg" block loading={loading} loadingText="Connexion…">
          Se connecter
        </Button>
      </form>
      <button onClick={() => onForgot(identifier)} className="mt-4 block w-full text-center text-sm font-semibold text-brand-700 hover:underline">
        Mot de passe oublié ?
      </button>
      <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" size="lg" block onClick={onSignup}>
        Créer un compte CélèOne
      </Button>
    </div>
  );
}

function SignupForm({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', identifier: '', parish: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {
      firstName: form.firstName.trim() ? '' : 'Le prénom est requis.',
      lastName: form.lastName.trim() ? '' : 'Le nom est requis.',
      identifier: validateIdentifier(form.identifier) || (API_MODE && !isEmail(form.identifier) ? 'Une adresse e-mail est nécessaire pour créer un compte.' : ''),
      password: validatePassword(form.password),
      confirm: form.confirm && form.confirm === form.password ? '' : 'Les mots de passe ne correspondent pas.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setLoading(true);
    if (API_MODE) {
      try {
        const created = await authService.register({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.identifier, password: form.password });
        const account: Account = { ...created, firstName: form.firstName.trim(), lastName: form.lastName.trim(), parish: form.parish.trim() || created.parish };
        setLoading(false);
        withLoader('Création de votre espace…', 1300, () => {
          actions.login(account);
          navigate('/accueil', { replace: true });
          toast(`Bienvenue sur CélèOne, ${account.firstName} ! Votre compte est créé.`);
        });
      } catch (err) {
        setLoading(false);
        if (err instanceof ApiError) setErrors({ identifier: err.fields.email, password: err.fields.password, firstName: err.fields.name, confirm: err.fields.password_confirmation ?? (Object.keys(err.fields).length ? undefined : err.message) });
        else setErrors({ confirm: 'Une erreur est survenue.' });
      }
      return;
    }
    await sleep(1000);
    const account: Account = {
      id: 'me',
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      identifier: form.identifier.trim(),
      parish: form.parish.trim(),
      phone: isPhone(form.identifier) ? form.identifier.trim() : '',
      hue: Math.floor(Math.random() * 360),
    };
    setLoading(false);
    withLoader('Création de votre espace…', 1500, () => {
      actions.login(account);
      navigate('/accueil', { replace: true });
      toast(`Bienvenue sur CélèOne, ${account.firstName} ! Votre compte est créé.`);
    });
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onLogin} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Retour
      </button>
      <h2 className="text-[26px] font-black text-ink">Créer un compte</h2>
      <p className="mb-6 mt-1 text-[15px] text-ink-muted">Rejoignez la communauté des célestes.</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" error={errors.firstName}>
            <input autoFocus value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} autoComplete="given-name" className={cn('field', errors.firstName && 'field-error')} />
          </Field>
          <Field label="Nom" error={errors.lastName}>
            <input value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} autoComplete="family-name" className={cn('field', errors.lastName && 'field-error')} />
          </Field>
        </div>
        <Field label={API_MODE ? 'Adresse e-mail' : 'Email ou numéro de téléphone'} error={errors.identifier}>
          <input value={form.identifier} onChange={(e) => set('identifier')(e.target.value)} autoComplete="username" placeholder={API_MODE ? 'nom@exemple.com' : 'nom@exemple.com ou +229…'} className={cn('field', errors.identifier && 'field-error')} />
        </Field>
        <Field label="Nom de la paroisse" hint="Facultatif — commencez à taper pour voir les suggestions.">
          <input list="parishes" value={form.parish} onChange={(e) => set('parish')(e.target.value)} placeholder="Ex. Paroisse Sion, Porto-Novo" className="field" />
          <datalist id="parishes">
            {parishes.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Mot de passe" error={errors.password}>
          <PasswordInput value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
        </Field>
        <Field label="Confirmer le mot de passe" error={errors.confirm}>
          <PasswordInput value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" block loading={loading} loadingText="Création du compte…">
          Créer mon compte
        </Button>
      </form>
      <button onClick={onLogin} className="mt-4 block w-full text-center text-sm font-semibold text-brand-700 hover:underline">
        J'ai déjà un compte
      </button>
    </div>
  );
}

function ProfilesList({ onPick, onOther, onSignup }: { onPick: (a: Account) => void; onOther: () => void; onSignup: () => void }) {
  const remembered = useApp((s) => s.rememberedAccounts);
  return (
    <div className="animate-fade-in">
      <p className="mb-5 text-[15px] text-ink-muted">Choisissez un profil pour continuer.</p>
      <div className="space-y-1">
        {remembered.map((a) => (
          <div key={a.id + a.identifier} className="group relative">
            <button onClick={() => onPick(a)} className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition hover:bg-surface-sunken">
              <Avatar name={accountName(a)} hue={a.hue} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 truncate text-[16px] font-bold">{accountName(a)}</span>
                <span className="block truncate text-xs text-ink-muted">{a.identifier}</span>
              </span>
              <ChevronRight size={20} className="text-ink-faint" />
            </button>
            <button
              onClick={() => {
                actions.forgetAccount(a.id);
                toast('Profil retiré de cet appareil');
              }}
              aria-label={`Retirer ${accountName(a)} de cet appareil`}
              className="absolute left-12 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-muted shadow-sm ring-1 ring-line hover:text-danger group-hover:flex"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <Button variant="ghost" size="lg" block onClick={onOther}>
          Utiliser un autre profil
        </Button>
        <Button variant="secondary" size="lg" block onClick={onSignup}>
          Créer un nouveau compte
        </Button>
      </div>
    </div>
  );
}

export function AuthPage({ mode: initialMode = 'login' }: { mode?: 'login' | 'signup' }) {
  const account = useApp((s) => s.account);
  const remembered = useApp((s) => s.rememberedAccounts);
  const language = useApp((s) => s.language);
  const navigate = useNavigate();
  const [view, setView] = useState<'profiles' | 'login' | 'signup'>(initialMode === 'signup' ? 'signup' : remembered.length ? 'profiles' : 'login');
  const [prefill, setPrefill] = useState<Account | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [forgot, setForgot] = useState<string | null>(null);

  if (account) return <Navigate to="/accueil" replace />;

  const goSignup = () => {
    setView('signup');
    navigate('/inscription', { replace: true });
  };
  const goLogin = () => {
    setPrefill(null);
    setView(remembered.length ? 'profiles' : 'login');
    navigate('/connexion', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <PromoPanel />
      <section className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Logo to="/connexion" />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-[420px]">
            {view === 'profiles' && (
              <div className="mb-2 flex items-center justify-between">
                <h1 className="text-[26px] font-black text-ink">Se connecter à CélèOne</h1>
                <IconButton icon={Settings} label="Langue et région" variant="plain" onClick={() => setLangOpen(true)} />
              </div>
            )}
            {view === 'profiles' && (
              <ProfilesList
                onPick={(a) => {
                  setPrefill(a);
                  setView('login');
                }}
                onOther={() => {
                  setPrefill(null);
                  setView('login');
                }}
                onSignup={goSignup}
              />
            )}
            {view === 'login' && <LoginForm key={prefill?.id ?? 'new'} prefill={prefill} onBack={remembered.length ? goLogin : undefined} onSignup={goSignup} onForgot={(id) => setForgot(id)} />}
            {view === 'signup' && <SignupForm onLogin={goLogin} />}
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line px-6 py-4 text-[13px] text-ink-muted">
          <LogoMark className="h-6 w-6" />
          {languages.map((l) => {
            const id = l.toLowerCase() === 'français' ? 'fr' : l.toLowerCase();
            return (
              <button key={l} onClick={() => (id === 'fr' ? actions.setLanguage('fr') : setLangOpen(true))} className={cn('hover:text-ink hover:underline', language === id && 'font-bold text-brand-700')}>
                {l}
              </button>
            );
          })}
          <button onClick={() => setLangOpen(true)} className="inline-flex items-center gap-1 hover:text-ink hover:underline">
            <Globe size={14} /> Plus de langues…
          </button>
        </footer>
      </section>
      <LanguageModal open={langOpen} onClose={() => setLangOpen(false)} />
      <ForgotPasswordModal key={forgot ?? ''} open={forgot !== null} initial={forgot ?? ''} onClose={() => setForgot(null)} />
    </div>
  );
}
