import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const config = {
  token: process.env.GITHUB_TOKEN,
  owner: 'fingerprintjs',
  repo: 'fingerprintjs-pro-cloudflare-worker',
}

const dirname = path.dirname(fileURLToPath(import.meta.url))

console.debug('dirname', dirname)

async function main() {
  const tag = process.env.TAG

  if (!tag) {
    throw new Error('TAG env variable is required')
  }

  const release = await getGithubReleaseByTag(tag)

  if (!release) {
    console.warn('No release found')

    return
  }

  console.info('Release', release.tag_name)

  const assets = await findReleaseAssets(release.assets)

  const distPath = path.resolve(dirname, '../dist')

  if(fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true })
  }

  fs.mkdirSync(distPath, { recursive: true })

  await Promise.all(
    assets.map(async asset => {
      const file = await downloadReleaseAsset(asset.url, config.token)

      await fs.writeFileSync(
        path.join(distPath, asset.name),
        file,
      )
    }),
  )
}

function bearer(token) {
  return `Bearer ${token}`
}

async function getGithubReleaseByTag(tag) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/tags/${tag}`

  console.debug('getGithubReleaseByTag url', url)

  return await doGithubGetRequest(url)
}

async function doGithubGetRequest(url) {
  const response = await fetch(url, {
    headers: config.token
      ? {
        Authorization: bearer(config.token),
      }
      : undefined,
  })

  return await response.json()
}

async function downloadReleaseAsset(url, token) {
  const headers = {
    Accept: 'application/octet-stream',
    'User-Agent': 'fingerprint-pro-azure-integration',
  }
  if (token) {
    headers['Authorization'] = bearer(token)
  }

  console.info('Downloading release asset...', url)

  const response = await fetch(url, { headers })

  const arrayBuffer = await response.arrayBuffer()

  console.info('Downloaded release asset')

  return Buffer.from(arrayBuffer)
}

export async function findReleaseAssets(assets) {
  const targetAssets = [
    'fingerprintjs-pro-cloudflare-worker.d.ts',
    'fingerprintjs-pro-cloudflare-worker.esm.js',
  ]

  const result = targetAssets.map(assetName =>
    assets.find(asset => asset.name === assetName && asset.state === 'uploaded'),
  )

  if (result.length !== targetAssets.length) {
    throw new Error('Not all assets found')
  }

  return result
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
