import { hasOwn, isArray } from '@myvue/shared'
import { ITERATE_KEY, track, trigger } from './effect'
import { TriggerOpTypes } from './operations'

const get = createGetter()
const set = createSetter()

function createGetter() {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)

    // 收集依赖
    track(target, key)

    return res
  }
}

function createSetter() {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ) {
    const res = Reflect.set(target, key, value, receiver)
    // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
    const type = Object.prototype.hasOwnProperty.call(target, key)
      ? TriggerOpTypes.SET
      : TriggerOpTypes.ADD
    // 触发依赖
    trigger(target, key, type)

    return res
  }
}

function deleteProperty(target: object, key: string | symbol): boolean {
  // 检查被操作的属性是否是对象自己的属性
  const hadKey = hasOwn(target, key)
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, key, TriggerOpTypes.DELETE)
  }
  return result
}

// 通过 has 拦截函数实现对 in 操作符的代理
function has(target: object, key: string | symbol): boolean {
  track(target, key)
  return Reflect.has(target, key)
}

// 拦截 for...in 循环
function ownKeys(target: object): (string | symbol)[] {
  track(target, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
