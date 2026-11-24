import { hoursAgo } from '@/lib/utils';
import type { CallLog, Conversation } from './types';

const m = (id: string, authorId: string, text: string, h: number, extra: object = {}) => ({ id, authorId, text, createdAt: hoursAgo(h), status: 'read' as const, ...extra });

export function seedConversations(): Conversation[] {
  return [
    {
      id: 'grace', memberIds: ['grace'], unread: 4, pinned: true, favorite: true,
      messages: [
        m('g1', 'me', 'Bonjour ma sœur, tu vas bien ?', 26),
        m('g2', 'grace', 'Bonjour Isaac ! Oui, par la grâce de Dieu 🙏', 25.5),
        m('g3', 'me', 'Tu seras au culte d’action de grâce demain ?', 25),
        m('g4', 'grace', 'Oui bien sûr, je viens avec toute la famille', 1.2),
        m('g5', 'grace', 'On se retrouve devant la paroisse à 9 h 30 ?', 1),
        m('g6', 'grace', 'J’apporte les programmes imprimés', 0.6),
        m('g7', 'grace', 'Et ta matinée ?', 0.3),
      ],
    },
    {
      id: 'chorale', title: 'Chorale juniors 🎹🎺', memberIds: ['ruth', 'joel', 'fiacre', 'benedicte'], isGroup: true, unread: 2, pinned: true,
      messages: [
        m('c1', 'ruth', 'Bonsoir à tous ! Répétition samedi à 16 h.', 30),
        m('c2', 'joel', 'Je serai là 👍', 29),
        m('c3', 'me', 'Moi aussi. On travaille quels cantiques ?', 28),
        m('c4', 'ruth', '46 bis, 91 et 173 pour dimanche', 3, { status: 'read' }),
        m('c5', 'fiacre', 'Je ramène le clavier', 2),
      ],
    },
    {
      id: 'encadreurs', title: 'Encadreurs de St Gabriel', memberIds: ['samuel', 'daniel', 'pascal'], isGroup: true, unread: 0,
      messages: [m('e1', 'samuel', 'Réunion des encadreurs reportée à mardi.', 48), m('e2', 'me', 'Bien noté, merci.', 47, { reactions: { '😄': ['samuel'] } })],
    },
    {
      id: 'joel', memberIds: ['joel'], unread: 0,
      messages: [m('j1', 'joel', 'Merci pour ton aide hier !', 70), m('j2', 'me', 'Avec plaisir frère 🙏', 69), m('j3', 'joel', 'Appel vocal', 20, { text: '📞 Appel vocal · 4 min' })],
    },
    {
      id: 'rachel', memberIds: ['rachel'], unread: 0, favorite: true,
      messages: [m('r1', 'me', 'Ton témoignage de dimanche m’a beaucoup touché', 90), m('r2', 'rachel', 'Merci, gloire à Dieu ! Je verrai si je peux passer samedi 😘', 22)],
    },
    {
      id: 'benedicte', memberIds: ['benedicte'], unread: 0,
      messages: [m('b1', 'benedicte', 'Voici le programme du mois', 120, { file: { name: 'Programme_octobre_2026.pdf', size: '1,2 Mo' } })],
    },
    { id: 'mireille', memberIds: ['mireille'], unread: 0, messages: [] },
    { id: 'samuel', memberIds: ['samuel'], unread: 0, archived: true, messages: [m('sa1', 'samuel', 'Pour le pèlerinage, il reste 4 places.', 200)] },
  ];
}

export function seedCalls(): CallLog[] {
  return [
    { id: 'k1', memberId: 'joel', kind: 'audio', direction: 'entrant', createdAt: hoursAgo(20), durationSec: 244 },
    { id: 'k2', memberId: 'grace', kind: 'video', direction: 'sortant', createdAt: hoursAgo(28), durationSec: 612 },
    { id: 'k3', memberId: 'rachel', kind: 'audio', direction: 'manque', createdAt: hoursAgo(50) },
    { id: 'k4', memberId: 'samuel', kind: 'audio', direction: 'sortant', createdAt: hoursAgo(75), durationSec: 95 },
    { id: 'k5', memberId: 'benedicte', kind: 'video', direction: 'entrant', createdAt: hoursAgo(130), durationSec: 1320 },
  ];
}

/** Réponses automatiques pour simuler un interlocuteur pendant la démo. */
export const autoReplies = [
  'Amen 🙏',
  'D’accord, merci pour l’information !',
  'Que Dieu te bénisse 🙌',
  'Je te redis ça dans la soirée.',
  'Très bien, on en parle au culte.',
  'Ha ha 😄 tu as raison',
  'Bien reçu 👍',
];
