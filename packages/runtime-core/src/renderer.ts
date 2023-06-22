import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Fragment, Text, Comment, isSameVNodeType } from './vnode'
import { EMPTY_OBJ, isString } from '@myvue/shared'
import { normalizeVNode, renderComponentRoot } from './componentRenderUtils'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { queuePreFlushCb } from './scheduler'

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
  // 设置 注释
  createComment(text: string)
}

export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RendererOptions) {
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    createComment: hostCreateComment,
  } = options

  // patch 函数中对 ShapeFlags 为ELEMENT的处理
  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      mountElement(newVNode, container, anchor)
    } else {
      patchElement(oldVNode, newVNode)
    }
  }
  const processText = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      newVNode.el = hostCreateText(newVNode.children)
      hostInsert(newVNode.el, container, anchor)
    } else {
      const el = (newVNode.el = oldVNode.el!)
      if (newVNode.children !== oldVNode.children) {
        {
          hostSetText(el, newVNode.children)
        }
      }
    }
  }
  const processComment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      newVNode.el = hostCreateComment(newVNode.children)
      hostInsert(newVNode.el, container, anchor)
    } else {
      newVNode.el = oldVNode.el
    }
  }
  const processFragment = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      mountChildren(newVNode.children, container, anchor)
    } else {
      patchChildren(oldVNode, newVNode, container, anchor)
    }
  }
  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      mountComponent(newVNode, container, anchor)
    }
  }

  // 挂载element
  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode
    // 创建element
    const el = (vnode.el = hostCreateElement(type))
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 设置文本
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, anchor)
    }
    // 设置props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 插入节点
    hostInsert(el, container, anchor)
  }
  // 针对Fragment情况
  const mountChildren = (children, container, anchor) => {
    if (isString(children)) {
      children = children.split('')
    }
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))
      patch(null, child, container, anchor)
    }
  }
  const mountComponent = (initialVNode, container, anchor) => {
    initialVNode.component = createComponentInstance(initialVNode)
    const instance = initialVNode.component
    // 标准化组件实例数据
    setupComponent(instance)
    // 设置组件渲染
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  const setupRenderEffect = (instance, initialVNode, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance
        if (bm) {
          bm()
        }
        const subTree = (instance.subTree = renderComponentRoot(instance))
        patch(null, subTree, container, anchor)
        if (m) {
          m()
        }
        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        let { next, vnode } = instance
        if (!next) {
          next = vnode
        }
        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree
        patch(prevTree, nextTree, container, anchor)
        next.el = nextTree.el
      }
    }
    const update = (instance.update = () => effect.run())
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update),
    ))

    update()
  }
  // 更新element
  const patchElement = (oldVNode, newVNode) => {
    const el = (newVNode.el = oldVNode.el)
    const oldProps = oldVNode.props
    const newProps = newVNode.props
    // 更新子节点
    patchChildren(oldVNode, newVNode, el, null)
    // 更新 props
    patchProps(el, newVNode, oldProps, newProps)
  }

  // 卸载element
  const unmount = (vnode) => {
    // console.log("will remove", vnode);
    hostRemove(vnode.el!)
  }

  const patchChildren = (oldVnode, newVnode, container, anchor) => {
    const c1 = oldVnode && oldVnode.children
    const prevShapeFlag = oldVnode ? oldVnode.shapeFlags : 0
    const c2 = newVnode && newVnode.children
    const { shapeFlag } = newVnode

    // 新子节点为 TEXT_CHILDREN
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧子节点为 ARRAY_CHILDREN
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO: 卸载旧子节点
      }
      // 新旧子节点不同
      if (c2 !== c1) {
        // 挂载新子节点的文本
        hostSetElementText(container, c2 as string)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 要进行 diff 运算
          // patchKeyedChildren(c1, c2, container, anchor)
        }
        // 新子节点不为 ARRAY_CHILDREN，则直接卸载旧子节点
        else {
          // TODO: 卸载
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧的文本
          hostSetElementText(container, '')
        }
        // 新子节点为 ARRAY_CHILDREN
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: 单独挂载新子节点操作
        }
      }
    }
  }

  const patchProps = (el: Element, vnode, oldProps, newProps) => {
    // 新旧 props 不相同时才进行处理
    if (oldProps !== newProps) {
      // 遍历新的 props，触发 hostPatchProp ，赋值新属性
      for (const key in newProps) {
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(el, key, prev, next)
        }
      }
      // 存在旧的 props 时
      if (oldProps !== EMPTY_OBJ) {
        // 遍历旧的 props，依次触发 hostPatchProp ，删除不存在于新props 中的旧属性
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  // render函数挂载或者更新操作
  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }
    const { type, shapeFlag } = newVNode
    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      unmount(oldVNode)
      oldVNode = null
    }
    switch (type) {
      case Text:
        processText(oldVNode, newVNode, container, anchor)
        break
      case Comment:
        processComment(oldVNode, newVNode, container, anchor)
        break
      case Fragment:
        processFragment(oldVNode, newVNode, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(oldVNode, newVNode, container, anchor)
        }
        break
    }
  }

  const render = (vnode, container) => {
    // console.log("render vnode: ", vnode);
    // console.log("render container: ", container);

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

  return { render }
}
