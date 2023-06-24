export interface ParseContext {
  source: string
}

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContent(content)
  // console.log(context);
  parseChildren(context, [])
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
      if (/[a-z]i/.test(s[1])) {
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
      if (s.startsWith(ancestors[i].tag)) {
        return true
      }
    }
  }
  return !s
}

function pushNode(nodes, noder) {
  nodes.push(noder)
}

function parseElement(context: ParseContext, ancestors) {}
function parseTag(context: ParseContext, type: TagType) {
  // 获取标签名
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
  const tag = match[1]

  advanceBy(context, match[0].length)
  // 自闭合与非自闭合标签判断
  let isSelfClosing = context.source.startsWith('/>')
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    tag,
  }
}

function parseText(context: ParseContext) {}

function advanceBy(context: ParseContext, numberOfCharacters: number) {
  const { source } = context
  // 去除部分无效数据
  context.source = source.slice(numberOfCharacters)
}
