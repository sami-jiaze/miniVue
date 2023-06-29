import { compile } from '@myvue/compiler-dom'
import { registerRuntimeCompiler } from 'packages/runtime-core/src/component'

function compileToFunction(template, options?) {
  const { code } = compile(template, options)
  const renderFn = new Function(code)()
  return renderFn
}

registerRuntimeCompiler(compileToFunction)

export { compileToFunction as compile }
