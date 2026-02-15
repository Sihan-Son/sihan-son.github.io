import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  site: 'https://sihan-son.github.io',
  trailingSlash: 'always',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  vite: {
    plugins: [yaml()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'vitesse-light',
        dark: 'tokyo-night',
      },
    },
  },
});
