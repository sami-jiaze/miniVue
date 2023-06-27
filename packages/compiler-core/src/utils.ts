import { NodeTypes } from './ast'
import { CREATE_ELEMENT_VONDE, CREATE_VNODE } from './runtimeHelprs'

// 是否是text节点
export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
   
}

// 返回 vnode 生成函数
export function getVNodeHelper(ssr: boolean, isComponent: boolean) {
	return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VONDE
}