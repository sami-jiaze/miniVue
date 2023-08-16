import { EMPTY_OBJ, hasChanged, isFunction, isObject } from '@myvue/shared'
import { isReactive } from 'packages/reactivity/src/reactive'
import { queuePreFlushCb } from './scheduler'
import { EffectScheduler, ReactiveEffect } from 'packages/reactivity/src/effect'
import { isRef } from 'packages/reactivity/src/ref'

export interface WatchOptions<Immediate = boolean> {
  immediate?: Immediate
  deep?: boolean
  flush?: 'pre' | 'post' | 'sync'
}

export function myWatch(source, cb: Function, options?: WatchOptions) {
  return doWatch(source, cb, options)
}

export function watchEffect(effect, options?) {
  return doWatch(effect, null, options)
}

function doWatch(
  source,
  cb: Function | null,
  { immediate, deep, flush }: WatchOptions = EMPTY_OBJ,
) {
  let getter: () => any

  if (isReactive(source)) {
    getter = () => source
    deep = true
  } else if (isRef(source)) {
    getter = () => source.value
  } else if (isFunction(source)) {
    getter = source
  } else {
    getter = () => {}
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  let oldValue, newValue
  // cleanup 用来存储用户注册的过期回调
  let cleanup
  function onInvalidate(fn) {
    cleanup = fn
  }

  const job = () => {
    if (cb) {
      newValue = effect.run()
      if (cleanup) {
        // 在调用回调函数 cb 之前，先调用过期回调
        cleanup()
      }
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue, onInvalidate)
        oldValue = newValue
      }
    } else {
      // watchEffect
      effect.run()
    }
  }

  let scheduler: EffectScheduler = () => {}
  if (flush == 'sync') {
    scheduler = job as any
  } else if (flush == 'post') {
    scheduler = () => {
      const p = Promise.resolve()
      p.then(job)
    }
  } else {
    scheduler = () => job()
  }

  // let scheduler = () => queuePreFlushCb(job)

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  return () => {
    effect.stop()
  }
}

export function traverse(value: unknown, seen = new Set()) {
  if (!isObject(value) || seen?.has(value)) {
    return value
  }
  seen.add(value)

  for (const key in value as object) {
    traverse((value as any)[key], seen)
  }
  return value
}
