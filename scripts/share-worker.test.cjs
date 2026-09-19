const esbuild = require('esbuild');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const outfile = path.resolve('node_modules/.cache/share-worker-test.cjs');
  await esbuild.build({entryPoints: ['src/worker.ts'], outfile, bundle: true, platform: 'node', target: 'node20', format: 'cjs', loader: {'.wasm': 'binary'}, logLevel: 'silent'});
  const worker = require(outfile).default;
  const post = {id: 'reel-one', title: 'A reel', content: 'Public caption', videoUrl: 'https://media.example/video.mp4', thumbnailUrl: 'https://media.example/poster.jpg', createdAtMs: 1700000000000};
  const env = {ASSETS: {fetch: async () => new Response('<html><head></head><body><div id="root"></div></body></html>', {headers: {'Content-Type': 'text/html'}})}};
  global.fetch = async () => Response.json({data: post});
  const result = await worker.fetch(new Request('https://celeonetv.com/reels/reel-one'), env);
  const html = await result.text();
  assert.equal(result.status, 200);
  for (const expected of ['og:title', 'A reel', 'poster.jpg', 'VideoObject', 'celeone-post-data', 'https://celeonetv.com/reels/reel-one']) assert.ok(html.includes(expected), expected);
  global.fetch = async () => new Response('{}', {status: 404});
  const absent = await worker.fetch(new Request('https://celeonetv.com/reels/missing'), env);
  assert.equal(absent.status, 404);
  assert.match(absent.headers.get('X-Robots-Tag'), /noindex/);
  global.fetch = async () => {throw new Error('Origin unavailable');};
  const unavailable = await worker.fetch(new Request('https://celeonetv.com/social/unavailable'), env);
  assert.equal(unavailable.status, 503);
  assert.match(unavailable.headers.get('X-Robots-Tag'), /noindex/);
  global.fetch = async () => Response.json({pages: 1, items: [{id: 'reel-one', type: 'reels'}]});
  const sitemap = await worker.fetch(new Request('https://celeonetv.com/sitemap-content-1.xml'), env);
  assert.match(await sitemap.text(), /\/reels\/reel-one/);
  console.log('Share Worker checks passed: metadata, canonical, video schema, bootstrap, 404/503 noindex, sitemap.');
})().catch(error => {console.error(error); process.exitCode = 1;});
