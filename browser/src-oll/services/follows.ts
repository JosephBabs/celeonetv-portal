import { api, ApiError } from '@/lib/api';
import { createStore } from '@/lib/createStore';
import { toast } from '@/store/ui';

/**
 * Abonnements (suivre un membre ou une page), partagés entre le fil et les pages de profil.
 * Membres : POST /v1/follows · DELETE /v1/follows/user/{uid}. Pages : PUT / DELETE /v1/pages/{id}/follow.
 * L'API ne donne pas la liste de nos abonnements : l'état est connu par les fiches lues et par nos actions.
 */

export type FollowKind = 'user' | 'page';
const key = (kind: FollowKind, id: string) => `${kind}:${id}`;

export const followStore = createStore<{ following: Record<string, boolean>; busy: Record<string, boolean> }>(() => ({ following: {}, busy: {} }));

/** Renseigne un état connu (fiche de profil, réponse de page) sans écraser une action en cours. */
export function rememberFollow(kind: FollowKind, id: string, following: boolean) {
  const k = key(kind, id);
  if (followStore.get().busy[k]) return;
  followStore.set((s) => ({ following: { ...s.following, [k]: following } }));
}

export const useFollowing = (kind: FollowKind, id: string) => followStore.use((s) => s.following[key(kind, id)] ?? false);
export const useFollowBusy = (kind: FollowKind, id: string) => followStore.use((s) => !!s.busy[key(kind, id)]);

/** Suit / ne suit plus. Renvoie le nouvel état (ou l'ancien en cas d'échec) ; `onCount` reçoit le nombre d'abonnés renvoyé par une page. */
export async function toggleFollow(kind: FollowKind, id: string, name: string, onCount?: (n: number) => void) {
  const k = key(kind, id);
  const was = followStore.get().following[k] ?? false;
  followStore.set((s) => ({ following: { ...s.following, [k]: !was }, busy: { ...s.busy, [k]: true } }));
  try {
    if (kind === 'page') {
      const res = await (was ? api.delete<{ following?: boolean; followersCount?: number }>(`/v1/pages/${encodeURIComponent(id)}/follow`) : api.put<{ following?: boolean; followersCount?: number }>(`/v1/pages/${encodeURIComponent(id)}/follow`));
      if (typeof res?.followersCount === 'number') onCount?.(res.followersCount);
    } else if (was) await api.delete(`/v1/follows/user/${encodeURIComponent(id)}`);
    else await api.post('/v1/follows', { target_type: 'user', target_id: id });
    toast(was ? `Vous ne suivez plus ${name}` : `Vous suivez ${name}`);
    return !was;
  } catch (e) {
    followStore.set((s) => ({ following: { ...s.following, [k]: was } }));
    toast(e instanceof ApiError ? e.message : 'Action impossible pour le moment.', { tone: 'danger' });
    return was;
  } finally {
    followStore.set((s) => ({ busy: { ...s.busy, [k]: false } }));
  }
}
