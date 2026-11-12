import { lazy, useEffect, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { GlobalOverlays } from '@/components/GlobalOverlays';
import { AuthPage } from '@/pages/auth/AuthPage';
import { HomePage } from '@/pages/home/HomePage';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { DiagnosticPage } from '@/pages/DiagnosticPage';
import { ThemePage } from '@/pages/theme/ThemePage';
import { SharedPostPage } from '@/pages/social/SharedPostPage';
import { AppDownloadBanner } from '@/components/AppDownloadBanner';
import { useSettings } from '@/store/settings';
import { applyTheme, watchSystemTheme } from '@/lib/theme';

/** Charge une page nommée à la demande (le loader CélèOne s'affiche pendant le chargement, cf. AppShell). */
function page<M extends Record<string, unknown>>(loader: () => Promise<M>, name: keyof M) {
  return lazy(() => loader().then((m) => ({ default: m[name] as ComponentType })));
}

const NotificationsPage = page(() => import('@/pages/notifications/NotificationsPage'), 'NotificationsPage');
const SocialPage = page(() => import('@/pages/social/SocialPage'), 'SocialPage');
const FriendsPage = page(() => import('@/pages/social/FriendsPage'), 'FriendsPage');
const CeleVibesPage = page(() => import('@/pages/social/CeleVibesPage'), 'CeleVibesPage');
const SocialProfilePage = page(() => import('@/pages/social/SocialProfilePage'), 'SocialProfilePage');
const MemberProfilePage = page(() => import('@/pages/social/MemberProfilePage'), 'MemberProfilePage');
const PageProfilePage = page(() => import('@/pages/social/MemberProfilePage'), 'PageProfilePage');
const DiscussionsPage = page(() => import('@/pages/discussions/DiscussionsPage'), 'DiscussionsPage');
const DocumentsPage = page(() => import('@/pages/documents/DocumentsPages'), 'DocumentsPage');
const DocumentDetailPage = page(() => import('@/pages/documents/DocumentsPages'), 'DocumentDetailPage');
const CantiquesHomePage = page(() => import('@/pages/cantiques/CantiquesPages'), 'CantiquesHomePage');
const CantiquesBookRoute = page(() => import('@/pages/cantiques/CantiquesPages'), 'CantiquesBookRoute');
const BibleHomePage = page(() => import('@/pages/bible/BiblePages'), 'BibleHomePage');
const BibleBookPage = page(() => import('@/pages/bible/BiblePages'), 'BibleBookPage');
const BibleChapterPage = page(() => import('@/pages/bible/BiblePages'), 'BibleChapterPage');
const JeunesseHomePage = page(() => import('@/pages/jeunesse/JeunessePages'), 'JeunesseHomePage');
const JeunesseResultsPage = page(() => import('@/pages/jeunesse/JeunessePages'), 'JeunesseResultsPage');
const JeunesseQuizPage = page(() => import('@/pages/jeunesse/JeunessePages'), 'JeunesseQuizPage');
const JeunesseRegistrationPage = page(() => import('@/pages/jeunesse/JeunessePages'), 'JeunesseRegistrationPage');
const StreamingPage = page(() => import('@/pages/streaming/StreamingPage'), 'StreamingPage');
const RadioPage = page(() => import('@/pages/radio/RadioPage'), 'RadioPage');
const ParishMapPage = page(() => import('@/pages/carte/ParishMapPage'), 'ParishMapPage');
const AgendaPage = page(() => import('@/pages/agenda/AgendaPages'), 'AgendaPage');
const EventsPage = page(() => import('@/pages/agenda/AgendaPages'), 'EventsPage');
const ProfilePage = page(() => import('@/pages/profil/ProfilePages'), 'ProfilePage');
const SettingsPage = page(() => import('@/pages/profil/ProfilePages'), 'SettingsPage');
const MenuRouter = lazy(() => import('@/pages/menu/MenuRouter'));

function ThemeSync() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
    return watchSystemTheme(theme);
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppDownloadBanner />
      <ThemeSync />
      <Routes>
        <Route path="/connexion" element={<AuthPage />} />
        <Route path="/inscription" element={<AuthPage mode="signup" />} />
        <Route path="/login" element={<Navigate to="/connexion" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/accueil" replace />} />
          <Route path="/accueil" element={<HomePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/posts/:postId" element={<SharedPostPage />} />
          <Route path="/post/:postId" element={<SharedPostPage />} />
          <Route path="/social/:contentId" element={<SharedPostPage />} />
          <Route path="/reels/:reelId" element={<SharedPostPage />} />
          <Route path="/live/:liveId" element={<StreamingPage />} />
          <Route path="/videos/:videoId" element={<StreamingPage />} />
          <Route path="/movies/:videoId" element={<StreamingPage />} />
          <Route path="/:channelName/live" element={<StreamingPage />} />
          <Route path="/themes/:contentId" element={<ThemePage />} />
          <Route path="/weekly-themes/:contentId" element={<ThemePage />} />
          <Route path="/weekly-programs/:contentId" element={<ThemePage />} />
          <Route path="/spiritual-program" element={<ThemePage />} />
          <Route path="/parishes" element={<Navigate to="/carte-paroisses" replace />} />
          <Route path="/parishes/register" element={<Navigate to="/carte-paroisses" replace />} />
          <Route path="/hymns/:contentId" element={<Navigate to="/cantiques" replace />} />
          <Route path="/songs/:contentId" element={<Navigate to="/streaming?onglet=musique" replace />} />
          <Route path="/fr/*" element={<Navigate to="/accueil" replace />} />
          <Route path="/en/*" element={<Navigate to="/accueil" replace />} />
          <Route path="/es/*" element={<Navigate to="/accueil" replace />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/social/amis" element={<FriendsPage />} />
          <Route path="/social/cele-vibes" element={<CeleVibesPage />} />
          <Route path="/social/profil" element={<SocialProfilePage />} />
          <Route path="/social/profil/:userId" element={<SocialProfilePage />} />
          <Route path="/social/membre/:uid" element={<MemberProfilePage />} />
          <Route path="/social/page/:pageId" element={<PageProfilePage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/discussions/:conversationId" element={<DiscussionsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="/cantiques" element={<CantiquesHomePage />} />
          <Route path="/cantiques/:langue" element={<CantiquesBookRoute />} />
          <Route path="/cantiques/:langue/:item" element={<CantiquesBookRoute />} />
          <Route path="/bible" element={<BibleHomePage />} />
          <Route path="/bible/:livre" element={<BibleBookPage />} />
          <Route path="/bible/:livre/:chapitre" element={<BibleChapterPage />} />
          <Route path="/menu/bible" element={<Navigate to="/bible" replace />} />
          <Route path="/jeunesse" element={<JeunesseHomePage />} />
          <Route path="/jeunesse/resultats" element={<JeunesseResultsPage />} />
          <Route path="/jeunesse/quiz" element={<JeunesseQuizPage />} />
          <Route path="/jeunesse/inscription" element={<JeunesseRegistrationPage />} />
          <Route path="/streaming" element={<StreamingPage />} />
          <Route path="/streaming/live/:videoId" element={<StreamingPage />} />
          <Route path="/streaming/:chaineId" element={<StreamingPage />} />
          <Route path="/radio" element={<RadioPage />} />
          <Route path="/carte-paroisses" element={<ParishMapPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/evenements" element={<EventsPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/profil/parametres" element={<SettingsPage />} />
          <Route path="/profil/parametres/:section" element={<SettingsPage />} />
          <Route path="/menu/compte-parametres" element={<Navigate to="/profil/parametres" replace />} />
          <Route path="/menu/gps-paroisses" element={<Navigate to="/carte-paroisses" replace />} />
          <Route path="/diagnostic-api" element={<DiagnosticPage />} />
          <Route path="/menu/:group/:item" element={<MenuRouter />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Routes>
      <GlobalOverlays />
    </BrowserRouter>
  );
}
