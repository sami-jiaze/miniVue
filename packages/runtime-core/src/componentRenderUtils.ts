import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { createVNode, Text } from './vnode'

export function normalizeVNode(child) {
  if (typeof child === 'object') {
    return child
  } else {
    return createVNode(Text, null, String(child))
  }
}

export function renderComponentRoot(instance) {
  const { vnode, render, data = {} } = instance
  let result
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render!.call(data, data))
    }
  } catch (error) {
    console.error(error)
  }
  return result
}
