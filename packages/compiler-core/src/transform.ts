import { isArray, isString } from '@myvue/shared'
import { ElementTypes, NodeTypes } from './ast'
import { isSingleElementRoot } from './hoistStatic'
import { TO_DISPLAY_STRING } from './runtimeHelprs'
import { isVSlot } from './utils'

export interface TransformConText {
  root
  parent: ParentNode | null
  childrenIndex: number
  currentNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
  replaceNode(node): void
}

export function transform(root, options) {
  // 生成上下文对象
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]

  root.components = []
  root.directives = []
  root.imports = []
  root.hoists = []
  root.temps = []
  root.cached = []
}

// 创建 transform 上下文
export function createTransformContext(root, { nodeTransforms = [] }) {
  const context: TransformConText = {
    root,
    nodeTransforms,
    helpers: new Map(),
    currentNode: root,
    parent: null,
    childrenIndex: 0,
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },
    replaceNode(node) {
      context.parent!.children[context.childrenIndex] = context.currentNode =
        node
    },
  }
  return context
}

// 遍历转化节点 深度优先 子->父
export function traverseNode(node, context: TransformConText) {
  context.currentNode = node
  const { nodeTransforms } = context
  // 构建保存函数数组
  const exitFns: any = []
  // 转化函数的保存 存储所有节点的转化函数到exitFns中
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      // 指令的 transforms 返回为 数组，所以需要解构
      if (isArray(onExit)) {
        exitFns.push(...onExit)
      } else {
        exitFns.push(onExit)
      }
    }
    if (!context.currentNode) {
      return
    } else {
      node = context.currentNode
    }
  }

  switch (node.type) {
    case NodeTypes.IF_BRANCH:
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context)
      }
      break
    default:
      break
  }

  context.currentNode = node
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

export function traverseChildren(parent, context: TransformConText) {
  parent.children.forEach((node, index) => {
    context.parent = parent
    context.childrenIndex = index
    traverseNode(node, context)
  })
}

function createRootCodegen(root) {
  const { children } = root
  // Vue2 单节点
  if (children.length === 1) {
    const child = children[0]
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      root.codegenNode = child.codegenNode
    }
  }
  // Vue3
}

// 对指令的处理
export function createStructuralDirectiveTransform(name, fn) {
  const matches = isString(name)
    ? (n: string) => n === name
    : (n: string) => name.test(n)

  return (node, context) => {
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node
      // 结构的转换与 v-slot 无关
      // if (node.tagType === ElementTypes.TEMPLATE && props.some(isVSlot)) {
      //   return
      // }

      // 存储转化函数的数组
      const exitFns: any = []
      // 遍历所有的 props
      for (let i = 0; i < props.length; i++) {
        const prop = props[i]
        // 仅处理指令，并且该指令要匹配指定的正则
        if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
          // 删除结构指令以避免无限递归
          props.splice(i, 1)
          i--
          // fn 会返回具体的指令函数
          const onExit = fn(node, prop, context)
          // 存储到数组中
          if (onExit) exitFns.push(onExit)
        }
      }
      // 返回包含所有函数的数组
      return exitFns
    }
  }
}
