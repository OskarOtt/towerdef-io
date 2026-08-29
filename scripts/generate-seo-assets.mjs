import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'
import { siteUrl } from './seo-config.mjs'

const publicDirectory = resolve('public')
const writePublicFile = async (name, contents) => {
  const destination = resolve(publicDirectory, name)
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, contents, 'utf8')
}

await writePublicFile('CNAME', 'towerdef.io\n')
await writePublicFile('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`)

// Additional static, separately-indexable pages (beyond the SPA's single "/"
// route) so the sitemap gives crawlers more than one entry point.
const staticPages = ['how-to-play.html', 'towers.html']
const lastmod = new Date().toISOString().slice(0, 10)
const urlEntries = [siteUrl, ...staticPages.map((page) => `${siteUrl}${page}`)]
  .map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
  .join('\n')
await writePublicFile(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`,
)

// Rasterize the terminal/CRT favicon into the PNG sizes referenced by
// apple-touch-icon and manifest.json (SVG isn't supported everywhere).
const faviconSvg = await readFile(resolve(publicDirectory, 'favicon.svg'))
await Promise.all([
  sharp(faviconSvg, { density: 384 })
    .resize(180, 180)
    .png({ palette: true, compressionLevel: 9 })
    .toFile(resolve(publicDirectory, 'apple-touch-icon.png')),
  sharp(faviconSvg, { density: 384 })
    .resize(192, 192)
    .png({ palette: true, compressionLevel: 9 })
    .toFile(resolve(publicDirectory, 'icon-192.png')),
  sharp(faviconSvg, { density: 384 })
    .resize(512, 512)
    .png({ palette: true, compressionLevel: 9 })
    .toFile(resolve(publicDirectory, 'icon-512.png')),
])

// Build a branded 1200x630 social share image (og:image / twitter:image) by
// embedding the same CRT terminal + tower artwork from favicon.svg alongside
// the site title/tagline.
const faviconMarkup = faviconSvg.toString('utf8').replace(/<\/?svg[^>]*>/g, '')
const ogImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#060a06"/>
  <rect x="16" y="16" width="1168" height="598" rx="10" fill="none" stroke="#1a8a38" stroke-width="2"/>
  <g transform="translate(90,171) scale(6)">${faviconMarkup}</g>
  <text x="450" y="330" text-anchor="start" font-family="Consolas, 'Courier New', monospace" font-size="60" fill="#33ff66">&gt;&gt; TOWERDEF.IO</text>
  <text x="450" y="390" text-anchor="start" font-family="Consolas, 'Courier New', monospace" font-size="30" fill="#33e0ff">TERMINAL DEFENSE SYSTEM</text>
  <text x="450" y="440" text-anchor="start" font-family="Consolas, 'Courier New', monospace" font-size="22" fill="#8fffab">Free browser tower defense. No download. No sign-up.</text>
</svg>`
await sharp(Buffer.from(ogImageSvg), { density: 384 })
  .png({ palette: true, compressionLevel: 9 })
  .toFile(resolve(publicDirectory, 'og-image.png'))
