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
    // Inline all page CSS into <style> tags to remove the render-blocking
    // /_astro/*.css request. This eliminates the LCP render-delay caused by
    // the external stylesheet fetch. Bundle is small (~15.5 KiB) so inlining
    // is a net win for first paint.
    inlineStylesheets: 'always',
  },
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // esbuild's built-in minifier — bundled natively in Vite, no separate
      // worker-thread dependency on the `terser` package. Switched from
      // minify:'terser' after it started crashing silently mid-build in
      // this environment (Node 25 / terser worker-thread incompatibility,
      // unrelated to any site code — confirmed by bisecting with minify:false).
      minify: 'esbuild',
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
});