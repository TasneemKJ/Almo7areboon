import { defineConfig } from 'vite';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'complete-offline-installation',
    writeBundle(options) {
      const output = resolve(options.dir ?? 'dist');
      const html = readFileSync(resolve(output, 'index.html'), 'utf8');
      const shell = new Set([...html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css))"/g)].map(match => match[1].replace(/^\.\//, '')));
      const art = readdirSync(resolve(output, 'art'), { recursive: true }).filter(path => typeof path === 'string' && /\.(?:webp|png|svg)$/.test(path)).map(path => `./art/${String(path).replaceAll('\\', '/')}`);
      const workers = readdirSync(resolve(output, 'assets')).filter(path => /\.js$/.test(path) && !shell.has(`assets/${path}`)).map(path => `./assets/${path}`);
      const workerPath = resolve(output, 'sw.js');
      const source = readFileSync(workerPath, 'utf8');
      if (!source.includes('const INSTALL_ASSETS = [];')) throw new Error('Offline installation manifest marker is missing');
      writeFileSync(workerPath, source.replace('const INSTALL_ASSETS = [];', `const INSTALL_ASSETS = ${JSON.stringify([...art, ...workers].sort())};`));
    },
  }],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
});
