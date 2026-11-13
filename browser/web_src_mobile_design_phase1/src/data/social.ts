import { hoursAgo } from '@/lib/utils';
import type { LiveSession, Post, Status, TextBackground, Vibe } from './types';

export const textBackgrounds: TextBackground[] = [
  { id: 'menthe', label: 'Menthe', css: 'linear-gradient(135deg,#5fa89c,#7cc79a)' },
  { id: 'teal', label: 'Teal', css: 'linear-gradient(135deg,#0B565A,#2FA5A9)' },
  { id: 'aube', label: 'Aube', css: 'linear-gradient(135deg,#f6a35b,#e0567a)' },
  { id: 'nuit', label: 'Nuit', css: 'linear-gradient(135deg,#0f1b2d,#4C6FFF)' },
  { id: 'ciel', label: 'Ciel', css: 'linear-gradient(135deg,#4facde,#7f7fd5)' },
  { id: 'arc', label: 'Arc-en-ciel', css: 'linear-gradient(120deg,#FF3B5C,#FFD60A,#2ED47A,#2FA5A9,#9B5CFF)' },
  { id: 'or', label: 'Or', css: 'linear-gradient(135deg,#c9921c,#f7d774)' },
];

export const backgroundMusic = ['Hope — Femi Elcoutino', 'Halleluya — Chorale Sion', 'Mawu ma yi — Chorale juniors', 'Oluwa ni — Ensemble Béthel', 'Instrumental — Orgue céleste'];

export function seedSocialPosts(): Post[] {
  return [
    {
      id: 's-dev', authorId: 'chorale', kind: 'communaute', tag: 'Public', audience: 'public',
      body: 'Ding Ding Dong… Bell of Joy 🔔 Répétition générale de la chorale pour la fête des moissons. Venez nombreux samedi à 16 h !',
      scene: 'choir', createdAt: hoursAgo(22), likes: 3, shares: 1, reactors: ['grace', 'joel'],
      comments: [{ id: 'sc1', authorId: 'ruth', text: 'On sera là 🙌', createdAt: hoursAgo(20) }],
    },
    {
      id: 's-mendel', authorId: 'rachel', kind: 'communaute', tag: 'Public', audience: 'public',
      body: '🤍🤍🤍🎉 Merci Seigneur pour cette belle journée de louange en famille.',
      scene: 'prayer', createdAt: hoursAgo(46), likes: 5, shares: 0, reactors: ['benedicte', 'samuel', 'fiacre'],
      comments: [{ id: 'sc2', authorId: 'grace', text: 'Magnifique voix ma sœur !', createdAt: hoursAgo(40) }],
    },
    {
      id: 's-anniv', authorId: 'benedicte', kind: 'communaute', tag: 'Public', audience: 'public',
      body: 'Bonne fête à toute la communauté céleste 🌈🤍 79 ans de grâce !',
      scene: 'birthday', createdAt: hoursAgo(70), likes: 4, shares: 0, reactors: ['ruth'],
      comments: [
        { id: 'sc3', authorId: 'pascal', text: 'Amen, bonne fête à tous !', createdAt: hoursAgo(66) },
        { id: 'sc4', authorId: 'mireille', text: '🙏🏾🙏🏾', createdAt: hoursAgo(60) },
      ],
    },
    {
      id: 's-temoignage', authorId: 'joel', kind: 'communaute', tag: 'Amis', audience: 'amis',
      body: "Témoignage du dimanche : après trois mois de prière, mon frère a retrouvé du travail. Ne cessez jamais de prier, Dieu répond toujours au bon moment. 🙏",
      background: 'teal', createdAt: hoursAgo(96), likes: 24, shares: 3, reactors: ['grace', 'rachel', 'samuel'],
      comments: [{ id: 'sc5', authorId: 'rachel', text: 'Gloire à Dieu ! Merci pour ce partage.', createdAt: hoursAgo(90) }],
    },
    {
      id: 's-officiel', authorId: 'celeone-officiel', kind: 'communaute', tag: 'Public', audience: 'public',
      body: 'St Gabriel Ayellawadjè 🥁 Retour en images sur la soirée de louange des jeunes.',
      scene: 'drums', createdAt: hoursAgo(32 * 24), likes: 30, shares: 2, reactors: ['joel', 'fiacre', 'ruth'],
      comments: [
        { id: 'sc6', authorId: 'samuel', text: 'Quelle énergie !', createdAt: hoursAgo(31 * 24) },
        { id: 'sc7', authorId: 'daniel', text: 'Le batteur 🔥', createdAt: hoursAgo(31 * 24) },
        { id: 'sc8', authorId: 'benedicte', text: 'Vivement la prochaine édition', createdAt: hoursAgo(30 * 24) },
        { id: 'sc9', authorId: 'grace', text: '🙌', createdAt: hoursAgo(30 * 24) },
      ],
    },
    {
      id: 's-grace', authorId: 'grace', kind: 'communaute', tag: 'Public', audience: 'public',
      body: 'Seigneur, merci pour chaque matin que tu nous donnes 🌅', background: 'aube',
      createdAt: hoursAgo(28), likes: 19, shares: 2, reactors: ['joel', 'ruth'], comments: [],
    },
    {
      id: 's-plage', authorId: 'samuel', kind: 'communaute', tag: 'Public', audience: 'public',
      body: 'Pèlerinage de Noël à Sèmè-Podji : programme, covoiturage et hébergement. Écrivez-moi en message pour vous inscrire.',
      scene: 'beach', createdAt: hoursAgo(5 * 24), likes: 12, shares: 6, reactors: ['pascal', 'ruth'],
      comments: [],
    },
  ];
}

export function seedStatuses(): Status[] {
  return [
    { authorId: 'grace', items: [
      { id: 'st1', text: 'Que la paix du Seigneur soit avec vous ce matin ☀️', background: 'aube', createdAt: hoursAgo(2) },
      { id: 'st2', scene: 'sunrise', text: 'Lever de soleil à Ouidah', createdAt: hoursAgo(1.5) },
    ] },
    { authorId: 'celeone-officiel', items: [
      { id: 'st3', text: 'Culte d’action de grâce demain à 10 h — en direct sur Cèlè One TV', background: 'teal', createdAt: hoursAgo(5) },
    ] },
    { authorId: 'joel', items: [{ id: 'st4', scene: 'choir', text: 'Répétition 🎶', music: 'Halleluya — Chorale Sion', createdAt: hoursAgo(7) }] },
    { authorId: 'ruth', items: [{ id: 'st5', text: 'Psaume 121 : « Le secours me vient de l’Éternel »', background: 'nuit', createdAt: hoursAgo(9) }] },
    { authorId: 'fiacre', items: [{ id: 'st6', scene: 'candles', text: 'Veillée de prière', createdAt: hoursAgo(12) }] },
    { authorId: 'benedicte', items: [{ id: 'st7', text: 'Joyeux anniversaire à l’Église 🌈', background: 'arc', createdAt: hoursAgo(16) }] },
  ];
}

export function seedVibes(): Vibe[] {
  return [
    { id: 'v1', authorId: 'rachel', caption: '🤍🤍🤍🎉 Louange du soir', scene: 'prayer', views: 8, likes: 0, shares: 0, createdAt: hoursAgo(30), comments: [{ id: 'vc1', authorId: 'grace', text: 'Trop belle voix 😍', createdAt: hoursAgo(28) }] },
    { id: 'v2', authorId: 'fiacre', caption: 'Nino Hounkpè au clavier 🎹', scene: 'youth', views: 52, likes: 2, shares: 1, createdAt: hoursAgo(50), comments: [] },
    { id: 'v3', authorId: 'samuel', caption: 'Coucher de soleil sur la lagune 🌅', scene: 'sunrise', views: 42, likes: 4, shares: 0, createdAt: hoursAgo(80), comments: [] },
    { id: 'v4', authorId: 'chorale', caption: 'Extrait du concert de la chorale Saint-Gabriel', scene: 'choir', views: 310, likes: 41, shares: 9, createdAt: hoursAgo(120), comments: [{ id: 'vc2', authorId: 'daniel', text: 'Bravo à toute la chorale !', createdAt: hoursAgo(110) }] },
    { id: 'v5', authorId: 'joel', caption: 'Les tambours de la fête 🥁', scene: 'drums', views: 128, likes: 17, shares: 3, createdAt: hoursAgo(150), comments: [] },
    { id: 'v6', authorId: 'mireille', caption: 'Veillée aux bougies 🕯️', scene: 'candles', views: 64, likes: 9, shares: 1, createdAt: hoursAgo(200), comments: [] },
  ];
}

export const lives: LiveSession[] = [
  { id: 'l1', authorId: 'celeone-tv', title: 'Culte du soir en direct', viewers: 1240 },
  { id: 'l2', authorId: 'chorale', title: 'Répétition ouverte', viewers: 86 },
];

export const mustSee = [
  { id: 'm1', type: 'Film / clip', tone: 'orange' as const, title: 'Hope — Femi Elcoutino', text: 'Regarder depuis la médiathèque', scene: 'sunrise' as const, to: '/streaming' },
  { id: 'm2', type: 'Quiz', tone: 'violet' as const, title: 'Quiz biblique', text: 'Quel est le nom du fondateur de l’Église ?', to: '/jeunesse/quiz' },
  { id: 'm3', type: 'Direct', tone: 'danger' as const, title: 'Culte du soir', text: 'Cèlè One TV · 1,2 k spectateurs', scene: 'candles' as const, to: '/streaming/direct' },
  { id: 'm4', type: 'Cantique', tone: 'lavender' as const, title: 'Jelimoyamah', text: 'Cantique n° 1 · Goun', to: '/cantiques/goun/1' },
];
