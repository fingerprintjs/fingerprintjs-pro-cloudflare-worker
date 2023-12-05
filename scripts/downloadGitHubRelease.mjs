import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

  const release = await getGitHubReleaseByTag(tag)

  if (!release) {
    console.warn('No release found')

    return
  }

  console.info('Release', release.tag_name)

  const assets = await findReleaseAssets(release.assets)

  const distPath = path.resolve(dirname, '../')

  await Promise.all(
    assets.map(async asset => {
      const file = await downloadReleaseAsset(asset.url, config.token)

      const filePath = path.join(distPath, asset.name)

      console.info('Writing file', filePath)

      await fs.writeFileSync(
        filePath,
        file,
      )
    }),
  )
}

function bearer(token) {
  return `Bearer ${token}`
}

async function getGitHubReleaseByTag(tag) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/tags/${tag}`

  console.debug('getGitHubReleaseByTag url', url)

  return await doGitHubGetRequest(url)
}

async function doGitHubGetRequest(url) {
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

async function findReleaseAssets(assets) {
  const targetAssetsNames = [
    'fingerprintjs-pro-cloudflare-worker.esm.js',
  ]

  const targetAssets = targetAssetsNames.map(assetName =>
    assets.find(asset => asset.name === assetName && asset.state === 'uploaded'),
  )

  if (targetAssets.length !== targetAssetsNames.length) {
    throw new Error('Not all assets found')
  }

  return targetAssets
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
