import { api, setToken } from '@/lib/api';
import type { Account } from '@/store/app';

/** Utilisateur tel que renvoyé par l'API (champs documentés + champs optionnels de user_data). */
export interface ApiUser {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  role?: string;
  firebase_uid?: string | null;
}

interface AuthResponse {
  user: ApiUser | null;
  access_token: string;
  token?: string;
  token_type?: 'Bearer';
  password_migrated?: boolean;
}

const DEVICE_NAME = 'CeleOne Web';

function hueFrom(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const isGenericName = (n: string) => !n || /^(cele\s*one|célè\s*one|cèlè\s*one)?\s*(user|utilisateur|membre|member)\s*\d*$/i.test(n);

/** « isaac.togbe29@… » → « Isaac Togbe » (dernier recours si aucun nom n'est renseigné). */
function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  return local.replace(/\d+/g, ' ').split(/[._\-\s]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/** Convertit l'utilisateur de l'API (+ données de profil éventuelles) en compte de l'application web. */
export function toAccount(user: ApiUser, userData?: Record<string, unknown> | null): Account {
  const d = userData ?? {};
  // Le nom de l'API vaut parfois une valeur générique (« CeleOne User ») : on préfère alors les données de profil.
  const real = (v: unknown) => (isGenericName(str(v)) ? '' : str(v));
  const dFirst = real(d.firstName ?? d.first_name ?? d.prenom ?? d.firstname);
  const dLast = real(d.lastName ?? d.last_name ?? d.nom ?? d.lastname);
  const full =
    [dFirst, dLast].filter(Boolean).join(' ') ||
    real(d.displayName ?? d.display_name ?? d.fullName ?? d.full_name ?? d.name ?? d.username) ||
    real(user.name) ||
    nameFromEmail(str(user.email) || str(d.email));
  const parts = full.split(/\s+/).filter(Boolean);
  const firstName = dFirst || parts[0] || 'Membre';
  const lastName = dLast || (dFirst ? '' : parts.slice(1).join(' '));
  const email = str(user.email) || str(d.email);
  const phone = str(user.phone_number) || str(d.phone ?? d.phoneNumber ?? d.phone_number ?? d.telephone);
  return {
    id: String(user.id),
    firstName,
    lastName,
    identifier: email || phone,
    email,
    phone,
    parish: str(d.parish ?? d.parishName ?? d.parish_name ?? d.paroisse),
    hue: hueFrom(String(user.id)),
    avatar: str(user.avatar_url) || str(d.photoUrl ?? d.photoURL ?? d.avatar) || undefined,
    hidePhone: typeof d.hidePhone === 'boolean' ? d.hidePhone : undefined,
    hideEmail: typeof d.hideEmail === 'boolean' ? d.hideEmail : undefined,
    uid: str(user.firebase_uid) || undefined,
    remote: true,
  };
}

function accept(res: AuthResponse) {
  setToken(res.access_token ?? res.token ?? null);
  return res;
}

export const authService = {
  async login(email: string, password: string) {
    const res = accept(await api.post<AuthResponse>('/v1/auth/login', { email: email.trim(), password, device_name: DEVICE_NAME }, { auth: false }));
    return authService.me(res.user);
  },
  async register(input: { firstName: string; lastName: string; email: string; password: string }) {
    const res = accept(
      await api.post<AuthResponse>('/v1/auth/register', {
        name: `${input.firstName} ${input.lastName}`.trim(),
        email: input.email.trim(),
        password: input.password,
        password_confirmation: input.password,
      }, { auth: false }),
    );
    return authService.me(res.user);
  },
  /** Profil complet de la session courante ; `fallback` sert si /auth/me échoue juste après la connexion. */
  async me(fallback?: ApiUser | null): Promise<Account> {
    try {
      const res = await api.get<{ user: ApiUser; user_data: Record<string, unknown> | null }>('/v1/auth/me');
      return toAccount(res.user, res.user_data);
    } catch (e) {
      if (fallback) return toAccount(fallback);
      throw e;
    }
  },
  async logout() {
    try {
      await api.post('/v1/auth/logout');
    } catch {
      /* déconnexion locale même si le serveur ne répond pas */
    }
    setToken(null);
  },
  resetRequest: (email: string) => api.post<{ sent: boolean; expires_in: number }>('/v1/auth/password-reset/request', { email: email.trim() }, { auth: false }),
  resetVerify: (email: string, code: string) => api.post<{ verification_token: string }>('/v1/auth/password-reset/verify', { email: email.trim(), code }, { auth: false }),
  async resetComplete(email: string, verificationToken: string, password: string) {
    return api.post<AuthResponse>('/v1/auth/password-reset/complete', { email: email.trim(), verification_token: verificationToken, password, password_confirmation: password }, { auth: false });
  },
  updatePrivacy: (patch: { hidePhone?: boolean; hideEmail?: boolean }) => api.patch('/v1/me/profile/privacy', patch),
  getPrivacy: () => api.get<{ hidePhone?: boolean; hideEmail?: boolean }>('/v1/me/profile/privacy'),
};
