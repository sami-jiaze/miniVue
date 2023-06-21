import { createVNode } from "./vnode"

export function normalizeVNode(child) {
  if(typeof child === 'object') {
    return child
  } else {
    return createVNode(Text, null, String(child))
  }
}