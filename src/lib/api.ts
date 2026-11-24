/**
 * Client HTTP de l'API CélèOne (Laravel + Sanctum).
 * Toutes les réponses ont la forme { ok, data, meta } ; ce client renvoie directement `data`.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://api.celeonetv.com/api';

const TOKEN_KEY = 'celeone-web-token';

let token: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function getToken() {
  return token;
}

export function setToken(value: string | null) {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* stockage indisponible : le jeton reste en mémoire pour la session */
  }
}

/** Appelée quand l'API répond 401 (session expirée) : branchée par le store. */
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

const fieldLabels: Record<string, string> = {
  email: 'Adresse e-mail',
  password: 'Mot de passe',
  password_confirmation: 'Confirmation du mot de passe',
  name: 'Nom',
  code: 'Code',
};

/** Traductions des messages de validation Laravel les plus courants. */
function translate(message: string) {
  const rules: [RegExp, string][] = [
    [/field is required/i, 'Ce champ est obligatoire.'],
    [/must be a valid email/i, 'Adresse e-mail invalide.'],
    [/has already been taken/i, 'Cette adresse e-mail est déjà utilisée.'],
    [/must be at least (\d+) characters/i, 'Doit contenir au moins $1 caractères.'],
    [/confirmation does not match/i, 'Les mots de passe ne correspondent pas.'],
    [/credentials do not match|invalid credentials|identifiants/i, 'E-mail ou mot de passe incorrect.'],
    [/too many (login )?attempts|too many requests/i, 'Trop de tentatives. Réessayez dans une minute.'],
    [/invalid or expired|code is invalid|expired/i, 'Code invalide ou expiré.'],
  ];
  for (const [re, fr] of rules) {
    const m = message.match(re);
    if (m) return fr.replace('$1', m[1] ?? '');
  }
  return message;
}

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
  signal?: AbortSignal;
  /** Renvoie la réponse complète (ex. pour lire `nextCursor` à côté de `data`). */
  raw?: boolean;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`);
  Object.entries(opts.query ?? {}).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? 'GET', headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined, signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion internet.');
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false && token) onUnauthorized();
    const errors = (payload?.errors ?? {}) as Record<string, string[]>;
    const fields = Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, translate(v[0] ?? '')]));
    const firstField = Object.entries(fields)[0];
    const message =
      res.status === 401 ? (opts.auth === false ? translate(payload?.message ?? 'E-mail ou mot de passe incorrect.') : 'Votre session a expiré. Reconnectez-vous.')
      : res.status === 403 ? 'Vous n’avez pas l’autorisation pour cette action.'
      : res.status === 404 ? 'Élément introuvable.'
      : res.status === 429 ? 'Trop de tentatives. Réessayez dans une minute.'
      : res.status >= 500 ? 'Le serveur rencontre un problème. Réessayez plus tard.'
      : firstField ? `${fieldLabels[firstField[0]] ?? firstField[0]} : ${firstField[1]}`
      : translate(payload?.message ?? 'Une erreur est survenue.');
    throw new ApiError(res.status, message, fields);
  }
  if (opts.raw) return payload as T;
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) => apiRequest<T>(path, { query, signal }),
  getRaw: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) => apiRequest<T>(path, { query, signal, raw: true }),
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => apiRequest<T>(path, { ...opts, method: 'POST', body: body ?? {} }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body: body ?? {} }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
