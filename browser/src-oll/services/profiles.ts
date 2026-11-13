import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { absolute } from './streaming';

/**
 * Fiche publique d'un membre : GET /v1/resources/users/{uid}?__kind=doc et user_data/{uid}.
 * Les listes (amis, demandes…) ne donnent souvent qu'un nom générique (« CeleOne user ») : on complète ici.
 * Résultats gardés en mémoire ; quelques requêtes à la fois seulement.
 */

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};
const num = (...vals: unknown[]) => {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
    if (Array.isArray(v)) return v.length;
  }
  return undefined;
};
/** Lien d'image : complet, ou chemin du serveur complété (« uploads/… »). */
const img = (...vals: unknown[]) => vals.map((v) => absolute(isObj(v) ? str(v.url, v.src, v.downloadURL) : str(v))).find(Boolean) || undefined;

export const isGenericName = (n?: string) => !n || /^(cele\s*one|célè\s*one|cèlè\s*one)?\s*(user|utilisateur|membre|member)(\s*c[ée]l[èe]\s*one)?\s*\d*$/i.test(n.trim());

export interface PublicProfile {
  name?: string;
  avatar?: string;
  cover?: string;
  bio?: string;
  place?: string;
  parish?: string;
  followers?: number;
  following?: number;
  posts?: number;
  creator?: boolean;
  /** Identifiants des abonnés, quand la fiche les contient (pour savoir si on suit déjà ce membre). */
  followerIds?: string[];
}

function read(doc: unknown): PublicProfile {
  // Réponse { id, data: {...} } ou directement les champs ; profil parfois imbriqué (profile / socialProfile).
  const d = isObj(doc) && isObj(doc.data) ? doc.data : isObj(doc) ? doc : {};
  const p: Raw = { ...(isObj(d.socialProfile) ? d.socialProfile : {}), ...(isObj(d.profile) ? d.profile : {}), ...d };
  const full = [str(p.firstName, p.first_name, p.prenom), str(p.lastName, p.last_name, p.nom)].filter(Boolean).join(' ');
  const name = [p.displayName, p.display_name, p.fullName, p.full_name, full, p.name, p.username, p.pseudo].map((n) => str(n)).find((n) => n && !isGenericName(n));
  const stats = isObj(p.stats) ? p.stats : isObj(p.counts) ? p.counts : {};
  const followers = Array.isArray(p.followers) ? p.followers.map(String) : undefined;
  const parishObj = isObj(p.parish) ? p.parish : {};
  return {
    name,
    avatar: img(
      p.photoURL, p.photoUrl, p.profileImage, p.profile_image, p.profileImageUrl, p.profilePhoto, p.profilePhotoUrl, p.profilePicture, p.profilePic,
      p.avatar, p.avatarUrl, p.avatar_url, p.avatarURL, p.userProfileImage, p.photo, p.picture, p.image, p.imageUrl,
    ),
    cover: img(p.coverURL, p.coverUrl, p.coverPhoto, p.coverPhotoUrl, p.coverImage, p.cover_image, p.cover, p.banner, p.bannerUrl, p.backgroundImage),
    bio: str(p.bio, p.about, p.description, p.presentation, p.status) || undefined,
    place: [str(p.city, p.ville, p.location), str(p.country, p.pays)].filter(Boolean).join(', ') || undefined,
    parish: str(p.parishName, p.parish_name, parishObj.name, typeof p.parish === 'string' ? p.parish : '', p.paroisse) || undefined,
    followers: num(p.followersCount, p.followers_count, p.followerCount, stats.followers, p.followers),
    following: num(p.followingCount, p.following_count, stats.following, p.following),
    posts: num(p.postsCount, p.posts_count, p.postCount, stats.posts),
    creator: p.isCreator === true || p.creator === true || /creator|createur|créateur|artist/i.test(str(p.accountType, p.account_type, p.role, p.profileType)),
    followerIds: followers,
  };
}

const merge = (a: PublicProfile, b: PublicProfile): PublicProfile => {
  const out: PublicProfile = { ...b };
  for (const [k, v] of Object.entries(a)) if (v !== undefined && v !== '') (out as Record<string, unknown>)[k] = v;
  return out;
};

const cache = new Map<string, Promise<PublicProfile>>();
const fullCache = new Map<string, Promise<PublicProfile>>();
const known = new Map<string, PublicProfile>();

/** Fiche déjà lue (synchrone) : évite de réafficher un nom générique lors d'un rafraîchissement. */
export const knownProfile = (uid: string) => known.get(uid);

async function fetchDoc(collection: string, uid: string) {
  try {
    return read(await api.get<unknown>(`/v1/resources/${collection}/${encodeURIComponent(uid)}`, { __kind: 'doc' }));
  } catch {
    return {};
  }
}

/** Nom et photo (s'arrête à `users` quand ils y sont). */
export function getPublicProfile(uid: string): Promise<PublicProfile> {
  let p = cache.get(uid);
  if (!p) {
    p = (async () => {
      const user = await fetchDoc('users', uid);
      if (user.name && user.avatar) return user;
      return merge(user, await fetchDoc('user_data', uid));
    })().then((prof) => {
      known.set(uid, { ...known.get(uid), ...prof });
      return prof;
    });
    cache.set(uid, p);
  }
  return p;
}

/** Fiche complète pour la page de profil (users + user_data). */
export function getFullProfile(uid: string): Promise<PublicProfile> {
  let p = fullCache.get(uid);
  if (!p) {
    p = Promise.all([fetchDoc('users', uid), fetchDoc('user_data', uid)]).then(([u, d]) => {
      const prof = merge(u, d);
      known.set(uid, prof);
      return prof;
    });
    fullCache.set(uid, p);
  }
  return p;
}

export function useFullProfile(uid: string) {
  const [profile, setProfile] = useState<PublicProfile | undefined>(() => known.get(uid));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setProfile(known.get(uid));
    getFullProfile(uid).then((p) => {
      if (!alive) return;
      setProfile(p);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [uid]);
  return { profile, loading };
}

/** Complète une liste d'identifiants (4 requêtes à la fois) et rappelle `onProfile` à chaque fiche trouvée. */
export async function resolveProfiles(uids: string[], onProfile: (uid: string, profile: PublicProfile) => void) {
  const queue = [...new Set(uids.filter(Boolean))];
  const worker = async () => {
    for (let uid = queue.shift(); uid; uid = queue.shift()) {
      const profile = await getPublicProfile(uid);
      if (profile.name || profile.avatar) onProfile(uid, profile);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}
