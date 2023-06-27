import { helperNameMap } from './runtimeHelprs'

export function generate(ast) {
  const context = createCodegenContext(ast)
  const { push, newline, indent, deindent } = context
}

function createCodegenContext(ast) {
  const context = {
    code: '',
    runtimeGlobalName: 'Vue',
    source: ast.loc.source,
    // 缩进
    indentLevel: 0,
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code) {
      context.code += code
    },
    // 新的一行
    newline() {
      newline(context.indentLevel)
    },
    indent() {
      newline(++context.indentLevel)

    },
    deindent() {
      newline(--context.indentLevel)
    },
  }
  function newline(n: number) {
    context.code += '\n' + ` `.repeat(n)
  }
  return context
}
