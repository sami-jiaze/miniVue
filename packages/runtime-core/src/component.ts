import { myReactive } from '@myvue/reactivity'
import { isFunction, isObject } from '@myvue/shared'
import { onBeforeMount, onMounted } from './apiLifecycle'

let uid = 0
let compile: any = null

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
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    const setupResult = setup()
    if (isFunction(setupResult)) {
      instance.render = setupResult
    }
    finishComponentSetup(instance)
  } else {
    finishComponentSetup(instance)
  }
}

export function finishComponentSetup(instance) {
  const Component = instance.type

  // 兼容使用模板的情况
  if (!instance.render) {
    if (compile && !Component.render) {
      if (Component.template) {
        const template = Component.template
        Component.render = compile(template)
      }
    }
    instance.render = Component.render
  }

  applyOptions(instance)
}

export function registerRuntimeCompiler(_compile: any) {
  compile = _compile
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
    callHook(beforeCreate, instance.data)
  }

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      instance.data = myReactive(data)
    }
  }

  if (created) {
    callHook(created, instance.data)
  }

  registerLifecycleHooks(onBeforeMount, beforeMount)
  registerLifecycleHooks(onMounted, mounted)

  function registerLifecycleHooks(register: Function, hook?: Function) {
    register(hook?.bind(instance.data), instance)
  }
}

function callHook(hook: Function, proxy) {
  hook.bind(proxy)()
}
