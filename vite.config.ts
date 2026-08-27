import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { siteDescription, siteKeywords, siteTitle, siteUrl } from './scripts/seo-config.mjs'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'inject-seo-metadata',
      transformIndexHtml(html) {
        return html
          .replaceAll('__SITE_URL__', siteUrl)
          .replaceAll('__SITE_TITLE__', siteTitle)
          .replaceAll('__SITE_DESCRIPTION__', siteDescription)
          .replaceAll('__SITE_KEYWORDS__', siteKeywords)
      },
    },
  ],
})
