// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kamalakarheartcentre.com',
  output: 'static',
  // Trailing-slash convention is `always` site-wide. Canonical tags, sitemap
  // entries, and the CloudFront 301 redirect all assume /foo/ — keep them
  // aligned. See SEO optimisation/26th April Review.md (US-02).
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true },
      },
    },
  },
});