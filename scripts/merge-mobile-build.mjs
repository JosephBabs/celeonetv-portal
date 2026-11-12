import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mobileBuild = path.join(root, '.mobile-dist');
const portalBuild = path.join(root, 'dist');

await mkdir(portalBuild, { recursive: true });
const entries = await readdir(mobileBuild, { withFileTypes: true });

for (const entry of entries) {
  const source = path.join(mobileBuild, entry.name);
  const destination = path.join(portalBuild, entry.name === 'mobile.html' ? 'mobile.html' : entry.name);
  await cp(source, destination, { recursive: true, force: true });
}
