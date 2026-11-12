# CélèOne Web — Dossier de conception complet

> Document de référence unique pour la construction du frontend de CélèOne Web.
> Il reprend et détaille, page par page et bouton par bouton, tout ce qui a été validé
> dans le cahier de conception PDF, avec un niveau de détail suffisant pour qu'un
> développeur (humain ou IA) puisse implémenter chaque écran sans ambiguïté.
>
> **Principe directeur :** l'ossature de navigation (header, colonnes, écran de connexion,
> messagerie) s'inspire de Facebook Web et WhatsApp Web. Le contenu, les couleurs, les
> libellés et les fonctionnalités viennent strictement de l'application mobile CélèOne.

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Design system (tokens)](#2-design-system-tokens)
3. [Sitemap complet](#3-sitemap-complet)
4. [Composants globaux partagés](#4-composants-globaux-partagés)
5. [Connexion & Inscription](#5-connexion--inscription)
6. [Page Accueil](#6-page-accueil)
7. [Page Social](#7-page-social)
8. [Messagerie / Discussions](#8-messagerie--discussions)
9. [Page Documents](#9-page-documents)
10. [Page Cantiques](#10-page-cantiques)
11. [Page Jeunesse](#11-page-jeunesse)
12. [Page Bible complète (Bible Center)](#12-page-bible-complète-bible-center)
13. [Page Streaming / Live TV](#13-page-streaming--live-tv)
14. [Page Radio](#14-page-radio)
15. [Page Carte des paroisses](#15-page-carte-des-paroisses)
16. [Page Agenda](#16-page-agenda)
17. [Page Événements](#17-page-événements)
18. [Page Notifications](#18-page-notifications)
19. [Profil & Paramètres](#19-profil--paramètres)
20. [Menu secondaire ☰ — détail de tous les groupes](#20-menu-secondaire--détail-de-tous-les-groupes)
21. [États transverses (à appliquer partout)](#21-états-transverses-à-appliquer-partout)
22. [Responsive](#22-responsive)
23. [Ordre de construction recommandé](#23-ordre-de-construction-recommandé)
24. [Ce qui reste à clarifier](#24-ce-qui-reste-à-clarifier)

---

## 1. Vue d'ensemble du projet

**CélèOne Web** est la déclinaison navigateur de l'application mobile CélèOne, une
plateforme communautaire pour les célestes qui regroupe : réseau social, messagerie,
streaming (TV/radio), cantiques, Bible, documents doctrinaux, agenda, événements,
espace Jeunesse et carte des paroisses.

### Deux niveaux de navigation (à ne jamais confondre)

| Niveau | Rôle | Contenu | Comportement |
|---|---|---|---|
| **Navigation principale** | Bascule entre les 5 grandes zones de l'app | Accueil · Social · Documents · Cantiques · Jeunesse | Toujours visible, non repliable, en haut de la colonne gauche |
| **Menu secondaire ☰** | Accès aux fonctionnalités détaillées/annexes | Patrimoine de l'Église, GPS & Paroisses, Services, Bible Center, Académie, Dons, etc. | Groupes accordéon repliables, sous la navigation principale |

### Deux pages à ne jamais fusionner

| | Accueil (`/accueil`) | Social (`/social`) |
|---|---|---|
| Statuts / stories | Non | Oui |
| Cele Vibes (réels) | Non | Oui |
| Auteurs des publications | Administration / comptes officiels uniquement | Tous les membres + comptes officiels |
| Thème de la semaine | Oui | Non |
| Onglets Actualités/Annonces/Réformes | Oui | Non (fil continu simple) |

### Structure visuelle de référence (toutes pages internes)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (logo, recherche, icônes Accueil/Discussions/Notif/Profil) │
├───────────────┬─────────────────────────────┬─────────────────────┤
│ NAV PRINCIPALE │                             │                     │
│  Accueil       │                             │  ACCÈS RAPIDES      │
│  Social        │      CONTENU DE LA PAGE     │  Live TV            │
│  Documents     │         (colonne centrale)  │  Radio              │
│  Cantiques     │                             │  Agenda             │
│  Jeunesse      │                             │  Streaming          │
│ ────────────── │                             │  Carte paroisses    │
│ MENU ☰         │                             │  Discussions        │
│  (accordéons)  │                             │  Événements         │
│                │                             │  Bible complète     │
└───────────────┴─────────────────────────────┴─────────────────────┘
```

- Colonne gauche : ~280px fixe, sticky
- Colonne centrale : fluide, max ~680px
- Colonne droite : ~320px fixe, sticky

---

## 2. Design system (tokens)

### Couleurs

| Variable | Valeur | Usage |
|---|---|---|
| `--color-primary` | `#0E8C7E` | Couleur d'accent principale (boutons, liens actifs) |
| `--color-primary-hover` | `#0A6B60` | Survol des éléments teal |
| `--color-primary-dark` | `#075C51` | Titres, état actif, dégradés |
| `--color-surface-tint` | `#EAF7F1` | Fond menthe clair (états actifs, cartes mises en avant) |
| `--color-surface-tint-2` | `#DCF0E8` | Fond menthe un ton plus soutenu |
| `--color-surface` | `#FFFFFF` | Fond des cartes |
| `--color-bg-app` | `#F0F2F5` | Fond général de l'application |
| `--color-text` | `#1C2B28` | Texte principal |
| `--color-text-muted` | `#5B6B67` | Texte secondaire, légendes |
| `--color-border` | `#E2E6E4` | Bordures |
| `--color-danger` | `#E24C4C` | Erreurs, suppression |
| `--color-warning` | `#E8A93A` | Avertissements |
| `--gradient-logo` | arc-en-ciel (rouge→orange→jaune→vert→bleu→indigo→violet) | Halo du logo CélèOne |

**Règle absolue :** jamais le bleu Facebook (`#1877F2`) ni le vert WhatsApp (`#25D366`) dans
l'UI finale — seules leurs *dispositions* sont reprises comme référence structurelle.

### Typographie

| Token | Taille / poids | Usage |
|---|---|---|
| `--font-family-base` | Sans-serif système (Inter, Helvetica Neue, Arial) | Tout le texte |
| `--text-h1` | 24px / 700 | Titre de page |
| `--text-eyebrow` | 11px / 700, majuscules, letter-spacing 0.5px | Sur-titre (ex. "GPS & PAROISSES") |
| `--text-h2` | 16px / 700 | Titre de section |
| `--text-h3` | 14px / 600 | Sous-titre, nom dans une carte |
| `--text-body` | 14px / 400, line-height 1.5 | Corps de texte |
| `--text-meta` | 12px / 400 | Horodatage, légendes |
| `--text-button` | 14px / 600 | Libellé de bouton |

### Espacement (grille 4/8px)

`--space-xs: 4px` · `--space-sm: 8px` · `--space-md: 12px` · `--space-lg: 16px` ·
`--space-xl: 24px` · `--space-2xl: 32px` · `--space-3xl: 48px`

### Rayons & ombres

| Token | Valeur | Usage |
|---|---|---|
| `--radius-sm` | 8px | Champs de formulaire, petits boutons |
| `--radius-md` | 12px | Cartes standard |
| `--radius-lg` | 16px | Grandes cartes, modales |
| `--radius-pill` | 999px | Boutons d'action, barre de recherche, badges |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cartes au repos |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.08)` | Cartes survolées, menus déroulants, modales |

### Icônes

Style trait fin (outline), 20–24px, teal sur fond menthe clair, en cercle ou carré arrondi.
Bibliothèque suggérée : Lucide (ou équivalent outline cohérent).

### Breakpoints

| Token | Largeur | Comportement |
|---|---|---|
| `--bp-lg` | ≥ 1280px | 3 colonnes complètes |
| `--bp-md` | 992–1279px | Colonne droite masquable |
| `--bp-sm` | 768–991px | Menu secondaire en tiroir |
| `--bp-xs` | < 768px | Navigation principale en barre basse façon app mobile |

### Logo

Le logo CélèOne (un "C" teal encerclant un point, surmonté d'un arc-en-ciel) est utilisé :
dans le header, comme avatar par défaut des comptes officiels, en filigrane sur les écrans
de chargement et de connexion, et comme favicon.

---

## 3. Sitemap complet

```
/connexion
/inscription
/accueil                      — Accueil (annonces admin)
/social                       — Social (réseau communautaire)
/social/amis                  — Page Amis (accessible depuis le header en contexte Social)
/social/cele-vibes            — Liste complète des Cele Vibes (plein écran)
/social/profil                — Profil social de l'utilisateur courant
/social/profil/:userId        — Profil social public d'un autre membre
/documents                    /documents/:documentId
/cantiques                    /cantiques/:langue
                               /cantiques/:langue/:plage
                               /cantiques/:langue/:numero
/jeunesse                     /jeunesse/inscription
                               /jeunesse/resultats
                               /jeunesse/quiz
/discussions                  /discussions/:conversationId
/bible                        /bible/:livre
                               /bible/:livre/:chapitre
/streaming                    /streaming/:chaineId
                               /streaming/live/:videoId
/radio
/carte-paroisses
/agenda
/evenements
/notifications
/profil                       /profil/parametres/:section
/menu/patrimoine-eglise       /menu/patrimoine-eglise/histoire
                               /menu/patrimoine-eglise/biographie-fondateur
                               /menu/patrimoine-eglise/chronologie
                               /menu/patrimoine-eglise/expansion-mondiale
                               /menu/patrimoine-eglise/moments-cles
                               /menu/patrimoine-eglise/photos-archives
                               /menu/patrimoine-eglise/videos-historiques
/menu/gps-paroisses            (redirige vers /carte-paroisses + sous-items)
/menu/services-eglise
/menu/services-membres
/menu/academie
/menu/dons
/menu/outils-creatifs
/menu/progression-recompenses
/menu/urgences-alertes
/menu/integrations
/menu/compte-parametres        (redirige vers /profil/parametres)
```

---

## 4. Composants globaux partagés

### 4.1 — Header (toutes pages connectées)

Hauteur fixe ~56px, fond blanc, `box-shadow: var(--shadow-sm)`, sticky en haut. Le logo et la
barre de recherche (zones gauche et centre) sont **fixes et identiques sur toutes les pages**.
La zone de droite, en revanche, est **contextuelle** : son contenu change selon la section de
la navigation principale (§4.2) dans laquelle se trouve l'utilisateur — voir le détail complet
au §4.1bis juste après.

| Zone | Contenu | Bouton / élément | Action |
|---|---|---|---|
| Gauche | Logo CélèOne + nom | Logo cliquable | Navigue vers `/accueil` |
| Centre | Barre de recherche pill | Champ "Rechercher publications, pages, créateurs..." | Ouvre un panneau de résultats de recherche globale (membres, publications, documents, cantiques) |
| Droite | *(contextuel — voir §4.1bis)* | — | — |

### 4.1bis — Header contextuel selon la section active

La zone de droite du header n'est pas fixe : elle change de contenu selon l'item actif de la
**navigation principale** (§4.2). Une fois qu'on a basculé sur une variante, **toutes les
pages atteintes depuis cette variante conservent la même zone de droite** — elle ne revient
au variant par défaut que lorsqu'on quitte la section (ex. en cliquant sur "Accueil" dans la
navigation principale).

**Variante par défaut — section "Accueil" active**

| Icône | Action |
|---|---|
| 🏠 Accueil | Navigue vers `/accueil` |
| 💬 Discussions | Navigue vers `/discussions` |
| 🔔 Notifications (badge rouge) | Ouvre le panneau déroulant de notifications (§18) |
| Avatar Profil | Ouvre le menu déroulant : Voir le profil, Paramètres, Se déconnecter |

**Variante Social — section "Social" active**

Dès qu'on clique sur **Social** dans la navigation principale (colonne gauche), la zone de
droite du header bascule sur ce jeu d'icônes, et le reste ainsi pour toute page ouverte
depuis l'un de ces boutons (Amis, Discussions, Cele Vibes, Profil social) :

| Icône | Libellé | Action |
|---|---|---|
| 🏠 | Accueil | Navigue vers `/accueil` (et fait sortir du contexte Social : le header repasse en variante par défaut) |
| 👥 | **Amis** | Navigue vers `/social/amis` (§7.4) |
| 💬 | Discussions | Navigue vers `/discussions` (le header reste en variante Social tant qu'on est arrivé depuis Social) |
| 🎬 | **Cele Vibes** | Navigue vers `/social/cele-vibes`, la liste complète des Cele Vibes en plein écran (§7.2) |
| Avatar | **Profil social** | Navigue vers `/social/profil` (§7.5) — distinct du profil de compte/paramètres (§19) |

La barre de recherche centrale reste affichée et se comporte normalement (recherche globale)
dans cette variante.

**Variante réduite — sections "Documents" ou "Cantiques" actives**

Sur ces deux sections, la zone de droite se simplifie à deux icônes seulement :

| Icône | Action |
|---|---|
| 🔔 Notifications | Ouvre le panneau déroulant de notifications (§18) |
| ⚙ Paramètres | Navigue vers `/profil/parametres` (§19.3) |

> **Non précisé pour l'instant :** le comportement du header sur la section "Jeunesse" n'a
> pas été spécifié par le client — utiliser la variante par défaut en attendant confirmation
> (voir §24, ce qui reste à clarifier).

### 4.2 — Navigation principale (colonne gauche, bloc du haut)

Non scrollable, toujours visible, 5 items sur une colonne :

| Icône | Libellé | Route | Bouton actif = |
|---|---|---|---|
| Logo CélèOne (rond) | **Accueil** | `/accueil` | Fond `--color-surface-tint`, texte/icône `--color-primary-dark`, gras |
| Planète/globe | **Social** | `/social` | idem |
| Feuille de document | **Documents** | `/documents` | idem |
| Note de musique | **Cantiques** | `/cantiques` | idem |
| Feuille/plante | **Jeunesse** | `/jeunesse` | idem |

Comportement : clic = navigation immédiate (pas de sous-menu déroulant sur ces 5 items).

### 4.3 — Menu secondaire ☰ (colonne gauche, bloc du bas)

Sous la navigation principale. Liste de groupes accordéon (détail complet au §20).
Chaque groupe :

- **Fermé** : libellé + badge compteur (nombre de sous-items) + chevron `▾`
- **Clic sur l'en-tête** : déplie/replie le groupe (chevron devient `▴`), un seul groupe
  ouvert à la fois ou plusieurs — à définir selon préférence (recommandé : plusieurs
  ouverts possible, comme sur mobile)
- **Clic sur un sous-item** : navigue vers sa route dédiée

En tête de ce menu, 4 raccourcis toujours visibles (pas dans un accordéon) :
Carte des paroisses (GPS), Programmes hebdomadaires, Paramètres du compte, Live TV.

### 4.4 — Colonne de droite : accès rapides

Visible sur toutes les pages internes (sauf écrans plein format : connexion, messagerie,
radio, streaming — voir pages concernées).

| Bouton | Icône | Action |
|---|---|---|
| Live TV | Écran/lecture | Navigue vers `/streaming` |
| Radio | Ondes | Navigue vers `/radio` |
| Agenda | Calendrier "31" | Navigue vers `/agenda` |
| Streaming | Lecture ▶ | Navigue vers `/streaming` |
| Carte des paroisses | Carte pliée | Navigue vers `/carte-paroisses` |
| Discussions | Bulle de dialogue | Navigue vers `/discussions` |
| Événements | Calendrier coché | Navigue vers `/evenements` |
| Bible complète | Livre ouvert | Navigue vers `/bible` |

Sous ces 8 boutons : widget "Demandes d'amis" (boutons **Confirmer** / **Supprimer** par
demande) et widget "Contacts en ligne" (liste de membres, clic → ouvre `/discussions/:id`
avec ce contact).

### 4.5 — Composants UI de base et leurs états

| Composant | Description | États à gérer |
|---|---|---|
| Bouton plein (pill) | Fond `--color-primary`, texte blanc, `--radius-pill` | défaut / survol (`--color-primary-hover`) / actif (`--color-primary-dark`) / désactivé (opacité 45%, curseur not-allowed) / chargement (spinner + libellé modifié) |
| Bouton contour (pill) | Fond blanc, bordure teal 1.5px | mêmes états, fond devient `--color-surface-tint` au survol |
| Bouton fantôme (pill) | Fond gris clair `#F0F2F1` | survol : fond légèrement plus foncé |
| Carte cliquable | Fond blanc, `--shadow-sm`, `--radius-md` | survol (`--shadow-md` + légère élévation) / actif (fond `--color-surface-tint`) |
| Champ de formulaire | Bordure `--color-border`, `--radius-sm` | focus (bordure teal + anneau 2px) / erreur (bordure `--color-danger` + message sous le champ) / désactivé (fond gris, texte grisé) |
| Pastille numérotée | Cercle menthe avec numéro | sélectionnée (fond teal plein, texte blanc) |
| Bouton flottant | Cercle teal, icône seule, coin bas droit | survol (ombre plus marquée) |
| Toggle (switch) | Utilisé pour "Notifications" dans Profil | on (fond teal) / off (fond gris) |
| État vide | Texte centré discret, ex. "Aucun programme pour le moment." | — |
| État chargement | Squelette (skeleton) gris animé, forme de la carte finale | — |

---

## 5. Connexion & Inscription

Écran plein page, sans header ni menu (utilisateur non connecté). Structure calquée sur
l'écran de connexion Facebook Web : panneau gauche promotionnel, panneau droit fonctionnel.

### 5.1 — Écran d'entrée (`/connexion`)

**Panneau gauche (~52%)** : fond dégradé teal (`--color-primary-dark` → `--color-primary`),
collage de captures d'écran de l'app (Cantiques, Bible, Live TV) dans des cadres arrondis,
accroche en gros texte blanc gras : *"Restez connecté à votre famille en Christ."*

**Panneau droit (~48%)** :

| Élément | Comportement |
|---|---|
| Titre "Se connecter à CélèOne" + icône ⚙ | L'icône ouvre les réglages de langue/région |
| Liste des profils mémorisés (avatar + nom) | Clic → va directement à l'étape mot de passe (le champ identifiant est pré-rempli) |
| Bouton **Utiliser un autre profil** | Ouvre le formulaire de connexion complet (§5.2) |
| Bouton **Créer un nouveau compte** | Ouvre le formulaire d'inscription (§5.3) |
| Pied de page : logo + langues | Sélecteur de langue (Français, English, Yoruba, Goun, Plus de langues…) |

Si aucun profil n'est mémorisé (premier accès), le formulaire de connexion (§5.2) s'affiche
directement à la place de la liste de profils.

### 5.2 — Formulaire de connexion

| Champ | Type | Règle de validation |
|---|---|---|
| Email ou numéro de téléphone | texte | Requis, format email *ou* numéro valide |
| Mot de passe | mot de passe (avec icône œil afficher/masquer) | Requis, min. 8 caractères |

| Bouton | Action |
|---|---|
| **Se connecter** (plein) | Valide le formulaire → état chargement ("Connexion...") → succès : redirige vers `/accueil` ; échec : message d'erreur sous le champ concerné |
| Lien "Mot de passe oublié ?" | Ouvre le flux de réinitialisation (saisie email/téléphone → envoi de code → nouveau mot de passe) |
| **Créer un compte CélèOne** (contour) | Ouvre le formulaire d'inscription (§5.3) |

### 5.3 — Formulaire d'inscription

| Champ | Type | Requis |
|---|---|---|
| Prénom | texte | Oui |
| Nom | texte | Oui |
| Email ou numéro de téléphone | email/tel | Oui |
| Nom de la paroisse | texte avec autocomplétion | Non |
| Mot de passe | mot de passe | Oui |
| Confirmer le mot de passe | mot de passe | Oui (doit correspondre) |

| Bouton | Action |
|---|---|
| **Créer mon compte** (plein) | Valide → crée le compte → redirige vers `/accueil` avec message de bienvenue |
| Lien "J'ai déjà un compte" | Retour au formulaire de connexion (§5.2) |

---

## 6. Page Accueil

**Route :** `/accueil` — page par défaut après connexion.

**Contenu strict (rien d'autre) :**

1. **Barre d'onglets** : Actualités (actif par défaut) · Annonces · Réformes · Réactions ·
   Calendrier/Agenda — chaque onglet filtre le fil ci-dessous par type de contenu
2. **Carte "Thème de la semaine"** : icône livre, titre du thème, jour, référence biblique,
   flèche → ouvre le détail du thème en page/modale
3. **Fil des annonces et publications de l'administration uniquement** (Admin Cèlè One,
   Cèlè One TV, etc.)

### Carte de publication — boutons

| Bouton | Icône | Action |
|---|---|---|
| J'aime | 👍 | Bascule l'état "aimé" (toggle), incrémente/décrémente le compteur |
| Commenter | 💬 | Ouvre/déplie la zone de commentaires sous la publication |
| Partager | ↗ | Ouvre le menu de partage (Partager sur Social, Envoyer en message, Copier le lien) |
| Enregistrer | 🔖 | Bascule l'état "enregistré" (toggle), ajoute/retire des favoris |
| Chevron ">" (cartes news compactes) | — | Ouvre le détail complet de la publication |

### États

- Vide : si aucune publication admin, afficher "Aucune annonce pour le moment."
- Chargement : squelette de 2-3 cartes grises animées
- Scroll infini ou pagination (à préciser selon volumétrie attendue)

---

## 7. Page Social

**Route :** `/social` — accessible via l'item "Social" de la navigation principale.

### 7.1 — Ligne de statuts / stories

| Élément | Action |
|---|---|
| Vignette "Votre statut" (+ icône ajouter) | Ouvre le flux de création de statut (photo/vidéo/texte, durée 24h) |
| Vignettes des statuts des contacts | Clic → ouvre la visionneuse plein écran (navigation gauche/droite entre statuts, bouton répondre) |

### 7.2 — Bloc Cele Vibes (réels)

| Élément | Action |
|---|---|
| Vignette "Publier un Cele Vibe" | Ouvre le flux de création (upload ou enregistrement vidéo courte) |
| Vignettes de vidéos (avec compteur vues/réactions) | Clic → ouvre le lecteur Cele Vibes en plein écran avec défilement vertical (façon Reels/TikTok) |
| "Voir tout" | Navigue vers la liste complète des Cele Vibes |

### 7.3 — Fil de publications communautaires

Même composant "Carte de publication" que la page Accueil (§6), mais alimenté par les
publications de **tous les membres** (pas seulement l'admin).

| Bouton additionnel | Action |
|---|---|
| Bouton "Publier" en haut du fil (champ "Quoi de neuf aujourd'hui ?") | Ouvre le composeur de publication (texte, photo, vidéo, sondage) |
| Menu "..." sur une publication (si auteur = utilisateur courant) | Modifier / Supprimer / Épingler |
| Menu "..." sur une publication (autre auteur) | Signaler / Masquer / Copier le lien |

### 7.4 — Page Amis

**Route :** `/social/amis`, ouverte depuis l'icône **Amis** de la variante Social du header
(§4.1bis).

| Élément | Action |
|---|---|
| Onglets : Mes amis / Suggestions / Demandes reçues / Demandes envoyées | Bascule la liste affichée |
| Barre de recherche "Rechercher un ami" | Filtre la liste en temps réel |
| Carte ami (avatar, nom, nb d'amis en commun) | Clic → ouvre `/social/profil/:userId` (profil public de ce membre) |
| Bouton **Confirmer** / **Supprimer** (onglet Demandes reçues) | Accepte ou refuse la demande |
| Bouton **Annuler la demande** (onglet Demandes envoyées) | Retire la demande envoyée |
| Bouton **Ajouter** (onglet Suggestions) | Envoie une demande d'ami |
| Menu "..." sur un ami (onglet Mes amis) | Retirer cet ami, Bloquer |

**États :** liste vide par onglet → message dédié (ex. "Vous n'avez pas encore d'amis sur
CélèOne", "Aucune suggestion pour le moment").

### 7.5 — Page Profil social

**Route :** `/social/profil` (profil de l'utilisateur courant) et `/social/profil/:userId`
(profil public d'un autre membre). Distincte de `/profil` (§19), qui gère le compte et les
paramètres — ici, c'est la vitrine publique façon Facebook.

| Élément | Action |
|---|---|
| Bandeau/couverture + avatar | Bouton caméra sur chacun (si profil courant) → change la photo |
| Nom, paroisse, nb d'amis, nb de publications | — |
| Bouton **Modifier le profil** (si profil courant) | Navigue vers `/profil` (§19.2) |
| Bouton **Ajouter en ami** / **Demande envoyée** / **Message** (si profil d'un autre membre) | Envoie une demande d'ami, ou ouvre `/discussions/:conversationId` avec ce membre |
| Onglets : Publications / Cele Vibes / Photos / À propos | Filtre le contenu affiché sous le bandeau |
| Fil de publications de ce membre (onglet Publications) | Même composant "Carte de publication" que §7.3 |
| Grille de Cele Vibes de ce membre (onglet Cele Vibes) | Clic → lecteur plein écran (§7.2) |

**États :** profil sans publication/Cele Vibe/photo → message vide par onglet ; profil d'un
membre qui a restreint sa visibilité → affichage limité (nom, avatar, bouton Ajouter en ami
uniquement).

### États (page Social — §7.1 à §7.3)

- Vide (aucun statut) : la ligne de statuts n'affiche que "Votre statut"
- Vide (aucun Cele Vibe) : message "Aucun Cele Vibe pour le moment — soyez le premier à publier"
- Chargement : squelettes pour statuts (cercles gris) et publications (cartes grises)

---

## 8. Messagerie / Discussions

**Route :** `/discussions` et `/discussions/:conversationId`. Page plein format (header
conservé, colonnes gauche/droite masquées), disposition façon WhatsApp Web.

### 8.1 — Colonne de gauche (liste des discussions)

| Élément | Action |
|---|---|
| Barre de recherche "Rechercher ou démarrer une discussion" | Filtre la liste en temps réel |
| Onglets filtres : Toutes / Non lues (compteur) / Favoris | Filtre la liste de discussions |
| Onglets bas : Discussions / Vos appels / Personnes / Paramètres | Bascule la vue de la colonne gauche |
| Ligne de statuts en haut (avatars ronds, halo teal) | Mêmes statuts que la page Social (§7.1) ; clic → visionneuse |
| Bouton "+" (nouvelle discussion) | Ouvre le sélecteur de contact / création de groupe |
| Chaque item de discussion (avatar, nom, dernier message, heure) | Clic → ouvre la conversation dans la colonne de droite |
| Appui long / menu "..." sur un item | Épingler, Archiver, Marquer non lu, Supprimer, Ajouter aux favoris |

### 8.2 — Colonne de droite (conversation active)

| Élément | Action |
|---|---|
| En-tête (avatar + nom du contact/groupe) | Clic → ouvre les infos du contact/groupe |
| Icônes en-tête : Appel audio / Appel vidéo / Recherche dans la conversation / Menu "..." | Lancent l'action correspondante |
| Zone de bulles de messages | Affiche l'historique, scroll auto en bas à l'arrivée |
| Bulle de message : appui long/clic droit | Répondre, Transférer, Copier, Supprimer, Réagir (emoji) |
| Champ "Écrivez un message..." | Saisie texte |
| Icône trombone (pièce jointe) | Ouvre le choix : Photo/Vidéo, Document, Audio |
| Icône micro | Enregistrement vocal (maintenir pour enregistrer) |
| Bouton envoyer | Envoie le message, vide le champ |

### États

- Aucune conversation sélectionnée (desktop large) : état vide au centre avec logo CélèOne
  et texte "Sélectionnez une discussion pour commencer"
- Liste vide : "Aucune discussion pour le moment"
- Message en cours d'envoi : icône horloge sur la bulle, remplacée par un check une fois envoyé

---

## 9. Page Documents

**Route :** `/documents` et `/documents/:documentId`.

| Élément | Action |
|---|---|
| Titre "Documents" + compteur ("x/x documents") | — |
| Barre de recherche "Rechercher des documents..." | Filtre en temps réel |
| Filtres (pastilles : Tous, par catégorie — Essentiels, Doctrines, etc.) | Filtre la grille de cartes |
| Carte document (icône, titre, badges de catégorie, extrait) | Clic ou bouton **Ouvrir** → navigue vers `/documents/:documentId` |

### Page détail d'un document (`/documents/:documentId`)

| Élément | Action |
|---|---|
| Bouton retour | Retour à `/documents` |
| Contenu du document (texte structuré, éventuellement sections) | Lecture seule |
| Bouton Partager | Ouvre le menu de partage |
| Bouton Télécharger (si applicable, ex. PDF source) | Télécharge le fichier |

### États

- Vide : "Aucun document disponible pour le moment"
- Grille responsive 2-3 colonnes selon largeur d'écran

---

## 10. Page Cantiques

**Route :** `/cantiques` → `/cantiques/:langue` → `/cantiques/:langue/:plage` →
`/cantiques/:langue/:numero`. Navigation à 4 niveaux.

### Niveau 1 — Choix de la langue (`/cantiques`)

| Élément | Action |
|---|---|
| Titre "Cantiques" + compteur de livres | — |
| Recherche "Rechercher des cantiques..." (par langue, numéro, titre ou texte) | Recherche globale cross-langue, résultats en liste |
| Carte par langue (Goun, Yoruba, Français, Anglais) + badge + bouton **Ouvrir** | Navigue vers `/cantiques/:langue` |

### Niveau 2 — Plages de numéros (`/cantiques/:langue`)

| Élément | Action |
|---|---|
| Titre "Cantiques (langue)" + nombre total | — |
| Recherche + filtre langue + bouton "Vue grille" | Bascule entre vue par plages et vue grille complète |
| Liste de plages en accordéon (1-42, 43-84, ...) | Clic → déplie la plage en grille de numéros (reste sur la même page) ou navigue vers `/cantiques/:langue/:plage` |

### Niveau 3 — Grille de numéros (dans la plage dépliée)

| Élément | Action |
|---|---|
| Grille de pastilles numérotées (5 colonnes) | Clic sur un numéro → navigue vers `/cantiques/:langue/:numero` |
| Bouton flottant langue (ex. "FR") | Ouvre le sélecteur de langue, change la langue affichée sans perdre le numéro courant si équivalent existe |

### Niveau 4 — Détail d'un cantique (`/cantiques/:langue/:numero`)

| Élément | Action |
|---|---|
| Numéro + titre + badge langue + tonalité | — |
| Bouton **Audio** | Lance la lecture dans le mini-lecteur persistant (bas d'écran), permet de continuer à naviguer pendant l'écoute |
| Bouton **Copier** | Copie les paroles dans le presse-papier |
| Bouton **Partager** | Ouvre le menu de partage |
| Bouton **Partition** | Ouvre/télécharge la partition si disponible |
| Paroles (texte centré) | Lecture seule, défilement synchronisé avec l'audio si possible |
| Boutons précédent/suivant (bas) | Navigue vers le cantique précédent/suivant de la même langue |

### États

- Recherche sans résultat : "Aucun cantique ne correspond à votre recherche"
- Mini-lecteur persistant : barre fixe en bas (play/pause, titre, progression, fermer)

---

## 11. Page Jeunesse

**Route :** `/jeunesse`, avec sous-sections.

| Élément | Action |
|---|---|
| En-tête : titre "Jeunesse", sous-titre "Enfants & Jeunes", sélecteur d'année (ex. "2026") | Change l'année affichée pour le concours/calendrier |
| Onglets : Home / Results / Quiz / Reg(istration) | Bascule la vue de la page |
| Champ "Entrez l'identifiant (ex: EAJ-XX...)" + bouton recherche | Recherche un candidat/participant par identifiant |
| Boutons raccourcis : Résultats / Quiz / Inscription | Équivalents aux onglets, accès direct |
| Bloc "Calendrier du concours" : cartes de phase (Préliminaire, Présélection, ...) avec dates et nombre de candidats | Bouton icône "candidats" sur chaque carte → ouvre la liste des candidats de cette phase (si disponible) |

### Sous-page Inscription (`/jeunesse/inscription`)

Formulaire d'inscription au concours/programme Jeunesse — champs à confirmer avec une
capture de cet écran (non disponible actuellement). Prévoir a minima : nom, prénom, âge,
paroisse, catégorie, bouton **S'inscrire**.

### Sous-page Résultats (`/jeunesse/resultats`)

Liste ou classement des résultats par phase, filtrable par identifiant ou nom.

### Sous-page Quiz (`/jeunesse/quiz`)

Interface de quiz (question, choix multiples, score) — détail à confirmer.

### États

- Recherche d'identifiant sans résultat : "Aucun candidat trouvé pour cet identifiant"

---

## 12. Page Bible complète (Bible Center)

**Route :** `/bible` → `/bible/:livre` → `/bible/:livre/:chapitre`.

### Niveau 1 — Liste des livres (`/bible`)

| Élément | Action |
|---|---|
| Titre "Bible Center" + langue courante | — |
| Recherche "Rechercher un livre" | Filtre la liste en temps réel |
| Filtres : Tout / Ancien / Nouveau (Testament) | Filtre la liste |
| Carte livre (numéro, nom, testament, nb chapitres, bouton **Ouvrir**) | Navigue vers `/bible/:livre` |

### Niveau 2 — Grille des chapitres (`/bible/:livre`)

| Élément | Action |
|---|---|
| Bandeau teal (testament, nom du livre, nb chapitres) | — |
| Grille de pastilles numérotées | Clic → navigue vers `/bible/:livre/:chapitre` |
| Bouton flottant langue ("FR") | Change la langue de la Bible affichée |

### Niveau 3 — Lecture d'un chapitre (`/bible/:livre/:chapitre`)

| Élément | Action |
|---|---|
| Navigation chapitre précédent/suivant (flèches autour du numéro) | Change de chapitre dans le même livre (ou livre suivant/précédent si en bout) |
| Bouton **Marquer** | Ajoute/retire le chapitre ou la sélection de versets aux favoris |
| Bouton **Partager** | Ouvre le menu de partage |
| Compteur "X sélection" | Affiche le nombre de versets actuellement sélectionnés |
| Icône de partage individuelle par verset | Partage ce verset précis |
| Clic sur un numéro de verset | Sélectionne/désélectionne le verset (surlignage) |
| Fil d'ariane "Bible Center / Livre / Chapitre" (web uniquement) | Clic sur un maillon → retour au niveau correspondant |

### États

- Chapitre vide/indisponible dans une langue donnée : message explicite + proposition de changer de langue

---

## 13. Page Streaming / Live TV

**Route :** `/streaming`, `/streaming/:chaineId`, `/streaming/live/:videoId`.

### Sous-navigation (onglets horizontaux sticky)

Accueil · Explorer · Musique · Ma liste · Moi

| Élément | Action |
|---|---|
| Lecteur vidéo (centré, large, 16:9) | Lecture/pause au clic, contrôles standards (volume, plein écran, progression) |
| Icônes overlay (lecture / écran / discussion / réglages) | Options de lecture, mode théâtre, chat live, paramètres qualité |
| Badge "LIVE NOW" | Indique un direct en cours |
| Titre + compteur de vues | — |
| Bouton **S'abonner** | Bascule abonné/non-abonné à la chaîne |
| Barre d'actions : 👍 (like) / ⭐ (favoris) / ↗ (partager) / ⬇ (télécharger) / 🔖 (enregistrer) | Actions respectives, boutons à bascule (toggle) sauf partager/télécharger |
| Onglets Videos / Podcasts (page chaîne) | Filtre le contenu affiché de la chaîne |
| Bloc "Devenir créateur" | Ouvre le formulaire de demande d'approbation pour publier du contenu |
| Colonne droite : vidéos suggérées | Clic sur une suggestion → change la vidéo en lecture |

### États

- Lecture indisponible : message "Lecture en direct indisponible" + bouton **Réessayer**
- Aucune vidéo sur la chaîne : "Aucune vidéo pour le moment. Revenez plus tard."

---

## 14. Page Radio

**Route :** `/radio`. Page plein format centrée, minimaliste, sans colonne droite.

| Élément | Action |
|---|---|
| Logo CélèOne en grand cercle | — |
| Nom de la station + fréquence + statut ("96,5 MHz · Online") | — |
| Bouton volume (gauche) | Ouvre/ajuste le curseur de volume |
| Bouton Play/Pause (central, grand, sombre) | Bascule lecture/pause du flux audio en direct |
| Bouton partage-radio (droite) | Ouvre le menu de partage de la station |

### États

- Flux hors-ligne : badge "Offline" à la place de "Online", bouton Play désactivé

---

## 15. Page Carte des paroisses

**Route :** `/carte-paroisses`.

| Élément | Action |
|---|---|
| Sur-titre "GPS & PAROISSES" + titre "Carte des paroisses" | — |
| Bouton retour | Navigue vers la page précédente |
| Bouton "cibler ma position" | Recentre la carte sur la position actuelle de l'utilisateur |
| Barre de recherche "Rechercher une paroisse..." | Filtre les marqueurs sur la carte + liste |
| Modale d'onboarding (première visite, 5 étapes) : icône, "x/5", titre, texte, boutons **Ignorer** / **Suivant** | Ignorer ferme la modale ; Suivant passe à l'étape suivante ; à la dernière étape, le bouton devient **Terminer** |
| Barre d'actions basse : **Départ** / **Paroisse** / **Trajet** / **Agenda** | Départ = définir le point de départ ; Paroisse = sélectionner une paroisse cible ; Trajet = calcule et affiche l'itinéraire ; Agenda = navigue vers `/agenda` filtré sur cette paroisse |
| Marqueur de paroisse sur la carte | Clic → ouvre une fiche paroisse (nom, adresse, horaires, bouton Itinéraire) |

### États

- Géolocalisation refusée : la carte reste utilisable via la recherche manuelle, bannière
  discrète proposant de réessayer l'autorisation

---

## 16. Page Agenda

**Route :** `/agenda`.

| Élément | Action |
|---|---|
| Sur-titre "RAPPELS & VOYAGES" + titre "Agenda Cele One" | — |
| Icône carte (haut droite) | Navigue vers `/carte-paroisses` |
| Carte "Créer une alerte" (texte d'aide) + bouton **+ Nouvelle alerte** | Ouvre le formulaire de création d'alerte (type : Service d'Église / circuit / visite de fête / rappel personnel, date, heure, répétition, lieu optionnel) |
| Liste des alertes/programmes | Chaque item cliquable → ouvre le détail, avec options Modifier / Supprimer |

### États

- Vide : "Aucun programme pour le moment."

---

## 17. Page Événements

**Route :** `/evenements`.

| Élément | Action |
|---|---|
| Titre "Événements" + sous-texte "Programmes et rendez-vous importants." | — |
| Liste de cartes d'événements à venir (quand disponibles) : titre, date, lieu, bouton **Détails** | Clic → ouvre le détail de l'événement (description complète, bouton "Ajouter à l'agenda" qui crée une alerte dans `/agenda`) |

### États

- Vide : icône calendrier centrée + titre + sous-texte, identique à l'écran mobile observé

---

## 18. Page Notifications

**Route :** `/notifications`, accessible aussi en panneau déroulant depuis l'icône 🔔 du header.

| Élément | Action |
|---|---|
| Titre "Notifications" + sous-texte "Tout est à jour" | — |
| Bouton **Marquer lu** | Marque toutes les notifications comme lues |
| Icône corbeille globale | Supprime toutes les notifications (avec confirmation) |
| Filtres pastilles : All / Social / Posts / ... (avec compteurs) | Filtre la liste par catégorie |
| Icône corbeille individuelle (par notification) | Supprime cette notification (avec confirmation ou undo furtif) |
| Lien d'action (ex. "Open social") | Navigue vers la page/élément concerné (ex. `/social`, une conversation, une publication) |
| Clic sur la notification elle-même | Même action que le lien d'action, + marque comme lue |

### États

- Vide : "Aucune notification pour le moment"
- Panneau déroulant (header) : affiche les 5-10 dernières, avec lien "Tout voir" → `/notifications`

---

## 19. Profil & Paramètres

**Route :** `/profil`, `/profil/parametres/:section`.

### 19.1 — Page Profil

| Élément | Action |
|---|---|
| Bandeau teal : bouton retour + titre + logo | Bouton retour → page précédente |
| Avatar avec bouton caméra | Ouvre le sélecteur de fichier pour changer la photo |
| Nom complet + email (lecture seule ici) | — |
| Bouton "Manage subscription" | Navigue vers `/profil/parametres/abonnement` |

### 19.2 — Formulaire "Informations personnelles"

| Champ | Type |
|---|---|
| Prénom | texte |
| Nom | texte |
| Nom de la paroisse | texte avec autocomplétion |
| Numéro de téléphone | texte/tel |

Bouton **Enregistrer** (plein, teal) en bas du formulaire — valide et sauvegarde les
modifications, affiche une confirmation brève ("Profil mis à jour").

### 19.3 — Sous-menu Paramètres (navigation verticale à gauche de cette section)

| Section | Contenu |
|---|---|
| Profil | Formulaire §19.2 |
| Notification | Liste de toggles (on/off) par type de notification |
| Audio & Video | Réglages qualité audio/vidéo par défaut |
| Playback | Réglages de lecture (vitesse, autoplay) |
| Data Saver & Storage | Options d'économie de données, gestion du cache |
| Security | Changement de mot de passe, sessions actives, déconnexion à distance |
| Abonnement | Détail de l'abonnement, moyens de paiement |

### 19.4 — Bloc "Find skilled workers"

| Élément | Action |
|---|---|
| Champ "Search by name, skill or profession" | Recherche parmi les prestataires vérifiés |
| Carte prestataire ("Verified professional · X years") + bouton **Contact admin** | Envoie une demande de mise en relation à l'administration |

### États

- Formulaire avec erreurs : messages sous les champs concernés, bouton Enregistrer désactivé tant que les champs requis ne sont pas valides

---

## 20. Menu secondaire ☰ — détail de tous les groupes

Chaque groupe suit le même pattern : **liste d'items → clic sur un item → page de détail**.
Pour les groupes dont le contenu précis n'a pas encore été capturé dans l'app mobile, le
pattern générique ci-dessous s'applique (à ajuster une fois les captures disponibles) :

> **Pattern générique de sous-page :** titre de la section, fil d'ariane, contenu (texte,
> liste ou grille selon la nature), bouton retour. Si la page liste des éléments : barre de
> recherche optionnelle + cartes cliquables vers le détail.

### Patrimoine de l'Église `/menu/patrimoine-eglise` (7 items)

| Item | Route | Contenu |
|---|---|---|
| Histoire de l'Église | `/menu/patrimoine-eglise/histoire` | Article long, lecture seule |
| Biographie du fondateur | `/menu/patrimoine-eglise/biographie-fondateur` | Article + photo |
| Chronologie historique | `/menu/patrimoine-eglise/chronologie` | Frise chronologique interactive (clic sur une date → détail de l'événement) |
| Expansion mondiale | `/menu/patrimoine-eglise/expansion-mondiale` | Carte du monde ou liste de pays/régions |
| Moments clés | `/menu/patrimoine-eglise/moments-cles` | Liste de cartes événements marquants |
| Photos d'archives | `/menu/patrimoine-eglise/photos-archives` | Galerie photo (grille, clic → visionneuse plein écran) |
| Vidéos historiques | `/menu/patrimoine-eglise/videos-historiques` | Liste de vidéos (même lecteur que §13) |

### GPS & Paroisses `/menu/gps-paroisses` (5 items)

Raccourci principal → `/carte-paroisses` (§15). Les 4 autres sous-items (annuaire des
paroisses, trajet, agenda lié, etc.) restent à confirmer avec de nouvelles captures — en
l'état, prévoir au minimum un **Annuaire des paroisses** (liste alphabétique/recherche,
clic → fiche paroisse avec adresse, responsable, horaires de culte, bouton Itinéraire).

### Services de l'Église `/menu/services-eglise` (7 items)

Contenu détaillé non capturé — pattern générique à appliquer (liste de services, chacun
avec description et éventuel contact/formulaire de demande).

### Services membres `/menu/services-membres` (3 items)

Idem — probablement : carte de membre numérique, attestations, annuaire des membres.

### Bible Center `/bible` (2 items)

Renvoie vers la Bible complète (§12). Les Cantiques, historiquement listés ici, sont
désormais accessibles directement via la navigation principale (§10) et n'apparaissent
plus comme sous-item de ce groupe.

### Calendrier de l'Église (5 items)

Regroupe Agenda (§16) et Événements (§17), plus potentiellement : calendrier liturgique,
jours de jeûne/fête — à confirmer.

### Musique (sans sous-groupe visible)

Probablement un raccourci vers Cantiques (§10) ou une bibliothèque musicale plus large
(chants additionnels, albums) — à confirmer avec capture.

### Community (1 item)

Raccourci direct vers `/social` (§7) — pas de sous-page propre.

### Cele One Academy `/menu/academie` (7 items)

Formations/cours en ligne — pattern générique : liste de cours (carte : titre, image,
progression), clic → page de cours avec modules/leçons séquentiels, bouton "Continuer"/
"Commencer".

### Donations & contributions `/menu/dons` (3 items)

| Item probable | Contenu |
|---|---|
| Faire un don | Formulaire : montant, type de don (dîme, offrande, projet spécial), moyen de paiement, bouton **Confirmer le don** |
| Historique de mes dons | Liste chronologique des dons effectués par l'utilisateur |
| Projets à soutenir | Liste de projets/campagnes avec barre de progression de collecte |

### Creative tools `/menu/outils-creatifs` (7 items)

Outils de création de contenu pour publications/Cele Vibes — pattern générique (liste
d'outils, chacun ouvrant un éditeur dédié). Détail à confirmer.

### Progression & rewards `/menu/progression-recompenses` (4 items)

Lié aux concours Jeunesse (§11) et à un système de badges/points — pattern générique
(tableau de bord avec score, badges obtenus, classement).

### Emergencies & alerts `/menu/urgences-alertes` (4 items)

Alertes d'urgence (sécurité, santé, intempéries) diffusées par l'administration — pattern
générique (liste d'alertes actives, bouton pour signaler une urgence si fonctionnalité
communautaire).

### Integrations `/menu/integrations` (3 items)

Connexions à des services tiers (ex. calendrier externe, réseaux sociaux externes pour
partage) — pattern générique (liste de services avec bouton Connecter/Déconnecter).

### Account & Settings `/menu/compte-parametres` (4 items)

Redirige vers `/profil/parametres` (§19.3).

> **Important :** les groupes sans capture précise ne doivent pas recevoir de contenu
> inventé en dur. Implémenter la page avec le pattern générique ci-dessus et des données
> dynamiques (vides par défaut), afin que le contenu réel puisse être branché dès qu'il est
> confirmé, sans retravailler la structure.

---

## 21. États transverses (à appliquer partout)

| État | Traitement visuel |
|---|---|
| Chargement d'une liste | Squelettes gris animés reprenant la forme des cartes finales |
| Liste/contenu vide | Message centré, discret, en `--color-text-muted`, parfois avec une icône |
| Erreur réseau | Bannière ou carte avec message + bouton **Réessayer** |
| Action en cours (bouton) | Spinner inline + libellé modifié (ex. "Envoi..."), bouton désactivé |
| Succès d'une action | Confirmation brève (toast ou message inline), disparaît après quelques secondes |
| Élément désactivé | Opacité réduite, curseur `not-allowed`, pas d'effet de survol |
| Focus clavier (accessibilité) | Anneau de focus visible (2px, couleur teal) sur tout élément interactif |

---

## 22. Responsive

| Largeur | Comportement |
|---|---|
| Desktop large (> 1280px) | 3 colonnes complètes |
| Desktop / tablette (992–1280px) | Colonne de droite masquée par défaut, accessible via une icône dédiée dans le header |
| Tablette / petit desktop (768–991px) | Menu secondaire ☰ en tiroir (drawer), ouvert via un bouton dédié |
| Mobile web (< 768px) | Navigation principale redescend en barre fixe basse (comme l'app mobile native) ; menu secondaire en tiroir plein écran ; écran de connexion en une seule colonne (panneau promotionnel masqué) |

---

## 23. Ordre de construction recommandé

1. Design tokens (§2) → variables CSS/thème global
2. Composants de base et leurs états (§4.5)
3. Header (§4.1) + structure 3 colonnes (vue d'ensemble §1)
4. Connexion & Inscription (§5)
5. Navigation principale (§4.2) + menu secondaire (§4.3, détail §20)
6. Page Accueil (§6)
7. Page Social (§7)
8. Colonne de droite des accès rapides (§4.4)
9. Messagerie (§8)
10. Documents (§9), Cantiques (§10), Jeunesse (§11) — accessibles depuis la navigation principale
11. Bible complète (§12)
12. Streaming (§13), Radio (§14)
13. Carte des paroisses (§15), Agenda (§16), Événements (§17)
14. Notifications (§18), Profil & Paramètres (§19)
15. Sous-pages du menu secondaire (§20), en commençant par celles dont le contenu est confirmé (Patrimoine de l'Église)
16. Responsive (§22) sur l'ensemble
17. Passes d'accessibilité et de polish final

---

## 24. Ce qui reste à clarifier

Pour fiabiliser totalement l'implémentation, les captures suivantes manquent encore et
sont nécessaires pour remplacer les patterns génériques par le contenu réel :

- Détail des sous-pages : Services de l'Église, Services membres, Cele One Academy,
  Donations & contributions, Creative tools, Progression & rewards, Emergencies & alerts,
  Integrations
- Écrans Jeunesse : Inscription, Résultats, Quiz
- Annuaire des paroisses (sous-item de GPS & Paroisses)
- Flux de création de statut et de Cele Vibe (écrans de composition)
- Flux de don (formulaire complet)
- Écran de réinitialisation de mot de passe
- Comportement du header (zone de droite) sur la section "Jeunesse" — non précisé, variante
  par défaut utilisée en attendant (voir §4.1bis)
- Contenu détaillé des onglets Suggestions/Demandes de la page Amis (§7.4) et de l'onglet
  "À propos" du Profil social (§7.5), au-delà du pattern générique proposé

Tant que ces captures ne sont pas fournies, les pages correspondantes doivent être
construites avec le pattern générique du §20 plutôt qu'avec du contenu inventé.

---

*CélèOne Web — Dossier de conception complet — Document de travail, à mettre à jour au fur
et à mesure des captures et décisions complémentaires.*
