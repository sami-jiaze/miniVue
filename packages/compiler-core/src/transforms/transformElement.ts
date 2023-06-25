import { NodeTypes, createVNodeCall } from '../ast'

export const transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode
    if (node.type !== NodeTypes.ELEMENT) {
      return
    }
    const { tag } = node
    let vnodeTag = `"${tag}"`
    let vnodeProps = []
    let vnodeChildren = node.children

    // 核心 新增一个属性
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
    )
  }
}
