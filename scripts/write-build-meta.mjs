import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

const meta = {
  app: packageJson.name,
  version: packageJson.version,
  commit: 'live-main',
  generatedAt: packageJson.releaseDate ?? '2026-05-08T00:00:00.000Z',
  repository: 'https://github.com/baditaflorin/paste-scraper-builder',
  paypal: 'https://www.paypal.com/paypalme/florinbadita',
}

;[
  '../docs/assets',
  '../docs/index.html',
  '../docs/404.html',
  '../docs/favicon.svg',
  '../docs/icons.svg',
  '../docs/manifest.webmanifest',
  '../docs/sw.js',
  '../docs/data/build-meta.json',
].forEach((path) => {
  rmSync(new URL(path, import.meta.url), { recursive: true, force: true })
})

mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../public/data/build-meta.json', import.meta.url), `${JSON.stringify(meta, null, 2)}\n`)
