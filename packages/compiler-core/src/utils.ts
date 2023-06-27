import { NodeTypes } from './ast'

// 是否是text节点
export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
   
}
