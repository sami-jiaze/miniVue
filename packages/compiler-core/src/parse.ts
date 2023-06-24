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
  // 自闭合与非自闭合标签判断
  let isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)
  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    props: [],
    children: [],
  }
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

// 是否为标签结束的开始。 </div> 就是 div 标签结束的开始
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
