export interface ParseContext {
  source: string
}

function createParserContent(content: string): ParseContext {
  return {
    source: content,
  }
}

export function baseParse(content: string) {
  const context = createParserContent(content)
  // console.log(context);
  parseChildren(context, [])
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
function parseText(context: ParseContext) {}
