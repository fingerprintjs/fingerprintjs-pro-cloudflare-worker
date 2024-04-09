import typescript from '@rollup/plugin-typescript'
import jsonPlugin from '@rollup/plugin-json'
import { dts } from 'rollup-plugin-dts'
import licensePlugin from 'rollup-plugin-license'
import { join } from 'path'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

function getEnv(key, defaultValue) {
  const value = process.env[key]
  if (value) {
    return value
  }

  if (defaultValue) {
    console.warn(`Missing environment variable "${key}". Using default value: ${defaultValue}`)
    return defaultValue
  }

  throw new Error(`Missing environment variable ${key}`)
}

const packageJson = require('./package.json')

const inputFile = 'src/index.ts'
const outputDirectory = 'dist'
const artifactName = 'fingerprintjs-pro-cloudflare-worker'

const commonBanner = licensePlugin({
  banner: {
    content: {
      file: join(__dirname, 'assets', 'license_banner.txt'),
    },
  },
})

const env = {
  fpcdn: getEnv('FPCDN', 'fpcdn.io'),
  ingressApi: getEnv('INGRESS_API', 'api.fpjs.io'),
}

const commonInput = {
  input: inputFile,
  plugins: [
    replace({
      __current_worker_version__: packageJson.version,
      preventAssignment: true,
      __FPCDN__: env.fpcdn,
      __INGRESS_API__: env.ingressApi,
    }),
    jsonPlugin(),
    typescript(),
    commonBanner,
    nodeResolve({ preferBuiltins: false }),
    commonjs(),
  ],
}

const commonOutput = {
  name: 'fingerprintjs-pro-cloudflare-worker',
  exports: 'named',
}

export default [
  {
    ...commonInput,
    output: [
      {
        ...commonOutput,
        file: `${outputDirectory}/${artifactName}.esm.js`,
        format: 'es',
      },
    ],
  },

  // TypeScript definition
  {
    ...commonInput,
    plugins: [dts(), commonBanner],
    output: {
      file: `${outputDirectory}/${artifactName}.d.ts`,
      format: 'es',
    },
  },
]
