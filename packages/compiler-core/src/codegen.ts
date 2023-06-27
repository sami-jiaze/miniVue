import { isArray, isString } from '@myvue/shared'
import { NodeTypes } from './ast'
import { helperNameMap } from './runtimeHelprs'
import { getVNodeHelper } from './utils'

export function generate(ast) {
  // 生成上下文 context
  const context = createCodegenContext(ast)
  // 获取 code 拼接方法
  const { push, newline, indent, deindent } = context
  genFunctionPreamble(context)

  const functionName = `render`
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}) {`)
  indent()

  // 增加 with 触发
  push(`with (_ctx) {`)
  indent()

  const hasHelpers = ast.helpers.length > 0
  if (hasHelpers) {
    push(`const {${ast.helpers.map(aliasHelpr).join(', ')}} = _Vue`)
    push('\n')
    newline()
  }

  newline()
  push(`return `)
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  // with 结尾
  deindent()
  push('}')

  deindent()
  push('}')

  return {
    ast,
    code: context.code,
  }
}

function createCodegenContext(ast) {
  const context = {
    isSSR: false,
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

// 生成 "const _Vue = Vue\n\nreturn "
function genFunctionPreamble(context) {
  const { newline, push, runtimeGlobalName } = context
  const VueBinding = runtimeGlobalName
  push(`const _Vue = ${VueBinding}\n`)
  newline()
  push(`return `)
}

const aliasHelpr = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}}`

// 节点处理
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    default:
      break
  }
}

// 处理 TEXT 节点
function genText(node, context) {
  context.push(JSON.stringify(node.content), node)
}

// 处理 VNODE_CALL 节点
function genVNodeCall(node, context) {
  const { push, helper } = context
  const { tag, props, children, patchFlag, dynamicProps, isComponent } = node
  // 返回 vnode 生成函数
  const callHelper = getVNodeHelper(context.isSSR, isComponent)
  push(helper(callHelper) + `(`, node)
  // 获取函数参数
  const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps])
  // console.log(args);
  genNodeList(args, context)
  push(')')
}

// 剔除无效参数
function genNullableArgs(args: any[]) {
  let i = args.length
  while (i--) {
    if (args[i] != null) break
  }
  return args.slice(0, i + 1).map((arg) => arg || `null`)
}

// 参数的填充
function genNodeList(nodes, context) {
  const { push, newline } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    // 字符串直接 push
    if (isString(node)) {
      push(node)
    } else if (isArray(node)) {
      // 数组需要 push "[" "]"
      genNodeListAsArray(node, context)
    } else {
      // 对象需要区分 node 节点类型，递归处理
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNodeListAsArray(nodes, context) {
  context.push(`[`)
  genNodeList(nodes, context)
  context.push(`]`)
}

/**
`
const _Vue = Vue
return function render(_ctx,_cache) {
  const { createElementVNode: _createElementVNode } = _Vue
  return _createElementVNode("div",[],["hello world"])
`
 */
