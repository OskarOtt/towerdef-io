import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { siteUrl } from './seo-config.mjs'

const publicDirectory = resolve('public')
const writePublicFile = async (name, contents) => {
  const destination = resolve(publicDirectory, name)
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, contents, 'utf8')
}

await writePublicFile('CNAME', 'towerdef.io\n')
await writePublicFile('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`)
await writePublicFile(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}</loc>\n  </url>\n</urlset>\n`,
)
