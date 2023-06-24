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
  console.log(context);
}
