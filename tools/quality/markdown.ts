export type MarkdownLink = {
  destination?: string
  line: number
  column: number
}

export type MarkdownDocument = {
  links: MarkdownLink[]
  anchors: Set<string>
}

type SourceLine = {
  number: number
  original: string
  searchable: string
}

const maskInlineCode = (line: string): string => {
  const characters = [...line]
  let index = 0
  while (index < characters.length) {
    if (characters[index] !== '`') {
      index += 1
      continue
    }
    let width = 1
    while (characters[index + width] === '`') width += 1
    const marker = '`'.repeat(width)
    const closing = line.indexOf(marker, index + width)
    if (closing < 0) break
    for (let position = index; position < closing + width; position += 1) {
      characters[position] = ' '
    }
    index = closing + width
  }
  return characters.join('')
}

const sourceLines = (content: string): SourceLine[] => {
  const lines = content.split(/\r?\n/)
  const result: SourceLine[] = []
  let fence: { marker: string; width: number } | null = null
  for (let index = 0; index < lines.length; index += 1) {
    const original = lines[index] ?? ''
    const match = original.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (match) {
      const token = match[1] ?? ''
      const marker = token[0] ?? ''
      if (!fence) fence = { marker, width: token.length }
      else if (marker === fence.marker && token.length >= fence.width) fence = null
      continue
    }
    if (!fence) {
      result.push({
        number: index + 1,
        original,
        searchable: maskInlineCode(original),
      })
    }
  }
  return result
}

const normalizeReference = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')

const stripHeadingMarkup = (value: string): string => value
  .replace(/<[^>]*>/g, '')
  .replace(/!?(?:\[([^\]]*)\]\([^)]*\)|\[([^\]]*)\]\[[^\]]*\])/g, '$1$2')
  .replace(/[`*_~]/g, '')
  .trim()

export const githubHeadingSlug = (value: string): string => stripHeadingMarkup(value)
  .toLocaleLowerCase('en')
  .replace(/[^\p{L}\p{N}\s_-]/gu, '')
  .trim()
  .replace(/\s+/g, '-')

const findClosingBracket = (line: string, start: number): number => {
  let depth = 1
  for (let index = start + 1; index < line.length; index += 1) {
    if (line[index - 1] === '\\') continue
    if (line[index] === '[') depth += 1
    if (line[index] === ']') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

const parseInlineDestination = (
  line: string,
  openParenthesis: number,
): { destination?: string; end: number } => {
  let index = openParenthesis + 1
  while (/\s/.test(line[index] ?? '')) index += 1
  if (line[index] === '<') {
    const closingAngle = line.indexOf('>', index + 1)
    if (closingAngle < 0) return { end: line.length }
    const destination = line.slice(index + 1, closingAngle)
    const closingParenthesis = line.indexOf(')', closingAngle + 1)
    return closingParenthesis < 0
      ? { end: line.length }
      : { destination, end: closingParenthesis + 1 }
  }

  const destinationStart = index
  let nested = 0
  let destinationEnd = -1
  let quote: string | null = null
  for (; index < line.length; index += 1) {
    const character = line[index] ?? ''
    if (line[index - 1] === '\\') continue
    if (quote) {
      if (character === quote) quote = null
      continue
    }
    if ((character === '"' || character === "'") && destinationEnd >= 0) {
      quote = character
      continue
    }
    if (character === '(' && destinationEnd < 0) {
      nested += 1
      continue
    }
    if (character === ')') {
      if (nested > 0 && destinationEnd < 0) {
        nested -= 1
        continue
      }
      const end = destinationEnd >= 0 ? destinationEnd : index
      const destination = line.slice(destinationStart, end).trim()
      return destination ? { destination, end: index + 1 } : { end: index + 1 }
    }
    if (/\s/.test(character) && nested === 0 && destinationEnd < 0) {
      destinationEnd = index
    }
  }
  return { end: line.length }
}

const looksLikeAutolink = (value: string): boolean =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\.{0,2}\/)/i.test(value)
  || /\.[a-z0-9]{1,8}(?:#.*)?$/i.test(value)

const extractLinks = (
  lines: SourceLine[],
  definitions: Map<string, string>,
): MarkdownLink[] => {
  const links: MarkdownLink[] = []
  for (const line of lines) {
    if (/^\s{0,3}\[[^\]]+\]:/.test(line.searchable)) continue
    const consumed: Array<[number, number]> = []
    let index = 0
    while (index < line.searchable.length) {
      const open = line.searchable.indexOf('[', index)
      if (open < 0) break
      const close = findClosingBracket(line.searchable, open)
      if (close < 0) {
        index = open + 1
        continue
      }
      const label = line.searchable.slice(open + 1, close)
      let next = close + 1
      while (/\s/.test(line.searchable[next] ?? '')) next += 1
      if (line.searchable[next] === '(') {
        const parsed = parseInlineDestination(line.searchable, next)
        links.push({
          ...(parsed.destination ? { destination: parsed.destination } : {}),
          line: line.number,
          column: open + 1,
        })
        consumed.push([open, parsed.end])
        index = parsed.end
        continue
      }
      if (line.searchable[next] === '[') {
        const referenceClose = findClosingBracket(line.searchable, next)
        if (referenceClose < 0) {
          links.push({ line: line.number, column: open + 1 })
          index = next + 1
          continue
        }
        const explicit = line.searchable.slice(next + 1, referenceClose)
        const destination = definitions.get(normalizeReference(explicit || label))
        links.push({
          ...(destination ? { destination } : {}),
          line: line.number,
          column: open + 1,
        })
        consumed.push([open, referenceClose + 1])
        index = referenceClose + 1
        continue
      }
      const shortcut = definitions.get(normalizeReference(label))
      if (shortcut) {
        links.push({ destination: shortcut, line: line.number, column: open + 1 })
        consumed.push([open, close + 1])
      }
      index = close + 1
    }

    const autolinkPattern = /<([^<>\s]+)>/g
    for (const match of line.searchable.matchAll(autolinkPattern)) {
      const start = match.index ?? 0
      const value = match[1] ?? ''
      if (!looksLikeAutolink(value)) continue
      if (consumed.some(([from, to]) => start >= from && start < to)) continue
      links.push({ destination: value, line: line.number, column: start + 1 })
    }
  }
  return links
}

export const parseMarkdown = (content: string): MarkdownDocument => {
  const lines = sourceLines(content)
  const definitions = new Map<string, string>()
  for (const line of lines) {
    const match = line.searchable.match(/^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/)
    if (!match) continue
    definitions.set(normalizeReference(match[1] ?? ''), match[2] ?? match[3] ?? '')
  }

  const anchors = new Set<string>()
  const counts = new Map<string, number>()
  for (const line of lines) {
    const heading = line.original.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/)
    if (heading) {
      const base = githubHeadingSlug(heading[1] ?? '')
      if (base) {
        const count = counts.get(base) ?? 0
        anchors.add(count === 0 ? base : `${base}-${count}`)
        counts.set(base, count + 1)
      }
    }
    const htmlIdPattern = /\s(?:id|name)=["']([^"']+)["']/gi
    for (const match of line.original.matchAll(htmlIdPattern)) {
      if (match[1]) anchors.add(match[1])
    }
  }

  return { links: extractLinks(lines, definitions), anchors }
}
