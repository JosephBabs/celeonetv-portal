import type { LucideIcon } from 'lucide-react';

export type PrimarySection = 'accueil' | 'social' | 'documents' | 'cantiques' | 'jeunesse';

export interface Member {
  id: string;
  name: string;
  parish: string;
  /** Teinte (0-360) du dégradé d'avatar quand il n'y a pas de photo. */
  hue: number;
  official?: boolean;
  verified?: boolean;
  online?: boolean;
  mutualFriends?: number;
  /** Profil à visibilité restreinte pour les non-amis. */
  private?: boolean;
  city?: string;
  bio?: string;
}

export type PostKind = 'actualite' | 'annonce' | 'reforme' | 'agenda' | 'communaute';

export type PosterVariant = 'jubilee' | 'artists' | 'program' | 'founder' | 'harvest' | 'youth';

/** Scènes générées en CSS qui tiennent lieu de vidéos de démonstration. */
export type SceneVariant = 'choir' | 'sunrise' | 'drums' | 'prayer' | 'beach' | 'youth' | 'candles' | 'birthday';

export type Audience = 'public' | 'amis';

export interface TextBackground {
  id: string;
  label: string;
  css: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  /** Auteur d'un commentaire venant de l'API (sinon : membre de démonstration). */
  /** uid : identifiant du membre (page de profil). */
  author?: { name: string; avatar?: string; uid?: string };
  pending?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  tag: string;
  title?: string;
  body: string;
  createdAt: string;
  media?: PosterVariant[];
  /** Photos importées par l'utilisateur (data URL compressées). */
  images?: string[];
  scene?: SceneVariant;
  background?: string;
  audience?: Audience;
  pinned?: boolean;
  scheduledFor?: string;
  likes: number;
  shares: number;
  comments: Comment[];
  /** Avatars des personnes ayant réagi (affichés à côté du compteur). */
  reactors?: string[];
  /* ─── Publications venant de l'API CélèOne ─── */
  remote?: boolean;
  /** uid : identifiant du membre auteur (absent pour les pages et l'administration). */
  author?: { name: string; avatar?: string; verified?: boolean; official?: boolean; uid?: string; pageId?: string };
  videos?: string[];
  videoPosters?: string[];
  commentsCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
}

export interface StatusItem {
  id: string;
  text?: string;
  background?: string;
  image?: string;
  scene?: SceneVariant;
  music?: string;
  createdAt: string;
}

export interface Status {
  authorId: string;
  items: StatusItem[];
}

export interface Vibe {
  id: string;
  authorId: string;
  caption: string;
  scene: SceneVariant;
  views: number;
  likes: number;
  shares: number;
  comments: Comment[];
  createdAt: string;
  audience?: Audience;
}

export interface LiveSession {
  id: string;
  authorId: string;
  title: string;
  viewers: number;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  authorId: string;
  text?: string;
  createdAt: string;
  status?: MessageStatus;
  image?: string;
  file?: { name: string; size: string };
  voice?: { seconds: number };
  replyTo?: { authorId: string; text: string };
  reactions?: Record<string, string[]>;
  forwarded?: boolean;
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  title?: string;
  memberIds: string[];
  isGroup?: boolean;
  messages: ChatMessage[];
  unread: number;
  pinned?: boolean;
  archived?: boolean;
  favorite?: boolean;
  muted?: boolean;
  draft?: string;
}

export interface CallLog {
  id: string;
  memberId: string;
  kind: 'audio' | 'video';
  direction: 'entrant' | 'sortant' | 'manque';
  createdAt: string;
  durationSec?: number;
}

export type NotificationCategory = 'messages' | 'social' | 'publications' | 'evenements' | 'systeme';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  action: { label: string; to: string };
  /** Notification venue de l'API (boîte de réception réelle). */
  remote?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  hint?: string;
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}
