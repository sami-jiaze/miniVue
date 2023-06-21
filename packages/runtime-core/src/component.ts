import { myReactive } from '@myvue/reactivity'
import { isObject } from '@myvue/shared'
import { onBeforeMount, onMounted } from './apiLifecycle'

let uid = 0

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
}

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
    isMounted: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
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
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted,
  } = instance.type

  if (beforeCreate) {
    callHook(beforeCreate)
  }

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      instance.data = myReactive(data)
    }
  }

  if (created) {
    callHook(created)
  }
  registerLifecycleHooks(onBeforeMount, beforeMount)
  registerLifecycleHooks(onMounted, mounted)

  function registerLifecycleHooks(register: Function, hook?: Function) {
    register(hook, instance)
  }
}

function callHook(hook: Function) {
  hook()
}
