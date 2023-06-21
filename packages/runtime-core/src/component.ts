import { myReactive } from '@myvue/reactivity'
import { isObject } from '@myvue/shared'

let uid = 0

export function createComponentInstance(vnode) {
  const type = vnode.type
  const instance = {
    uid: uid++,
    vnode,
    type,
    subTree: null,
    effect: null,
    update: null,
    render: null,
  }
  return instance
}

export function setupComponent(instance) {
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  finishComponentSetup(instance)
}

export function finishComponentSetup(instance) {
  const Component = instance.type
  instance.render = Component.render

  applyOptions(instance)
}

function applyOptions(instance) {
  // dataOptions 用来存储 instance.type 对象的 data 属性的值
  const { data: dataOptions } = instance.type

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      instance.data = myReactive(data)
    }
  }
}
