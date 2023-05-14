import { Dep, activeEffect, createDep, trackEffects } from './effect'
import { toReactive } from './reactive'

export interface Ref<T = any> {
  value: T
}

// 是否能使用ref 复杂数据类型/简单数据类型
export function isRef(value: any): value is Ref {
  return !!(value && value.__v_isRef)
}

// ref 主函数
export function myRef(value?: unknown) {
  return createRef(value, false)
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue
  }

  return new RefImpl(rawValue, shallow)
}

class RefImpl<T> {
  private _value: T
  public dep?: Dep = undefined
  public readonly __v_isRef: boolean = true

  constructor(value: T, public readonly __v_isShallow: boolean) {
    // 如果是复杂数据类型 使用reactive
    this._value = __v_isShallow ? value : toReactive(value)
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(value: T) {}
}

// 收集ref依赖
export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}
