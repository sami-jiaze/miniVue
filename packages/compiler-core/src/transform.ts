import { NodeTypes } from './ast'
import { isSingleElementRoot } from './hoistStatic'

export interface TransformConText {
  root
  parent: ParentNode | null
  childrenIndex: number
  currentNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
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
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
      break
    case NodeTypes.ROOT:
      traverseChildren(node, context)
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
