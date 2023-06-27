import { NodeTypes, createCompoundExpression } from '../ast'
import { isText } from '../utils'

// 将相邻的文本节点和表达式合并为一个表达式。<div>hello {{ msg }}</div>
export const transformText = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      const children = node.children
      let currentContainer
      // 循环处理所有的子节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child)) {
          // j = i + 1 表示下一个节点
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              if (!currentContainer) {
                // 生成一个复合表达式节点
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc,
                )
              }
              currentContainer.children.push(` + `, next)
              children.splice(j, 1)
              j--
            }
            // 当前节点 child 是 Text 节点，下一个节点 next 不是 Text 节点，则把 currentContainer 置空即可
            else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}
