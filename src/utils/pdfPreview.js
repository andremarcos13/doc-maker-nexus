import { generatePDFContent } from './pdfGenerator'

export async function generatePDFPreview(data) {
  try {
    // Garantir que os dados estão completos
    if (!data.projectTitle) {
      throw new Error('Título do projeto é obrigatório')
    }
    
    if (!data.apis || data.apis.length === 0) {
      throw new Error('Pelo menos uma API é necessária')
    }

    const pdf = await generatePDFContent(data, true) // true = preview mode
    
    if (!pdf) {
      throw new Error('PDF não foi gerado')
    }
    
    const blob = pdf.output('blob')
    
    if (!blob) {
      throw new Error('Blob não foi criado')
    }
    
    const url = URL.createObjectURL(blob)
    return url
  } catch (error) {
    console.error('Erro ao gerar preview:', error)
    throw error
  }
}

