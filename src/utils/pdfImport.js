import { extractEmbeddedPayload } from './pdfPayload'
import { groupLines, parseProjectFromPages } from './pdfTextParser'

async function extractPdfPages(buffer) {
  const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ])
  GlobalWorkerOptions.workerSrc = workerModule.default

  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const document = await getDocument({ data }).promise
  const pages = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items
      .filter((item) => item.str)
      .map((item) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        fontSize: Math.abs(item.transform[0]) || item.height || 10,
        width: item.width || 0
      }))
    pages.push(groupLines(items))
  }

  return pages
}

export async function importProjectPdf(buffer) {
  const embedded = extractEmbeddedPayload(buffer)
  if (embedded?.apis?.length) return embedded

  let pages = []
  try {
    pages = await extractPdfPages(buffer)
  } catch {
    throw new Error('Não foi possível ler este PDF. Use um arquivo gerado por este site.')
  }

  const parsed = parseProjectFromPages(pages)
  if (parsed.apis.length === 0) {
    throw new Error('Não encontrei as APIs neste PDF. Use um arquivo gerado por este site.')
  }

  return { ...parsed, recoveredFromText: true }
}
