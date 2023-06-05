import { isObject } from '@myvue/shared'
import { mutableHandlers } from './baseHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}
export function isReactive(value: boolean) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
export const toReactive = <T extends unknown>(value: T): T => {
  return isObject(value) ? myReactive(value as object) : value
}
// 代理缓存的map
export const reactiveMap = new WeakMap<object, any>()

// reactive 主函数 target为被代理对象
export function myReactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>,
) {
  const exisitProxy = proxyMap.get(target)
  if (exisitProxy) return exisitProxy

  const targetProxy = new Proxy(target, baseHandlers)
  targetProxy[ReactiveFlags.IS_REACTIVE] = true
  // 缓存代理对象
  proxyMap.set(target, targetProxy)

  return targetProxy
}
