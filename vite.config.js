import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Injects the list of built files into dist/service-worker.js so the app shell
 * (hashed JS/CSS bundles, icons, manifest) is precached on install. Without this
 * the service worker would only learn about assets lazily, and the very first
 * offline visit could miss the bundle.
 */
function precacheManifest() {
  let outDir = 'dist';
  return {
    name: 'weatherboard-precache-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const walk = (dir) =>
        readdirSync(dir).flatMap((name) => {
          const full = join(dir, name);
          return statSync(full).isDirectory() ? walk(full) : [full];
        });
      const files = walk(outDir)
        .map((f) => '/' + relative(outDir, f).split(sep).join('/'))
        .filter((f) => f !== '/service-worker.js' && !f.endsWith('.map'));
      const swPath = join(outDir, 'service-worker.js');
      const version = Date.now().toString(36);
      const sw = readFileSync(swPath, 'utf8')
        .replace('self.__PRECACHE_MANIFEST', JSON.stringify(['/', ...files]))
        .replace('__BUILD_VERSION__', version);
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precacheManifest()],
});
