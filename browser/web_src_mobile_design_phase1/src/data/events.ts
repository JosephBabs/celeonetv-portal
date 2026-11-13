import type { SceneVariant } from './types';

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  place: string;
  parishId?: string;
  scene: SceneVariant;
  /** Affiche de l'événement (API) ; à défaut, la scène illustrée. */
  image?: string;
  /** Culte, Fête, Jeunesse, Pèlerinage, Formation… */
  category: string;
  description: string;
  participants: number;
  remote?: boolean;
}

const inDays = (d: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const churchEvents: ChurchEvent[] = [
  { id: 'e1', title: 'Culte d’action de grâce', date: inDays(1), place: 'Paroisse Alpha Oméga, Lokossa', parishId: 'alpha-omega-djegbe', scene: 'choir', category: 'Culte', description: 'Culte d’action de grâce pour les 79 ans de l’Église, suivi d’un repas fraternel.', participants: 214 },
  { id: 'e2', title: 'Veillée de prière des jeunes', date: inDays(5, 21), place: 'Paroisse Jéricho, Cotonou', parishId: 'jericho-cotonou', scene: 'candles', category: 'Jeunesse', description: 'Veillée animée par les jeunes du diocèse, louange et témoignages.', participants: 86 },
  { id: 'e3', title: 'Fête des moissons', date: inDays(12, 9), place: 'Paroisse Sion, Porto-Novo', parishId: 'sion-porto-novo', scene: 'sunrise', category: 'Fête', description: 'Grande fête des moissons avec procession, offrandes et chants.', participants: 540 },
  { id: 'e4', title: 'Formation des responsables de chorale', date: inDays(19, 15), place: 'En ligne', scene: 'drums', category: 'Formation', description: 'Session de formation sur la direction de chœur et le répertoire.', participants: 42 },
  { id: 'e5', title: 'Demi-finale du concours Jeunesse', date: inDays(22, 14), place: 'Paroisse Béthel, Abomey-Calavi', parishId: 'bethel-calavi', scene: 'youth', category: 'Jeunesse', description: 'Demi-finale du concours biblique annuel.', participants: 130 },
  { id: 'e6', title: 'Pèlerinage de fin d’année', date: inDays(80, 6), endDate: inDays(83, 18), place: 'Sèmè-Podji', scene: 'beach', category: 'Pèlerinage', description: 'Pèlerinage annuel : trois jours de prière au bord de la mer.', participants: 1200 },
];
