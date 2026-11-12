import {
  AlarmClock, Award, BadgeCheck, BookOpen, Building2, Calendar, CalendarCheck2, CalendarClock, CalendarDays, CalendarPlus,
  CalendarRange, ChartColumn, ChartLine, CircleAlert, CircleHelp, CirclePlay, CircleUser, CreditCard, Earth, FilePen, FileText,
  Film, Gauge, Gift, Globe, GraduationCap, Hand, HandCoins, HeartPulse, History, Images, Info, Languages, Layers, Leaf,
  Library, Link2, ListMusic, LogIn, Map, MapPin, MapPinned, Megaphone, MessageCircle, MonitorSmartphone, Music, Music2,
  Navigation, Orbit, Phone, Podcast, Radio, Receipt, RefreshCw, Settings, Shield, ShieldCheck, Signpost, Smartphone, Smile,
  SquareCheck, Star, Trophy, Tv, UserRound, UsersRound, Video, Wallet, WandSparkles, TriangleAlert, Bookmark,
} from 'lucide-react';
import type { MenuGroup, NavItem, PrimarySection } from './types';

export const primaryNav: (Omit<NavItem, 'icon'> & { id: PrimarySection; icon: NavItem['icon'] | 'logo' })[] = [
  { id: 'accueil', label: 'Accueil', icon: 'logo', to: '/accueil' },
  { id: 'social', label: 'Social', icon: Orbit, to: '/social' },
  { id: 'documents', label: 'Documents', icon: FileText, to: '/documents' },
  { id: 'cantiques', label: 'Cantiques', icon: Music2, to: '/cantiques' },
  { id: 'jeunesse', label: 'Jeunesse', icon: Leaf, to: '/jeunesse' },
];

export const quickAccess: NavItem[] = [
  { id: 'live', label: 'Live TV', icon: Tv, to: '/streaming/direct' },
  { id: 'radio', label: 'Radio', icon: Radio, to: '/radio' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, to: '/agenda' },
  { id: 'streaming', label: 'Streaming', icon: CirclePlay, to: '/streaming' },
  { id: 'carte', label: 'Carte des paroisses', icon: Map, to: '/carte-paroisses' },
  { id: 'discussions', label: 'Discussions', icon: MessageCircle, to: '/discussions' },
  { id: 'evenements', label: 'Événements', icon: CalendarCheck2, to: '/evenements' },
  { id: 'bible', label: 'Bible complète', icon: BookOpen, to: '/bible' },
];

export const menuShortcuts: NavItem[] = [
  { id: 'communaute', label: 'Communauté', icon: Orbit, to: '/social' },
  { id: 'tv', label: 'TV live', icon: Tv, to: '/streaming/direct' },
  { id: 'radio', label: 'Radio live', icon: Radio, to: '/radio' },
  { id: 'streaming', label: 'Streaming', icon: CirclePlay, to: '/streaming' },
  { id: 'carte', label: 'Carte des paroisses', icon: Map, to: '/carte-paroisses', hint: 'GPS' },
  { id: 'programmes', label: 'Programmes hebdomadaires', icon: CalendarDays, to: '/menu/calendrier/programmes-hebdomadaires' },
  { id: 'parametres', label: 'Paramètres compte', icon: Settings, to: '/profil/parametres' },
];

const item = (id: string, label: string, icon: NavItem['icon'], to: string): NavItem => ({ id, label, icon, to });

export const menuGroups: MenuGroup[] = [
  {
    id: 'patrimoine', label: "Patrimoine de l'Église", icon: Library,
    items: [
      item('histoire', "Histoire de l'Église", Library, '/menu/patrimoine-eglise/histoire'),
      item('biographie', 'Biographie du fondateur', UserRound, '/menu/patrimoine-eglise/biographie-fondateur'),
      item('chronologie', 'Chronologie historique', Signpost, '/menu/patrimoine-eglise/chronologie'),
      item('expansion', 'Expansion mondiale', Earth, '/menu/patrimoine-eglise/expansion-mondiale'),
      item('moments', 'Moments clés', Star, '/menu/patrimoine-eglise/moments-cles'),
      item('photos', "Photos d'archives", Images, '/menu/patrimoine-eglise/photos-archives'),
      item('videos', 'Vidéos historiques', Video, '/menu/patrimoine-eglise/videos-historiques'),
    ],
  },
  {
    id: 'gps', label: 'GPS & Paroisses', icon: Navigation,
    items: [
      item('carte', 'Carte des paroisses', Map, '/carte-paroisses'),
      item('proches', 'Paroisses proches', MapPin, '/menu/gps-paroisses/paroisses-proches'),
      item('guidage', 'Guidage GPS', Navigation, '/menu/gps-paroisses/guidage-gps'),
      item('visite', 'Planifier une visite', CalendarPlus, '/menu/gps-paroisses/planifier-visite'),
      item('historique', 'Historique des visites', History, '/menu/gps-paroisses/historique-visites'),
    ],
  },
  {
    id: 'services-eglise', label: "Services de l'Église", icon: Building2,
    items: [
      item('annuaire', "Annuaire de l'Église", Building2, '/menu/services-eglise/annuaire'),
      item('localisateur', 'Localisateur de paroisses', MapPinned, '/menu/services-eglise/localisateur'),
      item('horaires', 'Horaires des cultes', AlarmClock, '/menu/services-eglise/horaires-cultes'),
      item('bergers', 'Annuaire des bergers', UsersRound, '/menu/services-eglise/bergers'),
      item('dioceses', 'Diocèses & districts', Layers, '/menu/services-eglise/dioceses'),
      item('branches', 'Branches dans le monde', Globe, '/menu/services-eglise/branches'),
      item('contacts', 'Contacts officiels', Phone, '/menu/services-eglise/contacts'),
    ],
  },
  {
    id: 'services-membres', label: 'Services membres', icon: Smartphone,
    items: [
      item('carte-membre', 'Carte de membre digitale', Smartphone, '/menu/services-membres/carte-membre'),
      item('verification', 'Vérification membre', ShieldCheck, '/menu/services-membres/verification'),
      item('conseil', 'Demande de conseil', Hand, '/menu/services-membres/demande-conseil'),
    ],
  },
  {
    id: 'bible', label: 'Bible Center', icon: BookOpen,
    items: [
      item('bible', 'Bible complète', BookOpen, '/bible'),
      item('traductions', 'Traductions bibliques', Languages, '/menu/bible/traductions'),
    ],
  },
  {
    id: 'calendrier', label: "Calendrier de l'Église", icon: CalendarDays,
    items: [
      item('theme', 'Thème de la semaine', Bookmark, '/menu/calendrier/theme-semaine'),
      item('agenda', 'Agenda personnel', Calendar, '/agenda'),
      item('fetes', 'Jours de fête', Star, '/menu/calendrier/jours-fete'),
      item('hebdo', 'Programmes hebdomadaires', CalendarRange, '/menu/calendrier/programmes-hebdomadaires'),
      item('quotidien', 'Programme quotidien', CalendarClock, '/menu/calendrier/programme-quotidien'),
    ],
  },
  {
    id: 'media', label: 'Media & Streaming', icon: CirclePlay,
    items: [
      item('radio', 'Radio live', Radio, '/radio'),
      item('tv', 'TV live', Tv, '/streaming/direct'),
      item('streaming', 'Streaming', CirclePlay, '/streaming'),
      item('cantiques', 'Cantiques multilingues', Music, '/cantiques'),
      item('playlists', 'Playlists', ListMusic, '/menu/media/playlists'),
      item('films', 'Films', Film, '/menu/media/films'),
      item('podcasts', 'Podcasts', Podcast, '/menu/media/podcasts'),
    ],
  },
  {
    id: 'communaute', label: 'Communauté', icon: Orbit,
    items: [item('communaute', 'Communauté', Orbit, '/social')],
  },
  {
    id: 'academie', label: 'Académie Cèlè One', icon: GraduationCap,
    items: [
      item('cours', 'Cours bibliques', Library, '/menu/academie/cours-bibliques'),
      item('doctrine', 'Doctrine', GraduationCap, '/menu/academie/doctrine'),
      item('ecole', 'École du dimanche', Smile, '/menu/academie/ecole-dimanche'),
      item('formation', 'Formation', Megaphone, '/menu/academie/formation'),
      item('lecons', 'Leçons vidéo', Video, '/menu/academie/lecons-video'),
      item('examens', 'Examens', SquareCheck, '/menu/academie/examens'),
      item('certificats', 'Certificats', Award, '/menu/academie/certificats'),
    ],
  },
  {
    id: 'dons', label: 'Dons & contributions', icon: Wallet,
    items: [
      item('projets', 'Projets spéciaux', HandCoins, '/menu/dons/projets'),
      item('recus', 'Reçus', Receipt, '/menu/dons/recus'),
      item('historique', 'Historique des dons', History, '/menu/dons/historique'),
    ],
  },
  {
    id: 'createurs', label: 'Outils créateurs', icon: WandSparkles,
    items: [
      item('tableau', 'Tableau créateur', Gauge, '/menu/outils-createurs/tableau'),
      item('analytics', 'Analytics créateur', ChartLine, '/menu/outils-createurs/analytics'),
      item('brouillons', 'Brouillons', FilePen, '/menu/outils-createurs/brouillons'),
      item('programmee', 'Publication programmée', CalendarClock, '/menu/outils-createurs/publication-programmee'),
      item('badges', 'Badges de vérification', BadgeCheck, '/menu/outils-createurs/badges-verification'),
      item('droits', 'Gestion des droits', Shield, '/menu/outils-createurs/droits'),
      item('monetisation', 'Monétisation', Wallet, '/menu/outils-createurs/monetisation'),
    ],
  },
  {
    id: 'progression', label: 'Progression & récompenses', icon: Trophy,
    items: [
      item('quiz', 'Classement quiz', ChartColumn, '/menu/progression/classement-quiz'),
      item('badges', 'Badges', Award, '/menu/progression/badges'),
      item('jeunesse', 'Classement jeunesse', Trophy, '/menu/progression/classement-jeunesse'),
      item('recompenses', 'Récompenses de participation', Gift, '/menu/progression/recompenses'),
    ],
  },
  {
    id: 'urgences', label: 'Urgences & alertes', icon: TriangleAlert,
    items: [
      item('annonces', 'Annonces urgentes', TriangleAlert, '/menu/urgences/annonces'),
      item('regionales', 'Alertes régionales', CircleAlert, '/menu/urgences/alertes-regionales'),
      item('crise', 'Informations de crise', Info, '/menu/urgences/crise'),
      item('priere', 'Notifications de prière urgente', HeartPulse, '/menu/urgences/priere'),
    ],
  },
  {
    id: 'integrations', label: 'Intégrations', icon: Link2,
    items: [
      item('calendrier', 'Synchronisation calendrier', RefreshCw, '/menu/integrations/calendrier'),
      item('connexion', 'Connexion Google / Apple', LogIn, '/menu/integrations/connexion'),
      item('smart-tv', 'Smart TV', MonitorSmartphone, '/menu/integrations/smart-tv'),
    ],
  },
  {
    id: 'compte', label: 'Compte & paramètres', icon: CircleUser,
    items: [
      item('profil', 'Profil', CircleUser, '/profil'),
      item('parametres', 'Paramètres compte', Settings, '/profil/parametres'),
      item('abonnements', 'Abonnements', CreditCard, '/profil/parametres/abonnement'),
      item('aide', 'Aide', CircleHelp, '/menu/compte/aide'),
    ],
  },
];

/** Titres des pages principales (hors menu ☰) pour les en-têtes et le fil d'Ariane. */
const pageTitles: [RegExp, string][] = [
  [/^\/accueil/, 'Accueil'],
  [/^\/social\/amis/, 'Amis'],
  [/^\/social\/cele-vibes/, 'Cele Vibes'],
  [/^\/social\/profil/, 'Profil social'],
  [/^\/social/, 'Social'],
  [/^\/discussions/, 'Discussions'],
  [/^\/documents/, 'Documents'],
  [/^\/cantiques/, 'Cantiques'],
  [/^\/jeunesse/, 'Jeunesse'],
  [/^\/bible/, 'Bible Center'],
  [/^\/streaming/, 'Streaming'],
  [/^\/radio/, 'Radio'],
  [/^\/carte-paroisses/, 'Carte des paroisses'],
  [/^\/agenda/, 'Agenda'],
  [/^\/evenements/, 'Événements'],
  [/^\/notifications/, 'Notifications'],
  [/^\/profil\/parametres/, 'Paramètres'],
  [/^\/profil/, 'Profil'],
];

export function findMenuEntry(pathname: string) {
  for (const group of menuGroups) {
    const found = group.items.find((i) => i.to === pathname);
    if (found) return { group, item: found };
  }
  return null;
}

export function titleForPath(pathname: string) {
  const entry = findMenuEntry(pathname);
  if (entry) return entry.item.label;
  return pageTitles.find(([re]) => re.test(pathname))?.[1] ?? 'CélèOne';
}
