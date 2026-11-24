import { hoursAgo } from '@/lib/utils';
import type { AppNotification, NotificationCategory } from './types';

export const notificationCategories: { id: NotificationCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'messages', label: 'Messages' },
  { id: 'social', label: 'Social' },
  { id: 'publications', label: 'Publications' },
  { id: 'evenements', label: 'Événements' },
  { id: 'systeme', label: 'Système' },
];

export function seedNotifications(): AppNotification[] {
  return [
    { id: 'n1', category: 'messages', title: 'Grâce Houénou', body: '4 nouveaux messages · « Et ta matinée ? »', createdAt: hoursAgo(0.3), read: false, action: { label: 'Ouvrir la discussion', to: '/discussions/grace' } },
    { id: 'n2', category: 'social', title: "Nouvelle demande d'ami", body: 'Fiacre Tchibozo vous a envoyé une demande d’ami.', createdAt: hoursAgo(2), read: false, action: { label: 'Voir les demandes', to: '/social/amis' } },
    { id: 'n3', category: 'publications', title: 'Nouveau commentaire', body: 'Rachel Dossou a commenté votre publication « Témoignage du dimanche ».', createdAt: hoursAgo(5), read: false, action: { label: 'Voir la publication', to: '/social' } },
    { id: 'n4', category: 'evenements', title: 'Rappel : culte d’action de grâce', body: 'Demain à 10 h — Paroisse Alpha Oméga, Lokossa.', createdAt: hoursAgo(9), read: false, action: { label: "Ouvrir l'agenda", to: '/agenda' } },
    { id: 'n5', category: 'social', title: 'Demande acceptée', body: 'Joël Akpovi a accepté votre demande d’ami.', createdAt: hoursAgo(26), read: true, action: { label: 'Voir le profil', to: '/social/profil/joel' } },
    { id: 'n6', category: 'publications', title: 'Votre publication plaît', body: '24 personnes ont aimé « Chorale du dimanche ».', createdAt: hoursAgo(30), read: true, action: { label: 'Voir la publication', to: '/social' } },
    { id: 'n7', category: 'messages', title: 'Groupe Chorale juniors', body: 'Ruth Sossa : « Répétition samedi à 16 h »', createdAt: hoursAgo(40), read: true, action: { label: 'Ouvrir la discussion', to: '/discussions/chorale' } },
    { id: 'n8', category: 'systeme', title: 'Nouveautés Cèlè One', body: '120 nouveaux cantiques en goun sont disponibles.', createdAt: hoursAgo(72), read: true, action: { label: 'Voir les cantiques', to: '/cantiques' } },
    { id: 'n9', category: 'evenements', title: 'Thème de la semaine', body: '« Origine et Source » — lectures et méditations disponibles.', createdAt: hoursAgo(96), read: true, action: { label: 'Lire le thème', to: '/accueil' } },
    { id: 'n10', category: 'social', title: "Nouvelle demande d'ami", body: 'Mireille Zannou vous a envoyé une demande d’ami.', createdAt: hoursAgo(170), read: true, action: { label: 'Voir les demandes', to: '/social/amis' } },
  ];
}
