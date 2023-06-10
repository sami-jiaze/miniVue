import { createRenderer } from '@myvue/runtime-core'

import { nodeOps } from './nodeOps'
import { patchProp } from './pathProp'
import { extend } from '@myvue/shared'

const rendererOptions = extend({ patchProp }, nodeOps)
let renderer

function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}

export const render = (...args) => {
  ensureRenderer().render(...args)
}
