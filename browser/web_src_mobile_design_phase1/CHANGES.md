# Web → mobile design, phase 1

## Changed
- `src/index.css`: every design token (brand, mint, ink, line, canvas, surface, dark mode, rainbow) retuned to the mobile palette
  (teal #2FA5A9 / dark teal #0B565A / deep #061D20, ink #101828, rainbow FF3B5C…9B5CFF). Variable names are unchanged, so all existing pages re-skin automatically. `.card` radius is now 20px.
- 17 files: hardcoded greens and the old rainbow replaced by the mobile values (`#0a6b60 → #0B565A`, `#0e8c7e → #1D8A8F`, `#14a394 → #2FA5A9`, rainbow stops), `lib/theme.ts` browser colours.
- `src/App.tsx`: `/live/:liveId` now uses `LiveRoute` (social live if the id is a live session, otherwise the old streaming player).
- `src/pages/home/HomePage.tsx`: `<LiveRail />` above the weekly-theme card.

## New
- `src/services/socialLive.ts`: `GET https://live.celeonetv.com/api/social/live/active` (public, 5 s polling, same filtering/sorting as the app),
  live comments read from `/v1/resources/social_live_sessions/{id}/comments`, comment write.
- `src/components/live/LiveRail.tsx`: home "En direct" rail (rainbow-ring vertical cards, as LiveDiscoveryRail).
- `src/pages/social/LiveViewerPage.tsx`: full-screen viewer like LiveViewerModal: HLS (hls.js / native Safari), host pill with rainbow ring,
  viewers/comments/hearts chips, goal bar, pinned comment, last-5 comments overlay, hearts animation, paused/ended overlays,
  auto-retry every 2 s (12 max), share link `https://celeonetv.com/live/{id}`. Starts muted (browser autoplay rules).

## To verify on your side (not testable here)
1. Not built: no package.json / tailwind config / node_modules in the archive. Run `npm run build`.
2. `live.celeonetv.com` must send CORS headers for the web origin on `/api/social/live/active`.
3. Comment POST goes to `/v1/resources/social_live_sessions/{id}/comments`. The mobile app writes this via its Firestore layer, whose source
   (`src/backend/firestoreCompat`, `apiClient`) was not in the zip. If the API rejects it, only `postLiveComment()` needs changing.
4. Likes, joining as viewer (viewer count), and gifts are not wired on web: they are Firestore writes / `socialCoinsApi` in the app.
