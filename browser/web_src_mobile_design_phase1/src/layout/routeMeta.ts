import type { PrimarySection } from '@/data/types';

/** standard = 3 colonnes · wide = sans colonne droite · full = plein format (messagerie, streaming, radio, carte). */
export type LayoutMode = 'standard' | 'wide' | 'full';
export type BottomNavKind = 'default' | 'social' | 'discussions' | 'streaming' | 'none';
export type HeaderVariant = 'default' | 'social' | 'reduced';

interface RouteMeta {
  section?: PrimarySection;
  layout: LayoutMode;
  bottomNav?: BottomNavKind;
}

const rules: [RegExp, RouteMeta][] = [
  [/^\/accueil/, { section: 'accueil', layout: 'standard' }],
  [/^\/social\/cele-vibes/, { section: 'social', layout: 'full' }],
  [/^\/social/, { section: 'social', layout: 'standard' }],
  [/^\/documents/, { section: 'documents', layout: 'wide' }],
  [/^\/cantiques/, { section: 'cantiques', layout: 'wide' }],
  [/^\/jeunesse/, { section: 'jeunesse', layout: 'wide' }],
  [/^\/discussions\/.+/, { section: 'social', layout: 'full', bottomNav: 'none' }],
  [/^\/discussions/, { section: 'social', layout: 'full', bottomNav: 'discussions' }],
  [/^\/streaming/, { layout: 'full', bottomNav: 'streaming' }],
  [/^\/radio/, { layout: 'full', bottomNav: 'none' }],
  [/^\/carte-paroisses/, { layout: 'full', bottomNav: 'none' }],
  [/^\/evenements/, { layout: 'standard', bottomNav: 'none' }],
  [/^\/profil/, { layout: 'wide' }],
  [/^\/agenda/, { layout: 'wide' }],
];

export function getRouteMeta(pathname: string): RouteMeta {
  return rules.find(([re]) => re.test(pathname))?.[1] ?? { layout: 'standard' };
}

export function headerVariantFor(section: PrimarySection): HeaderVariant {
  if (section === 'social') return 'social';
  if (section === 'documents' || section === 'cantiques') return 'reduced';
  return 'default';
}
