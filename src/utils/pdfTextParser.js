import { PARAM_TYPES } from './queryParams.js'

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
const LABELS = [
  'Endpoint:',
  'Query Parameters:',
  'Body de Envio:',
  'Exemplo de Retorno 200:',
  'Exemplo de Retorno de Erro:'
]

export function groupLines(items) {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines = []

  sorted.forEach((item) => {
    const current = lines.find((line) => Math.abs(line.y - item.y) < 2)
    if (current) current.parts.push(item)
    else lines.push({ y: item.y, parts: [item] })
  })

  return lines.map((line) => {
    const parts = line.parts.sort((a, b) => a.x - b.x)
    return { y: line.y, parts, text: joinParts(parts) }
  })
}

function joinParts(parts) {
  let text = ''
  let cursor = null

  parts.forEach((part) => {
    if (cursor != null) {
      const gap = part.x - cursor
      const sample = part.fontSize * 0.45 || 4
      if (gap > sample && !part.str.startsWith(' ')) {
        const spaces = Math.max(1, Math.round(gap / sample))
        text += ' '.repeat(Math.min(spaces, 60))
      }
    }
    text += part.str
    cursor = part.x + (part.width || 0)
  })

  return text
}

function matchLabel(line) {
  const text = line.text.trim()
  return LABELS.find((label) => text === label) || null
}

function findApiHeading(line) {
  const methodPart = line.parts.find((part) => {
    const value = part.str.trim()
    return METHODS.has(value) && part.fontSize >= 10 && part.fontSize <= 16
  })
  if (!methodPart) return null

  const title = line.parts
    .filter((part) => part.x > methodPart.x + 1 && part.fontSize >= 11 && part.str.trim())
    .map((part) => part.str.trim())
    .join(' ')
    .trim()

  if (!title || title === 'Autenticação') return null
  return { method: methodPart.str.trim(), title }
}

function tryFormatJson(text) {
  const source = text.trim()
  if (!source) return ''

  const candidates = [source, unwrapVisualBreaks(source)]
  for (const candidate of candidates) {
    try {
      return JSON.stringify(JSON.parse(candidate), null, 2)
    } catch {
      // tenta o próximo formato
    }
  }
  return source
}

function unwrapVisualBreaks(text) {
  let result = ''
  let inString = false
  let escaped = false

  for (const char of text) {
    if (inString && (char === '\n' || char === '\r')) continue
    result += char
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\' && inString) {
      escaped = true
      continue
    }
    if (char === '"') inString = !inString
  }

  return result
}

function textBlock(lines) {
  return lines.map((line) => line.text.replace(/[ \t]+$/g, '')).join('\n').trim()
}

function isQueryHeader(line) {
  const names = new Set(line.parts.map((part) => part.str.trim()).filter(Boolean))
  return (names.has('Parâmetro') && names.has('Descrição')) || (names.has('Key') && names.has('Description'))
}

function parseQueryTable(lines) {
  const headerIndex = lines.findIndex(isQueryHeader)
  if (headerIndex < 0) return []

  const header = lines[headerIndex]
  const newFormat = header.parts.some((part) => part.str.trim() === 'Parâmetro')
  const labels = newFormat
    ? ['Parâmetro', 'Tipo', 'Obrigatório', 'Descrição']
    : ['Key', 'Value', 'Description']

  const columns = labels
    .map((label) => {
      const part = header.parts.find((item) => item.str.trim() === label)
      return part ? { label, x: part.x } : null
    })
    .filter(Boolean)

  const params = []
  lines.slice(headerIndex + 1).forEach((line) => {
    if (matchLabel(line)) return

    const cells = columns.map(() => [])
    line.parts.forEach((part) => {
      const value = part.str.trim()
      if (!value) return
      let best = 0
      let bestDistance = Infinity
      columns.forEach((column, index) => {
        const distance = Math.abs(part.x - column.x)
        if (distance < bestDistance) {
          bestDistance = distance
          best = index
        }
      })
      cells[best].push(value)
    })

    const byLabel = {}
    columns.forEach((column, index) => {
      byLabel[column.label] = cells[index].join(' ').trim()
    })

    if (newFormat) {
      const name = byLabel['Parâmetro'] || ''
      const description = byLabel['Descrição'] || ''
      if (!name && params.length && description) {
        params[params.length - 1].description += ` ${description}`
        return
      }
      if (!name) return
      const type = byLabel['Tipo'] || 'string'
      params.push({
        name,
        type: PARAM_TYPES.includes(type) ? type : 'string',
        required: /^sim$/i.test(byLabel['Obrigatório'] || ''),
        description
      })
      return
    }

    const name = byLabel.Key || ''
    if (!name) return
    params.push({
      name,
      type: 'string',
      required: false,
      description: byLabel.Description || byLabel.Value || ''
    })
  })

  return params
}

function fillApi(api, lines) {
  const sections = []
  let current = null

  lines.forEach((line) => {
    const label = matchLabel(line)
    if (label) {
      current = { label, lines: [] }
      sections.push(current)
      return
    }
    if (current) current.lines.push(line)
  })

  sections.forEach((section) => {
    if (section.label === 'Endpoint:') {
      api.endpoint = section.lines.map((line) => line.text.trim()).filter(Boolean).join('')
    } else if (section.label === 'Query Parameters:') {
      api.queryParams = parseQueryTable(section.lines)
    } else if (section.label === 'Body de Envio:') {
      api.body = tryFormatJson(textBlock(section.lines))
    } else if (section.label === 'Exemplo de Retorno 200:') {
      api.responseSuccess = tryFormatJson(textBlock(section.lines))
    } else if (section.label === 'Exemplo de Retorno de Erro:') {
      api.responseError = tryFormatJson(textBlock(section.lines))
    }
  })
}

export function parseProjectFromPages(pages) {
  const allLines = pages.flat()
  let documentVersion = '1.0.0'
  for (const line of allLines) {
    const match = line.text.match(/Versão:\s*([^\s|]+)/)
    if (match) {
      documentVersion = match[1]
      break
    }
  }

  const projectTitle = (pages[0] || [])
    .filter((line) => line.parts.some((part) => part.fontSize >= 24) && !line.text.includes('Versão:'))
    .map((line) => line.text.trim())
    .filter(Boolean)
    .join(' ')
    .trim()

  let started = false
  const lines = []
  pages.forEach((page) => {
    page.forEach((line) => {
      if (!started) {
        if (line.text.includes('APIs do Projeto')) started = true
        return
      }
      if (line.text.includes('Nexus Consultoria em ERP')) return
      lines.push(line)
    })
  })

  const apis = []
  let index = 0
  while (index < lines.length) {
    const heading = findApiHeading(lines[index])
    if (!heading) {
      index += 1
      continue
    }

    const block = []
    index += 1
    while (index < lines.length && !findApiHeading(lines[index])) {
      block.push(lines[index])
      index += 1
    }

    const api = {
      title: heading.title,
      method: heading.method,
      endpoint: '',
      queryParams: [],
      body: '',
      responseSuccess: '',
      responseError: ''
    }
    fillApi(api, block)
    apis.push(api)
  }

  return { projectTitle, documentVersion, apis }
}
