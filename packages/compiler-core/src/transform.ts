export interface TransformConText {
  root
  parent: ParentNode | null
  childrenIndex: number
  currentNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
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

export function transform(root, options) {
  // 生成上下文对象
  const context = createTransformContext(root, options)
}

// 遍历转化节点 深度优先 子->父
export function traverseNode() {
  
}
