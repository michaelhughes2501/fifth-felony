/**
 * Patches the postcss version bundled inside next's own node_modules to >=8.5.10
 * to resolve GHSA-qx2v-qp2m-jg93 (XSS via unescaped </style> in CSS stringify).
 *
 * npm overrides cannot replace a direct dependency of a third-party package,
 * so we copy the hoisted patched postcss over the nested stale copy post-install.
 */
import { existsSync, cpSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const nestedPath = resolve(root, 'node_modules/next/node_modules/postcss')
const hoistedPath = resolve(root, 'node_modules/postcss')

if (!existsSync(nestedPath)) {
  console.log('[patch-postcss] No nested postcss found — nothing to patch.')
  process.exit(0)
}

const nestedVersion = JSON.parse(
  readFileSync(resolve(nestedPath, 'package.json'), 'utf8')
).version

const hoistedVersion = JSON.parse(
  readFileSync(resolve(hoistedPath, 'package.json'), 'utf8')
).version

const [nMajor, nMinor, nPatch] = nestedVersion.split('.').map(Number)
const isVulnerable = nMajor < 8 || (nMajor === 8 && nMinor < 5) || (nMajor === 8 && nMinor === 5 && nPatch < 10)

if (!isVulnerable) {
  console.log(`[patch-postcss] next/postcss@${nestedVersion} is already patched — skipping.`)
  process.exit(0)
}

console.log(`[patch-postcss] Replacing vulnerable next/postcss@${nestedVersion} with postcss@${hoistedVersion}...`)
cpSync(hoistedPath, nestedPath, { recursive: true, force: true })
console.log(`[patch-postcss] Done. next/postcss is now ${hoistedVersion}.`)
