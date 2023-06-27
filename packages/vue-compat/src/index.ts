import { compile } from '@myvue/compiler-dom'

function compileToFunction(template, options?) {
  const { code } = compile(template, options)
  const renderFn = new Function(code)()
  return renderFn
}

export { compileToFunction as compile }
