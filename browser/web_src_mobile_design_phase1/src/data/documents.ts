export interface DocSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface ChurchDocument {
  id: string;
  title: string;
  /** Essentiels, Doctrines, Liturgie, Histoire… (catégories libres pour les documents de l'API). */
  category: string;
  subcategory: string;
  reference: string;
  icon: 'file' | 'list' | 'book' | 'scroll';
  updatedAt: string;
  pages: number;
  sections: DocSection[];
}

const demo = 'Texte de démonstration : ce contenu sera remplacé par le document officiel transmis par l’administration.';

export const documentCategories = ['Essentiels', 'Doctrines', 'Liturgie', 'Histoire'] as const;

export const churchDocuments: ChurchDocument[] = [
  {
    id: '10-commandements', title: '10 commandements de Dieu', category: 'Essentiels', subcategory: 'Biblique', reference: 'Exode 20 v 3-17', icon: 'file', updatedAt: '2026-09-02', pages: 2,
    sections: [
      { heading: 'Les dix commandements (Exode 20 : 3-17)', paragraphs: [demo] },
      { list: ['Premier commandement — énoncé de démonstration.', 'Deuxième commandement — énoncé de démonstration.', 'Troisième commandement — énoncé de démonstration.', 'Quatrième commandement — énoncé de démonstration.', 'Cinquième commandement — énoncé de démonstration.', 'Sixième commandement — énoncé de démonstration.', 'Septième commandement — énoncé de démonstration.', 'Huitième commandement — énoncé de démonstration.', 'Neuvième commandement — énoncé de démonstration.', 'Dixième commandement — énoncé de démonstration.'] },
      { heading: 'Méditation', paragraphs: ['Ces commandements structurent la vie du fidèle : relation à Dieu, au prochain et à soi-même. Chaque paroisse peut s’appuyer sur ce document pour l’enseignement du dimanche.'] },
    ],
  },
  {
    id: '12-interdits', title: "12 interdits de l'Église du Christianisme Céleste", category: 'Doctrines', subcategory: 'Directives', reference: 'Règlement intérieur', icon: 'list', updatedAt: '2026-08-14', pages: 3,
    sections: [
      { heading: 'Présentation', paragraphs: [demo, 'Le document présente les règles de vie que chaque membre s’engage à respecter.'] },
      { heading: 'Liste des interdits', list: Array.from({ length: 12 }, (_, i) => `Interdit n° ${i + 1} — formulation de démonstration.`) },
    ],
  },
  {
    id: 'quatre-sacrements', title: "Les quatre (04) sacrements de l'Église", category: 'Doctrines', subcategory: 'Directives', reference: 'Doctrine générale', icon: 'list', updatedAt: '2026-07-30', pages: 4,
    sections: [
      { heading: 'Introduction', paragraphs: [demo] },
      { heading: 'Premier sacrement', paragraphs: ['Description de démonstration du premier sacrement et de sa célébration.'] },
      { heading: 'Deuxième sacrement', paragraphs: ['Description de démonstration du deuxième sacrement et de sa célébration.'] },
      { heading: 'Troisième sacrement', paragraphs: ['Description de démonstration du troisième sacrement et de sa célébration.'] },
      { heading: 'Quatrième sacrement', paragraphs: ['Description de démonstration du quatrième sacrement et de sa célébration.'] },
    ],
  },
  {
    id: 'ordre-culte', title: 'Ordre du culte dominical', category: 'Liturgie', subcategory: 'Célébration', reference: 'Guide liturgique', icon: 'book', updatedAt: '2026-09-20', pages: 5,
    sections: [
      { heading: 'Déroulement', list: ['Accueil et entrée de la procession', 'Cantique d’ouverture', 'Prière d’invocation', 'Lectures du jour', 'Prédication', 'Offrandes et annonces', 'Bénédiction finale'] },
      { heading: 'Notes pour les responsables', paragraphs: [demo] },
    ],
  },
  {
    id: 'fetes-annuelles', title: 'Calendrier des fêtes annuelles', category: 'Liturgie', subcategory: 'Calendrier', reference: 'Année 2026', icon: 'book', updatedAt: '2026-01-05', pages: 2,
    sections: [
      { heading: 'Principales fêtes', list: ['Fête de l’anniversaire de l’Église — 29 septembre', 'Fête des moissons — selon les paroisses', 'Veillée de Noël — 24 décembre', 'Pèlerinage de fin d’année — décembre'] },
      { paragraphs: [demo] },
    ],
  },
  {
    id: 'histoire-resumee', title: "Histoire résumée de l'Église", category: 'Histoire', subcategory: 'Patrimoine', reference: 'Depuis 1947', icon: 'scroll', updatedAt: '2026-06-11', pages: 6,
    sections: [
      { heading: 'Les origines', paragraphs: ['L’Église a été fondée en 1947 à Porto-Novo. ' + demo] },
      { heading: 'L’expansion', paragraphs: ['Description de démonstration de l’expansion des paroisses en Afrique de l’Ouest puis dans le monde.'] },
      { heading: 'Aujourd’hui', paragraphs: ['Présentation de démonstration de l’organisation actuelle, des diocèses et des services.'] },
    ],
  },
  {
    id: 'tenue-blanche', title: 'La tenue blanche (soutane) : usages', category: 'Essentiels', subcategory: 'Pratique', reference: 'Guide du fidèle', icon: 'file', updatedAt: '2026-05-18', pages: 2,
    sections: [{ heading: 'Usages', paragraphs: [demo] }, { list: ['Port lors des cultes', 'Entretien et respect de la tenue', 'Cas particuliers'] }],
  },
];

export function getDocument(id: string) {
  return churchDocuments.find((d) => d.id === id);
}

export function documentText(d: ChurchDocument) {
  return [
    d.title.toUpperCase(),
    `${d.category} · ${d.subcategory} · ${d.reference}`,
    '',
    ...d.sections.flatMap((s) => [s.heading ? `\n${s.heading}` : '', ...(s.paragraphs ?? []), ...(s.list ?? []).map((l, i) => `${i + 1}. ${l}`)]),
  ].join('\n');
}
