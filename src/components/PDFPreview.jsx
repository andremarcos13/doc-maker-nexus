import { useState, useEffect, useCallback, useRef } from 'react'
import { generatePDFPreview } from '../utils/pdfPreview'
import './PDFPreview.css'

function PDFPreview({ projectTitle, documentVersion, apis, settings, template }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const previewUrlRef = useRef(null)

  const generatePreview = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    
    // Limpar URL anterior
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    
    try {
      const validApis = apis.filter(api => api.title && api.method && api.endpoint)
      
      if (validApis.length === 0) {
        setError('Adicione pelo menos uma API válida para ver o preview')
        setIsGenerating(false)
        return
      }

      const url = await generatePDFPreview({
        projectTitle: projectTitle || 'Documento',
        documentVersion: documentVersion || '1.0.0',
        apis: validApis,
        settings: settings || {},
        template: template || {}
      })
      
      // Limpar URL anterior antes de definir nova
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      
      previewUrlRef.current = url
      setPreviewUrl(url)
    } catch (err) {
      console.error('Erro ao gerar preview:', err)
      setError(`Erro ao gerar preview: ${err.message || 'Erro desconhecido'}`)
      setPreviewUrl(null)
    } finally {
      setIsGenerating(false)
    }
  }, [projectTitle, documentVersion, apis, settings, template])

  useEffect(() => {
    // Debounce para evitar muitas chamadas
    const timer = setTimeout(() => {
      const hasValidApi = apis.some(api => api.title && api.method && api.endpoint)
      if (projectTitle && apis.length > 0 && hasValidApi) {
        generatePreview()
      } else {
        setPreviewUrl(null)
        setError(null)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      // Limpar URL ao desmontar
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [projectTitle, documentVersion, apis, settings, template, generatePreview])

  return (
    <div className="pdf-preview-container">
      <div className="pdf-preview-header">
        <h3>📄 Preview do PDF</h3>
        <button 
          onClick={generatePreview}
          disabled={isGenerating}
          className="btn-refresh"
        >
          {isGenerating ? '🔄 Gerando...' : '🔄 Atualizar Preview'}
        </button>
      </div>
      
      {error && (
        <div className="preview-error">
          ⚠️ {error}
        </div>
      )}
      
      {isGenerating && !previewUrl && (
        <div className="preview-loading">
          <div className="spinner"></div>
          <p>Gerando preview...</p>
        </div>
      )}
      
      {previewUrl && (
        <div className="preview-content">
          <iframe
            src={previewUrl}
            title="PDF Preview"
            className="pdf-iframe"
          />
        </div>
      )}
      
      {!previewUrl && !isGenerating && !error && (
        <div className="preview-placeholder">
          <p>Preencha os dados do formulário para ver o preview</p>
        </div>
      )}
    </div>
  )
}

export default PDFPreview

