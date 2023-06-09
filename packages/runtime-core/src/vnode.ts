import { isArray, isFunction, isObject, isString } from '@myvue/shared'
import { normalizeClass } from 'packages/shared/src/normalizeProp'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

export interface VNode {
  __v_isVNode: true
  type: any
  props: any
  children: any
  shapeFlag: number
  key: any
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

export function createVNode(type, props, children?): VNode {
  if (props) {
    // 处理 class
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
  }

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type) // 是否是一个组件
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0
  return createBaseVNode(type, props, children, shapeFlag)
}
export { createVNode as createElementVNode }

function createBaseVNode(type: any, props: any, children: any, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    key: props?.key || null,
    shapeFlag,
  } as VNode

  normalizeChildren(vnode, children)
  return vnode
}

// 解析children
export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  const { shapeFlag } = vnode
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (isFunction(children)) {
    // TODO:
  } else if (typeof children === 'object') {
    // TODO:
  } else {
    // children 为 string
    children = String(children)
    // 为 type 指定 Flags
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.children = children
  // 按位或运算
  vnode.shapeFlag |= type
}

// 是否是同一个元素
export function isSameVNodeType(v1: VNode, v2: VNode) {
  return v1.type === v2.type && v1.key === v2.key
}

export function createCommentVNode(text) {
	return createVNode(Comment, null, text)
}