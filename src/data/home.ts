import { Bookmark, Building2, Library, Map } from 'lucide-react';
import { hoursAgo } from '@/lib/utils';
import type { Post } from './types';

export const weeklyTheme = {
  week: 40,
  title: 'Origine et Source',
  period: 'du 28 septembre au 4 octobre 2026',
  dayLabel: 'Mardi 29 septembre',
  readings: [
    { label: '1re lecture', ref: 'Exode 19 : 1-9', to: '/bible/exode/19' },
    { label: '2e lecture', ref: '1 Pierre 2 : 4-10', to: '/bible/1-pierre/2' },
  ],
  summary:
    "Cette semaine, l'Église nous invite à revenir à la source de notre foi : l'appel de Dieu qui rassemble un peuple, le met à part et en fait une maison spirituelle. Comme Israël au pied du Sinaï, nous sommes appelés à écouter, à répondre et à devenir des pierres vivantes.",
  meditation: [
    "Lundi — Le Dieu qui appelle : relire Exode 19 et noter ce que Dieu attend de son peuple.",
    'Mardi — Anniversaire de l’Église : rendre grâce pour 79 ans de fidélité.',
    'Mercredi — Pierres vivantes : quelle place j’occupe dans la communauté ?',
    'Jeudi — La sainteté au quotidien : un geste concret envers un frère ou une sœur.',
    'Vendredi — Jeûne et prière pour les paroisses de la diaspora.',
    'Samedi — Préparation du culte : confession et purification.',
    'Dimanche — Culte d’action de grâce et partage des témoignages.',
  ],
};

export const explorePromos = [
  {
    id: 'oppositions',
    eyebrow: 'Explorer Cèlè One',
    title: 'Les premières oppositions',
    text: 'La croissance du mouvement suscite également des réactions.',
    to: '/menu/patrimoine-eglise/moments-cles',
  },
  {
    id: 'porto-novo',
    eyebrow: 'Explorer Cèlè One',
    title: 'Porto-Novo, 1947',
    text: 'Retour sur les débuts de l’Église et la vision du fondateur.',
    to: '/menu/patrimoine-eglise/histoire',
  },
];

export const featuredParish = {
  id: 'alpha-omega-djegbe',
  eyebrow: 'Paroisse et célébration',
  name: 'Alpha Oméga de Djègbé-Lokossa',
  address: 'Carrefour, Lokossa, Ouèssè/Djègbé, Bénin',
  note: 'Dates de création et de fête visibles depuis la fiche de la paroisse',
};

export const homeShortcuts = [
  { label: "Histoire de l'Église", to: '/menu/patrimoine-eglise/histoire', icon: Library },
  { label: "Annuaire de l'Église", to: '/menu/services-eglise/annuaire', icon: Building2 },
  { label: 'Carte des paroisses', to: '/carte-paroisses', icon: Map },
  { label: 'Thème de la semaine', to: '/menu/calendrier/theme-semaine', icon: Bookmark },
];

export function seedOfficialPosts(): Post[] {
  return [
    {
      id: 'p-79ans',
      authorId: 'admin',
      kind: 'actualite',
      tag: 'Actualité',
      title: '79 ans de grâce, de lumière et d’espérance',
      body:
        "79 ans de grâce, de Lumière et d'espérance ! Le 29 septembre 2026, l'Église du Christianisme Céleste célèbre son anniversaire. Rendons grâce à Dieu pour le chemin parcouru, pour chaque paroisse fondée et pour chaque âme touchée. Rejoignez le culte d'action de grâce dans votre paroisse et partagez vos témoignages avec la communauté.",
      createdAt: hoursAgo(5),
      media: ['jubilee'],
      likes: 214,
      shares: 37,
      comments: [
        { id: 'c1', authorId: 'grace', text: 'Gloire à Dieu pour ces 79 ans ! Alléluia 🙏', createdAt: hoursAgo(4) },
        { id: 'c2', authorId: 'samuel', text: 'Que la lumière continue de briller sur toutes les paroisses.', createdAt: hoursAgo(3) },
      ],
    },
    {
      id: 'p-programme-octobre',
      authorId: 'admin',
      kind: 'agenda',
      tag: 'Programme',
      title: 'Programme des cultes — octobre 2026',
      body:
        "Informations sur la célébration des 79 ans de l'ECC et programme des cultes du mois d'octobre : lectures du jour, horaires et numérotation des cantiques pour le Bénin et le Nigeria. Téléchargez le programme et partagez-le avec votre paroisse.",
      createdAt: hoursAgo(20),
      media: ['program'],
      likes: 96,
      shares: 58,
      comments: [{ id: 'c3', authorId: 'benedicte', text: 'Merci pour le programme, très clair !', createdAt: hoursAgo(18) }],
    },
    {
      id: 'p-artistes',
      authorId: 'admin',
      kind: 'annonce',
      tag: 'Annonce',
      title: 'Appel aux artistes',
      body:
        "Alléluia la famille en Christ 🙏 Je vous partage une belle opportunité pour nous tous : CÈLÈ ONE lance son appel aux artistes ! Chantres, musiciens, réalisateurs, créateurs de contenu : diffusez vos chansons, vos films et tous vos contenus sur Cèlè One. Le streaming monétisé arrive bientôt — exprimez, partagez, rayonnez !",
      createdAt: hoursAgo(30),
      media: ['artists', 'youth'],
      likes: 18,
      shares: 4,
      comments: [],
    },
    {
      id: 'p-maj',
      authorId: 'admin',
      kind: 'annonce',
      tag: 'Mise à jour',
      body: 'Faites la mise à jour de Cèlè One sur le Play Store et l’App Store : nouveaux cantiques, lecteur Bible amélioré et notifications plus rapides.',
      createdAt: hoursAgo(50),
      likes: 13,
      shares: 0,
      comments: [
        { id: 'c4', authorId: 'pascal', text: 'C’est fait, merci !', createdAt: hoursAgo(48) },
        { id: 'c5', authorId: 'ruth', text: 'La version web arrive quand ?', createdAt: hoursAgo(47) },
      ],
    },
    {
      id: 'p-oshoffa',
      authorId: 'celeone-tv',
      kind: 'actualite',
      tag: 'Patrimoine',
      title: 'Qui était Oshoffa ?',
      body:
        "Quel rôle as-tu joué dans l'histoire de l'Église ? Au fond, peu importe à quelle sensibilité nous appartenons : avant l'Église, il y avait un homme. Samuel Bilewu Joseph Oshoffa, né en 1909 à Porto-Novo, a reçu la vision qui allait rassembler des millions de fidèles. Un héritage vivant pour le monde, et pour les générations à venir.",
      createdAt: hoursAgo(76),
      media: ['founder'],
      likes: 16,
      shares: 2,
      comments: [],
    },
    {
      id: 'p-reforme-tenue',
      authorId: 'admin',
      kind: 'reforme',
      tag: 'Réforme',
      title: 'Harmonisation de la numérotation des cantiques',
      body:
        "Suite à la décision du conseil pastoral, la numérotation des cantiques sera harmonisée entre les recueils du Bénin et du Nigeria à partir du 1er novembre 2026. Les deux numéros resteront affichés pendant la période de transition dans l'application.",
      createdAt: hoursAgo(98),
      likes: 41,
      shares: 11,
      comments: [{ id: 'c6', authorId: 'daniel', text: 'Excellente nouvelle pour les paroisses de la diaspora.', createdAt: hoursAgo(90) }],
    },
    {
      id: 'p-moisson',
      authorId: 'celeone-tv',
      kind: 'annonce',
      tag: 'Événement',
      title: 'Fête des moissons 2026',
      body:
        "La fête des moissons approche ! Chaque paroisse est invitée à préparer ses offrandes et ses chants d'action de grâce. Le culte central sera retransmis en direct sur Cèlè One TV.",
      createdAt: hoursAgo(130),
      media: ['harvest'],
      likes: 87,
      shares: 19,
      comments: [],
    },
  ];
}
