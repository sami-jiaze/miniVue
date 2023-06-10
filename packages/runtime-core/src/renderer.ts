import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Fragment, Text, Comment } from './vnode'

export interface RendererOptions {
  // 为指定 element 的 prop 打补丁
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
  // 为指定的 Element 设置 text
  setElementText(node: Element, text: string): void
  // 插入el到 parent 中，anchor 为锚点
  insert(el, parent: Element, anchor?): void
  // 创建指定的 Element
  createElement(type: string)
  // 卸载指定dom
  remove(el): void
  // 创建 Text 节点
  createText(text: string)
  // 设置 text
  setText(node, text): void
  // 设置 text
  createComment(text: string)
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RendererOptions) {
  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      mountElement(oldVNode, newVNode, container, anchor)
    } else {
    }
  }

  const mountElement = (oldVNode, newVNode, container, anchor) => {
    // 创建element
    // 设置文本
    // 设置props
    // 插入节点
  }

  const unmount = (vnode) => {}

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }
    const { type, shapeFlag } = newVNode
    switch (type) {
      case Text:
        break
      case Comment:
        break
      case Fragment:
        break
      default:
        if (ShapeFlags.ELEMENT & shapeFlag) {
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
        }
        break
    }
  }

  const render = (vnode, container) => {
    if (vnode === null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      // 挂载或者更新操作
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode
  }

  return render
}
