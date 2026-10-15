import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo>/.
export default defineConfig({
  base: '/hockey-goalie-coverage/',
  build: { chunkSizeWarningLimit: 1000 },   // three.js alone is ~600 kB
});
