import { createFilter } from '@rollup/pluginutils'
const compile = require('ejs').compile
const defaultCompilerOptions = { client: true, strict: true }

function toModule(code, compilerOptions) {
  const templateFn = compile(code, Object.assign(defaultCompilerOptions, compilerOptions))
  return `export default ${templateFn.toString()};`
}

export default function ejs({ include, exclude, compilerOptions = defaultCompilerOptions } = {}) {
  const filter = createFilter(include || ['**/*.ejs'], exclude)

  return {
    name: 'ejs',

    transform: async function transform(code, tplFilePath) {
      if (filter(tplFilePath)) {
        return {
          code: toModule(code, compilerOptions),
          map: { mappings: '' },
        }
      }
    },
  }
}
