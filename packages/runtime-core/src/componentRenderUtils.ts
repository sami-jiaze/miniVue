import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { createVNode } from "./vnode"

export function normalizeVNode(child) {
  if(typeof child === 'object') {
    return child
  } else {
    return createVNode(Text, null, String(child))
  }
}

export function renderComponentRoot(instance) {
  const { vnode, render } = instance
  let result
  try {
    if(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT){
      result = normalizeVNode(render!())
    }
  } catch (error) {
    console.error(error);
  }
  return result
}