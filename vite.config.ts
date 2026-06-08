import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPages ? '/holiday/' : '/',
  build: {
    rollupOptions: {
      input: {
        review: resolve(__dirname, 'index.html'),
        z4: resolve(__dirname, 'z4.html'),
      },
    },
  },
});
