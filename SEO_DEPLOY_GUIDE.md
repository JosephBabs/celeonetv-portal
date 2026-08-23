# Cèlè One Portal — React Routes SEO + Social Sharing Fix

## Root cause found

The portal is a Vite/React SPA using `createBrowserRouter`. It already contains route SEO logic in `src/lib/seo.ts` and edge meta injection in `src/worker.ts`.

The critical Cloudflare configuration problem was in `wrangler.jsonc`:

```jsonc
"assets": {
  "directory": "./dist",
  "not_found_handling": "single-page-application"
}
```

There was no `binding: "ASSETS"` and no `run_worker_first`.

With Cloudflare Workers Static Assets, assets are served first by default. For SPA navigation fallbacks, Cloudflare can therefore return `index.html` before `src/worker.ts` gets a chance to inject route-specific `<title>`, canonical, Open Graph, Twitter and JSON-LD tags. That explains the common symptom where the homepage has a preview but React routes do not.

## What this patch changes

1. Adds `ASSETS` binding.
2. Runs the Worker first for HTML/app routes while bypassing Vite static bundles and common static files.
3. Keeps React Router/BrowswerRouter URLs unchanged.
4. Injects server-visible route content into the initial `#root` shell. React replaces that snapshot when it mounts.
5. Generates OG/Twitter metadata before JavaScript runs.
6. Fetches public Firestore content at the edge for:
   - `/posts/:id`
   - `/social/:id`
   - `/hymns/:id`
   - `/themes/:id`
   - `/weekly-themes/:id`
   - `/weekly-programs/:id`
   - `/videos/:id`
   - `/songs/:id`
7. Uses each item's title/description/image where available.
8. Returns real HTTP 404 for unknown portal URLs instead of a soft-404 200 page.

## Replace these files

- `wrangler.jsonc`
- `src/worker.ts`

No React Router route changes are required.

## Deploy

From the COMPLETE portal project (the uploaded ZIP does not contain `package.json`, `index.html`, or the imported `functions/` folder, so merge these two patched files into the full repository):

```bash
npm install
npm run build
npx wrangler deploy
```

If your normal deployment command is different, keep your normal build step, but ensure the deployed Worker uses this `wrangler.jsonc` and `src/worker.ts`.

## Verify after deployment

### Static route

```bash
curl -sL -A "facebookexternalhit/1.1" https://celeonetv.com/spiritual-program \
  | grep -E '<title>|og:title|og:description|og:image|canonical|data-celeone-seo-snapshot'
```

Expected: metadata for **ECC Spiritual Program and Weekly Theme**, not homepage metadata.

### Parish route

```bash
curl -sL -A "Googlebot" https://celeonetv.com/parishes \
  | grep -E '<title>|description|canonical|data-celeone-seo-snapshot'
```

### Dynamic share route

Replace `REAL_ID`:

```bash
curl -sL -A "facebookexternalhit/1.1" https://celeonetv.com/themes/REAL_ID \
  | grep -E '<title>|og:title|og:description|og:image|og:url'
```

The returned `og:title`, `og:description`, and `og:image` should come from the Firestore item whenever that collection/document is publicly readable.

## After verification

1. Cloudflare Dashboard → Caching → purge the old cached HTML if necessary.
2. Google Search Console → URL Inspection → test a route → Request indexing.
3. Resubmit `https://celeonetv.com/sitemap.xml`.
4. For an already-cached WhatsApp preview, test temporarily with `?v=2`, for example:
   `https://celeonetv.com/spiritual-program?v=2`
5. Facebook Sharing Debugger can be used to force a new scrape for Facebook/Meta cache.

## Important Firestore note

Dynamic edge previews use the Firestore REST endpoint without a user login. The relevant document must therefore be publicly readable under your Firestore rules. If it is intentionally private, the Worker will use the safe generic route preview instead of exposing the private document.

## Recommended next SEO step

Your static `sitemap.xml` already lists the main public portal pages. If you want every public post, weekly theme, hymn and video indexed automatically, the next step is a generated sitemap (or sitemap index) containing those dynamic IDs. The current patch fixes server-visible route HTML and social previews first; discovery of a very large dynamic catalog should then be handled by dynamic sitemaps/internal links.
