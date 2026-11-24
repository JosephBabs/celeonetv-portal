import { api, API_URL, getToken } from '@/lib/api';
import { appStore } from '@/store/app';

/**
 * Démarrage d'un direct depuis le web, même enchaînement que startLive() de l'app
 * (Social/social_pro/liveService.ts) :
 *   1. GET  /v1/social/live/config            → { enabled }
 *   2. aperçu caméra/micro                    (navigateur : getUserMedia via livekit-client)
 *   3. POST /v1/social/live/provision         → { sessionId, streamKey, playbackUrl }
 *   4. session social_live_sessions/{id}      (document Firestore de l'app, écrit via /v1/resources)
 *   5. POST /v1/live/sessions                 (fiche du direct côté Laravel)
 *   6. POST {origine}/api/social/live/media/token  (rôle host) → connexion à la salle LiveKit + publication
 *   7. POST {origine}/api/social/live/media/egress/start { sessionId, streamKey }  → salle → RTMP → HLS
 *  Fin : egress/stop, déconnexion de la salle, POST /v1/social/live/stop.
 * Nécessite le paquet npm « livekit-client ».
 */

const ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const LIVE_ERRORS: Record<string, string> = {
  accountTooNew: 'Ce compte ou cette page doit avoir au moins 30 jours avant de passer en direct.',
  notConfigured: 'La configuration du direct est incomplète.',
  liveServicesNotActive: 'Les services de direct ne sont pas actifs. Réessayez plus tard.',
  authRequired: 'Reconnectez-vous avant de lancer un direct.',
  cameraUnavailable: 'Impossible d’ouvrir la caméra ou le micro. Autorisez l’accès dans votre navigateur.',
  startFailed: 'Le direct n’a pas pu démarrer.',
  LIVE_EGRESS_OUTPUT_FAILED: 'Le serveur de direct n’a pas pu se connecter à la diffusion. Réessayez plus tard.',
};

export function liveErrorMessage(e: unknown) {
  const raw = String((e as Error)?.message || e || 'startFailed');
  if (LIVE_ERRORS[raw]) return LIVE_ERRORS[raw];
  if (/30 days|account.*(new|age)|too ?new|AGE/i.test(raw)) return LIVE_ERRORS.accountTooNew;
  if (/LIVE_MEDIA_|LIVE_EGRESS_|NOT_CONFIGURED/.test(raw)) return LIVE_ERRORS.liveServicesNotActive;
  if (/NotAllowed|Permission|NotFound|Device/i.test(raw)) return LIVE_ERRORS.cameraUnavailable;
  return /^[A-Z_]+$/.test(raw) ? LIVE_ERRORS.startFailed : raw;
}

async function mediaApi<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('authRequired');
  const res = await fetch(`${ORIGIN}/api/social/live/media/${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: string; code?: string };
  if (!res.ok || payload.ok === false) {
    const code = String(payload.error || payload.code || `LIVE_MEDIA_API_${res.status}`);
    throw new Error(/NOT_CONFIGURED|CONFIG_MISSING/.test(code) ? 'liveServicesNotActive' : code);
  }
  return (payload.data ?? payload) as T;
}

export interface LiveProvision { sessionId: string; streamKey: string; rtmpUrl?: string; playbackUrl: string }
export interface StartOptions {
  hostType: 'user' | 'page';
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  title: string;
  description?: string;
  topic?: string;
  goal?: { type: 'likes' | 'viewers'; target: number } | null;
  commentsEnabled: boolean;
}

export interface LiveMediaHandle {
  sessionId: string;
  setMic(on: boolean): Promise<void>;
  setCamera(on: boolean): Promise<void>;
  stop(): Promise<void>;
}

/** Écrit le document de session de l'app (social_live_sessions/{id}). Les erreurs sont remontées pour que l'hôte soit prévenu. */
async function writeSession(id: string, data: Record<string, unknown>) {
  const path = `/v1/resources/social_live_sessions/${encodeURIComponent(id)}`;
  try {
    await api.put(path, data);
  } catch {
    await api.patch(path, data);
  }
}

export async function liveConfigEnabled() {
  const c = await api.get<{ enabled?: boolean }>('/v1/social/live/config');
  return !!c?.enabled;
}

export async function startWebLive(opts: StartOptions, tracks: import('livekit-client').LocalTrack[]): Promise<{ handle: LiveMediaHandle; warning?: string }> {
  if (!(await liveConfigEnabled().catch(() => false))) throw new Error('notConfigured');
  const uid = appStore.get().account?.uid;
  if (!uid) throw new Error('authRequired');
  const { Room, Track } = await import('livekit-client');

  let sessionId = '';
  let room: InstanceType<typeof Room> | null = null;
  const abort = async () => {
    if (!sessionId) return;
    await mediaApi('egress/stop', { sessionId }).catch(() => undefined);
    room?.disconnect();
    await api.post('/v1/social/live/stop', { sessionId }).catch(() => undefined);
  };

  try {
    const r = await api.post<LiveProvision>('/v1/social/live/provision', {
      hostType: opts.hostType, hostId: opts.hostId, hostName: opts.hostName, hostAvatar: opts.hostAvatar ?? '', title: opts.title, description: opts.description ?? '',
    });
    sessionId = r.sessionId;
    const startedAtMs = Date.now();
    let warning: string | undefined;
    try {
      await writeSession(sessionId, {
        id: sessionId, sessionId, hostId: opts.hostId, hostType: opts.hostType, hostOwnerId: uid, hostName: opts.hostName, hostAvatar: opts.hostAvatar ?? '',
        title: opts.title, description: opts.description ?? '', playbackUrl: r.playbackUrl, status: 'live', startedAtMs, updatedAtMs: startedAtMs,
        topic: opts.topic ?? '', goal: opts.goal ?? null, orientation: 'landscape', stageLayout: 'float', autoAcceptGuests: false, maxGuests: 0, highlightedGuestId: '',
        commentSettings: { enabled: opts.commentsEnabled, slowModeSec: 0, blockedWords: [] }, aboutMe: '', hostPaused: false,
      });
    } catch {
      warning = 'Le direct est lancé, mais la fiche de session n’a pas pu être enregistrée : commentaires et compteurs peuvent être indisponibles.';
    }
    await api.post('/v1/live/sessions', {
      public_id: sessionId, title: opts.title, body: opts.description ?? '', status: 'live',
      data: { sessionId, playbackUrl: r.playbackUrl, hostId: opts.hostId, hostType: opts.hostType, hostOwnerId: uid, hostName: opts.hostName, hostAvatar: opts.hostAvatar ?? '' },
    });

    const media = await mediaApi<{ url: string; token: string }>('token', { sessionId, role: 'host', name: opts.hostName });
    room = new Room({ adaptiveStream: false, dynacast: false });
    await room.connect(media.url, media.token);
    // Mêmes pistes que l'aperçu : une seule caméra ouverte.
    for (const t of tracks) await room.localParticipant.publishTrack(t, { simulcast: false, name: t.kind === Track.Kind.Video ? 'camera' : 'microphone', source: t.kind === Track.Kind.Video ? Track.Source.Camera : Track.Source.Microphone });
    await mediaApi('egress/start', { sessionId, streamKey: r.streamKey });

    const r2 = room;
    const handle: LiveMediaHandle = {
      sessionId,
      setMic: async (on) => void (await r2.localParticipant.setMicrophoneEnabled(on)),
      setCamera: async (on) => void (await r2.localParticipant.setCameraEnabled(on)),
      stop: async () => {
        await mediaApi('egress/stop', { sessionId }).catch(() => undefined);
        r2.disconnect();
        tracks.forEach((t) => t.stop());
        await api.post('/v1/social/live/stop', { sessionId });
      },
    };
    return { handle, warning };
  } catch (e) {
    await abort();
    throw e;
  }
}
