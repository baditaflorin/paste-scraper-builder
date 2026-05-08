import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

const readGit = (command, fallback) => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return fallback
  }
}

const meta = {
  app: packageJson.name,
  version: packageJson.version,
  commit: readGit('git rev-parse --short=12 HEAD', 'local-dev'),
  generatedAt: new Date().toISOString(),
  repository: 'https://github.com/baditaflorin/paste-scraper-builder',
  paypal: 'https://www.paypal.com/paypalme/florinbadita',
}

mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../public/data/build-meta.json', import.meta.url), `${JSON.stringify(meta, null, 2)}\n`)
