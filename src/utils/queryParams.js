export const PARAM_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object']

export function emptyQueryParam() {
  return { name: '', type: 'string', required: false, description: '' }
}

function toParam(raw) {
  const type = PARAM_TYPES.includes(raw?.type) ? raw.type : 'string'
  const required = raw?.required === true || raw?.required === 'true' || raw?.required === 'sim'
  return {
    name: String(raw?.name || raw?.key || ''),
    type,
    required,
    description: String(raw?.description || raw?.value || '')
  }
}

export function normalizeQueryParams(queryParams) {
  if (Array.isArray(queryParams)) {
    return queryParams.map(toParam)
  }

  if (typeof queryParams !== 'string' || !queryParams.trim()) return []

  const raw = queryParams.trim()
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(toParam)
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed).map((key) => toParam({
        name: key,
        description: parsed[key] == null ? '' : String(parsed[key])
      }))
    }
  } catch {
    // formato antigo: page=1, limit=10
  }

  return raw.split(/[,;&]/).map((part) => part.trim()).filter(Boolean).map((part) => {
    const eq = part.indexOf('=')
    if (eq > 0) {
      return toParam({
        name: part.slice(0, eq),
        description: part.slice(eq + 1)
      })
    }
    return toParam({ name: part })
  })
}
