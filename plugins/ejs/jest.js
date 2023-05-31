const compile = require('ejs').compile
const defaultCompilerOptions = { client: true, strict: true }

function toModule(code, compilerOptions) {
  const templateFn = compile(code, Object.assign(defaultCompilerOptions, compilerOptions))
  return `module.exports = ${templateFn.toString()};`
}

module.exports = {
  process(src) {
    const code = toModule(src, {})
    return {
      code,
    }
  },
}
