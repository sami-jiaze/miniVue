import { isFunction } from '@myvue/shared'
import { ReactiveEffect } from './effect'
import { Dep } from './dep'
import { trackRefValue, triggerRefValue } from './ref'

export function myComputed(getterOrOptions) {
  let getter

  const onlygetter = isFunction(getterOrOptions)
  if (onlygetter) {
    getter = getterOrOptions
  }

  const cRef = new ComputedRefImpl(getter)
  return cRef
}

export class ComputedRefImpl<T> {
  public dep?: Dep = undefined
  private _value!: T
  public readonly effect: ReactiveEffect<T>
  public readonly __v_isRef = true
  public _dirty: boolean = true

  constructor(getter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this)
      }
    })
    this.effect.computed = this
  }

  get value() {
    trackRefValue(this)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
}
