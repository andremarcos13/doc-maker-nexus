const PAYLOAD_MARKER = 'docmaker-nexus:'

export function buildPdfPayload(data) {
  return {
    source: 'doc-maker-nexus',
    projectTitle: data.projectTitle || '',
    documentVersion: data.documentVersion || '1.0.0',
    apis: (data.apis || []).map((api) => ({
      title: api.title || '',
      method: api.method || '',
      endpoint: api.endpoint || '',
      queryParams: api.queryParams || [],
      body: api.body || '',
      responseSuccess: api.responseSuccess || '',
      responseError: api.responseError || ''
    }))
  }
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

function decodeBase64(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new TextDecoder().decode(bytes)
}

export function embedProjectPayload(pdf, data) {
  const payload = buildPdfPayload(data)
  pdf.setProperties({
    title: payload.projectTitle,
    creator: 'doc-maker-nexus',
    keywords: PAYLOAD_MARKER + encodeBase64(JSON.stringify(payload))
  })
}

function bytesToLatin1(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let text = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    text += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return text
}

export function extractEmbeddedPayload(buffer) {
  const text = bytesToLatin1(buffer)
  const start = text.indexOf(PAYLOAD_MARKER)
  if (start < 0) return null

  const encoded = text.slice(start + PAYLOAD_MARKER.length).match(/^[A-Za-z0-9+/=]+/)
  if (!encoded) return null

  try {
    const payload = JSON.parse(decodeBase64(encoded[0]))
    if (payload?.source !== 'doc-maker-nexus' || !Array.isArray(payload.apis)) return null
    return payload
  } catch {
    return null
  }
}
