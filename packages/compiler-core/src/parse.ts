import { ElementTypes, NodeTypes } from './ast'

export interface ParseContext {
  source: string
}

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContent(content)
  // console.log(context)
  const children = parseChildren(context, [])
  // console.log(children)
  return createRoot(children)
}

export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {},
  }
}

function createParserContent(content: string): ParseContext {
  return {
    source: content,
  }
}

function parseChildren(context: ParseContext, ancestors) {
  const nodes = []
  while (!isEnd(context, ancestors)) {
    const s = context.source
    let noder: any
    // 模板语法处理
    if (s.startsWith('{{')) {
      noder = parseInterpolation(context)
    } else if (s[0] === '<') {
      // 标签开始
      if (/[a-z]/i.test(s[1])) {
        noder = parseElement(context, ancestors)
      }
    }
    // 既不是模板语法也不是标签开始
    if (!noder) {
      noder = parseText(context)
    }
    pushNode(nodes, noder)
  }
  return nodes
}

// 解析插值表达式
function parseInterpolation(context: ParseContext) {
  const [open, close] = ['{{', '}}']

  advanceBy(context, open.length)

  // 获取插值表达式中间的值
  const closeIndex = context.source.indexOf(close, open.length)
  const preTrimContent = parseTextData(context, closeIndex)
  const content = preTrimContent.trim()

  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content,
    },
  }
}

// 判断是否是结束标签
function isEnd(context: ParseContext, ancestors) {
  const s = context.source
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }
  return !s
}

function pushNode(nodes, noder) {
  nodes.push(noder)
}

// 解析 Element 元素。如：<div>
function parseElement(context: ParseContext, ancestors) {
  // 开始标签
  const element = parseTag(context, TagType.Start)
  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()

  element.children = children
  // 结束标签
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }
  return element
}

// 解析标签
function parseTag(context: ParseContext, type: TagType) {
  // 获取标签名
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
  const tag = match[1]
  advanceBy(context, match[0].length)
  //属性和指令的处理
  advanceSpaces(context)
  let props = parseAttributes(context, type)
  // 自闭合与非自闭合标签判断
  let isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)
  // 标签类型
  let tagType = ElementTypes.ELEMENT
  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    // 属性与指令
    props,
    children: [],
  }
}

// 解析指令与属性
function parseAttributes(context, type) {
  // 解析之后的 props 数组
  const props: any = []
  // 属性名数组
  const attributeNames = new Set<string>()

  // 循环解析，直到解析到标签结束（'>' || '/>'）为止
  while (
    context.source.length > 0 &&
    !context.source.startsWith('>') &&
    !context.source.startsWith('/>')
  ) {
    // 具体某一条属性的处理
    const attr = parseAttribute(context, attributeNames)
    // 添加属性
    if (type === TagType.Start) {
      props.push(attr)
    }
    advanceSpaces(context)
  }
  return props
}

// 返回指令节点
function parseAttribute(context: ParseContext, nameSet: Set<string>) {
  // 获取属性名称。例如：v-if
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  const name = match[0]
  // 添加当前的处理属性
  nameSet.add(name)

  advanceBy(context, name.length)

  // 获取属性值。
  let value: any = undefined

  // 解析模板，并拿到对应的属性值节点
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }

  // 针对 v- 的指令处理
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    // 获取指令名称
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name,
      )!

    // 指令名。v-if 则获取 if
    let dirName = match[1]
    // TODO：指令参数  v-bind:arg
    // let arg: any

    // TODO：指令修饰符  v-on:click.modifiers
    // const modifiers = match[3] ? match[3].slice(1).split('.') : []

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: value.loc,
      },
      arg: undefined,
      modifiers: undefined,
      loc: {},
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc,
    },
    loc: {},
  }
}

// 获取属性对应的value
function parseAttributeValue(context: ParseContext) {
  let content = ''

  // 判断是单引号还是双引号
  const quote = context.source[0]
  const isQuoted = quote === `"` || quote === `'`
  // 引号处理
  if (isQuoted) {
    advanceBy(context, 1)
    // 获取结束的 index
    const endIndex = context.source.indexOf(quote)
    // 获取指令的值。例如：v-if="isShow"，则值为 isShow
    if (endIndex === -1) {
      content = parseTextData(context, context.source.length)
    } else {
      content = parseTextData(context, endIndex)
      advanceBy(context, 1)
    }
  }

  return { content, isQuoted, loc: {} }
}

function parseText(context: ParseContext) {
  // 定义普通文本结束的标记 hello world </div> 那么文本结束的标记就为 <
  const endTokens = ['<', '{{']
  let endIndex = context.source.length

  // 计算精准的 endIndex
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  // 截取文本
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content,
  }
}
function parseTextData(context: ParseContext, length: number) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

function advanceBy(context: ParseContext, numberOfCharacters: number) {
  const { source } = context
  // 去除部分无效数据
  context.source = source.slice(numberOfCharacters)
}
// 右移非固定步数
function advanceSpaces(context: ParseContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

// 是否为标签结束的开始。 </div> 就是 div 标签结束的开始
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
