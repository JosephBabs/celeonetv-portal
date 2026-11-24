import { hoursAgo } from '@/lib/utils';
import type { SceneVariant } from './types';

export interface Channel {
  id: string;
  name: string;
  description: string;
  subscribers: number;
  live: boolean;
  /** Le direct est déclaré mais le flux est indisponible (illustre l'état d'erreur). */
  offline?: boolean;
  scene: SceneVariant;
}

export type MediaKind = 'video' | 'podcast' | 'film' | 'clip';

export interface Video {
  id: string;
  channelId: string;
  title: string;
  kind: MediaKind;
  category: string;
  scene: SceneVariant;
  views: number;
  durationSec: number;
  live?: boolean;
  publishedAt: string;
  description: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  scene: SceneVariant;
  tracks: { id: string; title: string; durationSec: number }[];
}

export const channels: Channel[] = [
  { id: 'c1', name: 'Cèlè One', description: 'Chaîne officielle de Cèlè One International', subscribers: 2, live: true, scene: 'choir' },
  { id: 'c1-international', name: 'Cèlè One International', description: 'Cultes et événements internationaux', subscribers: 19, live: true, offline: true, scene: 'candles' },
  { id: 'chorales', name: 'Chorales célestes', description: 'Concerts, répétitions et louanges des chorales', subscribers: 412, live: false, scene: 'drums' },
  { id: 'jeunesse-tv', name: 'Jeunesse TV', description: 'Émissions et quiz pour les jeunes', subscribers: 128, live: false, scene: 'youth' },
];

export const videos: Video[] = [
  { id: 'c1-live', channelId: 'c1', title: 'C1 Live', kind: 'video', category: 'Cultes', scene: 'choir', views: 75, durationSec: 5400, live: true, publishedAt: hoursAgo(1), description: 'Retransmission en direct du culte et des annonces de la semaine.' },
  { id: 'intl-live', channelId: 'c1-international', title: 'Culte international en direct', kind: 'video', category: 'Cultes', scene: 'candles', views: 1240, durationSec: 7200, live: true, publishedAt: hoursAgo(0.5), description: 'Culte retransmis depuis le siège international.' },
  { id: 'v-moisson', channelId: 'c1', title: 'Fête des moissons 2026 — temps forts', kind: 'video', category: 'Événements', scene: 'sunrise', views: 3120, durationSec: 1260, publishedAt: hoursAgo(30), description: 'Les moments marquants de la fête des moissons.' },
  { id: 'v-chorale', channelId: 'chorales', title: 'Concert de la chorale Saint-Gabriel', kind: 'clip', category: 'Louange', scene: 'drums', views: 8400, durationSec: 2400, publishedAt: hoursAgo(80), description: 'Concert annuel enregistré à Porto-Novo.' },
  { id: 'v-hope', channelId: 'chorales', title: 'Hope — Femi Elcoutino', kind: 'clip', category: 'Louange', scene: 'sunrise', views: 15200, durationSec: 312, publishedAt: hoursAgo(200), description: 'Clip officiel.' },
  { id: 'v-quiz', channelId: 'jeunesse-tv', title: 'Le grand quiz biblique — épisode 4', kind: 'video', category: 'Jeunesse', scene: 'youth', views: 640, durationSec: 1500, publishedAt: hoursAgo(50), description: 'Les jeunes s’affrontent sur leurs connaissances bibliques.' },
  { id: 'p-meditation', channelId: 'c1', title: 'Méditation du matin — Origine et Source', kind: 'podcast', category: 'Enseignement', scene: 'prayer', views: 910, durationSec: 900, publishedAt: hoursAgo(10), description: 'Podcast quotidien de méditation.' },
  { id: 'p-histoire', channelId: 'c1-international', title: 'Histoire de l’Église — épisode 1', kind: 'podcast', category: 'Enseignement', scene: 'beach', views: 2200, durationSec: 1800, publishedAt: hoursAgo(120), description: 'Retour sur les origines de l’Église.' },
  { id: 'f-temoins', channelId: 'c1', title: 'Les témoins de la lumière (film)', kind: 'film', category: 'Films', scene: 'candles', views: 5400, durationSec: 5700, publishedAt: hoursAgo(400), description: 'Long métrage inspiré de témoignages de fidèles.' },
  { id: 'v-veillee', channelId: 'jeunesse-tv', title: 'Veillée de prière des jeunes', kind: 'video', category: 'Jeunesse', scene: 'candles', views: 1830, durationSec: 3600, publishedAt: hoursAgo(160), description: 'Veillée enregistrée à Cotonou.' },
  { id: 'v-tambours', channelId: 'chorales', title: 'Les tambours de la fête', kind: 'clip', category: 'Louange', scene: 'drums', views: 4100, durationSec: 420, publishedAt: hoursAgo(260), description: 'Ensemble de percussions.' },
];

export const streamCategories = ['Tout', 'Cultes', 'Louange', 'Enseignement', 'Jeunesse', 'Films', 'Événements'];

export const albums: Album[] = [
  { id: 'a1', title: 'Louanges du matin', artist: 'Chorale Saint-Gabriel', scene: 'sunrise', tracks: Array.from({ length: 6 }, (_, i) => ({ id: `a1-${i}`, title: `Louange ${i + 1}`, durationSec: 180 + i * 23 })) },
  { id: 'a2', title: 'Hope', artist: 'Femi Elcoutino', scene: 'choir', tracks: Array.from({ length: 5 }, (_, i) => ({ id: `a2-${i}`, title: ['Hope', 'Lumière', 'Grâce', 'Victoire', 'Paix'][i], durationSec: 200 + i * 17 })) },
  { id: 'a3', title: 'Rythmes célestes', artist: 'Ensemble de tambours', scene: 'drums', tracks: Array.from({ length: 4 }, (_, i) => ({ id: `a3-${i}`, title: `Rythme ${i + 1}`, durationSec: 240 + i * 30 })) },
  { id: 'a4', title: 'Veillée', artist: 'Chorale juniors', scene: 'candles', tracks: Array.from({ length: 7 }, (_, i) => ({ id: `a4-${i}`, title: `Chant de veillée ${i + 1}`, durationSec: 190 + i * 11 })) },
];

export const radioStations = [
  { id: 'alleluia', name: 'Alléluia FM', frequency: '96,5 MHz', city: 'Cotonou', online: true, program: 'Louange du matin' },
  { id: 'celeone-radio', name: 'Cèlè One Radio', frequency: '101,2 MHz', city: 'Porto-Novo', online: true, program: 'Enseignement biblique' },
  { id: 'sion', name: 'Radio Sion', frequency: '89,9 MHz', city: 'Lokossa', online: false, program: 'Hors antenne' },
];

export const getVideo = (id: string) => videos.find((v) => v.id === id);
export const getChannel = (id: string) => channels.find((c) => c.id === id);
export const fmtDuration = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
