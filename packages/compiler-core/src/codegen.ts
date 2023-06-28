import { isArray, isString } from '@myvue/shared'
import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperNameMap } from './runtimeHelprs'
import { getVNodeHelper } from './utils'

export function generate(ast) {
  // 生成上下文 context
  const context = createCodegenContext(ast)
  console.log("10", context);
  
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
    code: '',
    runtimeGlobalName: 'myVue',
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

const aliasHelpr = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

// 节点处理
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    // 插值表达式处理
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    // 表达式处理
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
      genNode(node.codegenNode, context)
      break
    // JS调用表达式的处理
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context)
      break
    // JS条件表达式的处理
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context)
      break
    default:
      break
  }
}

/**
 * JS条件表达式的处理。
 *  isShow
        ? _createElementVNode("h1", null, ["你好，世界"])
        : _createCommentVNode("v-if", true),
 */
function genConditionalExpression(node, context) {
  const { test, consequent, alternate, newline: needNewline } = node
  const { push, indent, deindent, newline } = context
  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    // 写入变量
    genExpression(test, context)
  }
  // 换行
  needNewline && indent()
  // 缩进++
  context.indentLevel++
  // 写入空格
  needNewline || push(` `)
  // 写入 ？
  push(`? `)
  // 写入满足条件的处理逻辑
  genNode(consequent, context)
  // 缩进 --
  context.indentLevel--
  // 换行
  needNewline && newline()
  // 写入空格
  needNewline || push(` `)
  // 写入:
  push(`: `)
  // 判断 else 的类型是否也为 JS_CONDITIONAL_EXPRESSION
  const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
  // 不是则缩进++
  if (!isNested) {
    context.indentLevel++
  }
  // 写入 else （不满足条件）的处理逻辑
  genNode(alternate, context)
  // 缩进--
  if (!isNested) {
    context.indentLevel--
  }
  // 控制缩进 + 换行
  needNewline && deindent(true /* without newline */)
}
// JS调用表达式的处理
function genCallExpression(node, context) {
  const { push, helper } = context
  const callee = isString(node.callee) ? node.callee : helper(node.callee)

  push(callee + `(`, node)
  genNodeList(node.arguments, context)
  push(`)`)
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

// 表达式处理
function genExpression(node, context) {
  const { content, isStatic } = node
  context.push(isStatic ? JSON.stringify(content) : content, node)
}

// 插值表达值{{}}
function genInterpolation(node, context) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

// 复合表达式处理
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i]
    if (isString(child)) {
      context.push(child)
    } else {
      genNode(child, context)
    }
  }
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
  // console.log(nodes)

  const { push, newline } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    // 字符串直接 push 即可
    if (isString(node)) {
      push(node)
    }
    // 数组需要 push "[" "]"
    else if (isArray(node)) {
      genNodeListAsArray(node, context)
    }
    // 对象需要区分 node 节点类型，递归处理
    else {
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
