import {
  NodeTypes,
  createCallExpression,
  createConditionalExpression,
  createObjectProperty,
  createSimpleExpression,
} from '../ast'
import { CREATE_COMMENT } from '../runtimeHelprs'
import {
  TransformConText,
  createStructuralDirectiveTransform,
} from '../transform'
import { injectProp } from '../utils'

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      let key = 0
      // 退出回调。当所有子节点都已完成时，完成codegenNode
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
        } else {
          // TODO: 非根
        }
      }
    })
  },
)

export function processIf(
  node,
  dir,
  context: TransformConText,
  processCodegen?: (node, branch, isRoot: boolean) => (() => void) | undefined,
) {
  // 处理v-if
  if (dir.name === 'if') {
    // 创建branch
    const branch = createIfBranch(node, dir)
    // 生成if指令节点，包含branches
    const ifNode = {
      type: NodeTypes.IF,
      loc: node.loc,
      branches: [branch],
    }
    // 切换 currentVNode 当前处理节点为 ifNode
    context.replaceNode(ifNode)
    // 生成对应的 codegen
    if (processCodegen) {
      return processCodegen(ifNode, branch, true)
    }
  }
}

// 创建if指令的branch属性节点
function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: node.loc,
    condition: dir.exp,
    children: [node],
  }
}

// 生成分支节点的 codegenNode
function createCodegenNodeForBranch(
  branch,
  keyIndex: number,
  context: TransformConText,
) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex),
      // 以注释的形式展示 v-if.
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', 'true']),
    )
  } else {
    return createChildrenCodegenNode(branch, keyIndex)
  }
}

// 创建指定子节点的 codegen 节点
function createChildrenCodegenNode(branch, keyIndex: number) {
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false),
  )
  const { children } = branch
  const firstChild = children[0]

  const ret = firstChild.codegenNode
  const vnodeCall = ret
  // 填充 props
  injectProp(vnodeCall, keyProperty)
  return ret
}


