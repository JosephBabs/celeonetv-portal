import type { ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { BiographiePage, ChronologiePage, ExpansionPage, HistoirePage, MomentsPage, PhotosPage, VideosHistoriquesPage } from './Patrimoine';
import {
  AnnuairePage, BergersPage, BranchesPage, CarteMembrePage, ContactsPage, DemandeConseilPage, DiocesesPage, GuidagePage, HistoriqueVisitesPage,
  HorairesPage, ParoissesProchesPage, PlanifierVisitePage, TraductionsPage, VerificationPage,
} from './Services';
import { FilmsPage, JoursFetePage, PlaylistsPage, PodcastsPage, ProgrammeQuotidienPage, ProgrammesHebdoPage } from './Calendrier';
import { ThemePage } from '@/pages/theme/ThemePage';
import { CertificatsPage, CoursesPage, ExamensPage } from './Academie';
import { HistoriqueDonsPage, ProjetsPage, RecusPage } from './Dons';
import { AnalyticsPage, BadgesVerificationPage, BrouillonsPage, DroitsPage, MonetisationPage, PublicationProgrammeePage, TableauCreateurPage } from './Createurs';
import {
  AidePage, AlertesRegionalesPage, AnnoncesUrgentesPage, BadgesPage, ClassementJeunessePage, ClassementQuizPage, ConnexionComptesPage, CrisePage,
  PrierePage, RecompensesPage, SmartTvPage, SyncCalendrierPage,
} from './Communaute';

const course = (cat: string) => () => <CoursesPage cat={cat} />;

/** Correspondance « groupe/élément » → page, pour toutes les entrées du menu ☰. */
const pages: Record<string, ComponentType> = {
  'patrimoine-eglise/histoire': HistoirePage,
  'patrimoine-eglise/biographie-fondateur': BiographiePage,
  'patrimoine-eglise/chronologie': ChronologiePage,
  'patrimoine-eglise/expansion-mondiale': ExpansionPage,
  'patrimoine-eglise/moments-cles': MomentsPage,
  'patrimoine-eglise/photos-archives': PhotosPage,
  'patrimoine-eglise/videos-historiques': VideosHistoriquesPage,
  'gps-paroisses/paroisses-proches': ParoissesProchesPage,
  'gps-paroisses/guidage-gps': GuidagePage,
  'gps-paroisses/planifier-visite': PlanifierVisitePage,
  'gps-paroisses/historique-visites': HistoriqueVisitesPage,
  'services-eglise/annuaire': AnnuairePage,
  'services-eglise/localisateur': () => <AnnuairePage locator />,
  'services-eglise/horaires-cultes': HorairesPage,
  'services-eglise/bergers': BergersPage,
  'services-eglise/dioceses': DiocesesPage,
  'services-eglise/branches': BranchesPage,
  'services-eglise/contacts': ContactsPage,
  'services-membres/carte-membre': CarteMembrePage,
  'services-membres/verification': VerificationPage,
  'services-membres/demande-conseil': DemandeConseilPage,
  'bible/traductions': TraductionsPage,
  'calendrier/theme-semaine': ThemePage,
  'calendrier/jours-fete': JoursFetePage,
  'calendrier/programmes-hebdomadaires': ProgrammesHebdoPage,
  'calendrier/programme-quotidien': ProgrammeQuotidienPage,
  'media/playlists': PlaylistsPage,
  'media/films': FilmsPage,
  'media/podcasts': PodcastsPage,
  'academie/cours-bibliques': course('cours-bibliques'),
  'academie/doctrine': course('doctrine'),
  'academie/ecole-dimanche': course('ecole-dimanche'),
  'academie/formation': course('formation'),
  'academie/lecons-video': course('lecons-video'),
  'academie/examens': ExamensPage,
  'academie/certificats': CertificatsPage,
  'dons/projets': ProjetsPage,
  'dons/recus': RecusPage,
  'dons/historique': HistoriqueDonsPage,
  'outils-createurs/tableau': TableauCreateurPage,
  'outils-createurs/analytics': AnalyticsPage,
  'outils-createurs/brouillons': BrouillonsPage,
  'outils-createurs/publication-programmee': PublicationProgrammeePage,
  'outils-createurs/badges-verification': BadgesVerificationPage,
  'outils-createurs/droits': DroitsPage,
  'outils-createurs/monetisation': MonetisationPage,
  'progression/classement-quiz': ClassementQuizPage,
  'progression/badges': BadgesPage,
  'progression/classement-jeunesse': ClassementJeunessePage,
  'progression/recompenses': RecompensesPage,
  'urgences/annonces': AnnoncesUrgentesPage,
  'urgences/alertes-regionales': AlertesRegionalesPage,
  'urgences/crise': CrisePage,
  'urgences/priere': PrierePage,
  'integrations/calendrier': SyncCalendrierPage,
  'integrations/connexion': ConnexionComptesPage,
  'integrations/smart-tv': SmartTvPage,
  'compte/aide': AidePage,
};

export default function MenuRouter() {
  const { group, item } = useParams();
  const Page = pages[`${group}/${item}`];
  return Page ? <Page /> : <ComingSoonPage />;
}
