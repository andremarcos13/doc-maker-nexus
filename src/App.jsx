import { useState, useEffect } from 'react'
import Header from './components/Header'
import ProjectInfo from './components/ProjectInfo'
import AuthSection from './components/AuthSection'
import ApiList from './components/ApiList'
import DocumentVersion from './components/DocumentVersion'
import FormActions from './components/FormActions'
import PDFPreview from './components/PDFPreview'
import SettingsPanel from './components/SettingsPanel'
import TemplateSelector from './components/TemplateSelector'
import HistoryPanel from './components/HistoryPanel'
import { generatePDF } from './utils/pdfGenerator'
import { normalizeQueryParams } from './utils/queryParams'
import { saveToHistory } from './utils/historyManager'
import './App.css'

const DEFAULT_SETTINGS = {
  colors: {
    primary: '#e41e2d',
    secondary: '#696c71',
    tertiary: '#bebfc1'
  },
  fonts: {
    main: 'helvetica',
    baseSize: 10,
    code: 'courier'
  },
  layout: {
    margin: 20,
    sectionSpacing: 15,
    showPageNumbers: true,
    showTableOfContents: true
  },
  codeStyle: {
    backgroundColor: '#0d1117',
    borderColor: '#30363d'
  }
}

const DEFAULT_TEMPLATE = {
  id: 'default',
  name: 'Padrão Nexus',
  ...DEFAULT_SETTINGS
}

function App() {
  const [projectTitle, setProjectTitle] = useState('')
  const [documentVersion, setDocumentVersion] = useState('1.0.0')
  const [apis, setApis] = useState([
    {
      id: 1,
      title: '',
      method: '',
      endpoint: '',
      queryParams: [],
      body: '',
      responseSuccess: '',
      responseError: ''
    }
  ])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)

  const handleAddApi = () => {
    setApis([...apis, {
      id: Date.now(),
      title: '',
      method: '',
      endpoint: '',
      queryParams: [],
      body: '',
      responseSuccess: '',
      responseError: ''
    }])
  }

  const handleRemoveApi = (id) => {
    setApis(apis.filter(api => api.id !== id))
  }

  const handleUpdateApi = (id, field, value) => {
    setApis(prev => prev.map(api =>
      api.id === id ? { ...api, [field]: value } : api
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!projectTitle || !documentVersion) {
      alert('Por favor, preencha o título do projeto e a versão do documento.')
      return
    }

    const validApis = apis.filter(api => 
      api.title && api.method && api.endpoint && 
      api.responseSuccess && api.responseError
    )

    if (validApis.length === 0) {
      alert('Por favor, adicione pelo menos uma API válida.')
      return
    }

    const data = {
      projectTitle,
      documentVersion,
      apis: validApis,
      settings,
      template
    }

    // Salvar no histórico
    saveToHistory(data)

    // Gerar PDF
    await generatePDF(data)
  }

  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate)
    // Aplicar configurações do template
    setSettings({
      colors: newTemplate.colors,
      fonts: newTemplate.fonts,
      layout: newTemplate.layout,
      codeStyle: newTemplate.codeStyle
    })
  }

  const handleLoadDocument = (data) => {
    setProjectTitle(data.projectTitle || '')
    setDocumentVersion(data.documentVersion || '1.0.0')
    setApis(data.apis && data.apis.length > 0 
      ? data.apis.map((api, index) => ({
          id: Date.now() + index,
          title: api.title || '',
          method: api.method || '',
          endpoint: api.endpoint || '',
          queryParams: normalizeQueryParams(api.queryParams),
          body: api.body || '',
          responseSuccess: api.responseSuccess || '',
          responseError: api.responseError || ''
        }))
      : [{
          id: 1,
          title: '',
          method: '',
          endpoint: '',
          queryParams: [],
          body: '',
          responseSuccess: '',
          responseError: ''
        }]
    )
  }

  const handleClear = () => {
    if (confirm('Tem certeza que deseja limpar todo o formulário?')) {
      setProjectTitle('')
      setDocumentVersion('1.0.0')
      setApis([{
        id: 1,
        title: '',
        method: '',
        endpoint: '',
        queryParams: [],
        body: '',
        responseSuccess: '',
        responseError: ''
      }])
    }
  }

  return (
    <div className="container">
      <Header />
      
      <div className="main-layout">
        <div className="form-section-main">
          <HistoryPanel onLoadDocument={handleLoadDocument} />
          
          <TemplateSelector
            currentTemplate={template}
            onTemplateChange={handleTemplateChange}
          />
          
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />
          
          <form id="apiForm" onSubmit={handleSubmit}>
            <ProjectInfo 
              projectTitle={projectTitle}
              onProjectTitleChange={setProjectTitle}
            />
            
            <AuthSection />
            
            <ApiList
              apis={apis}
              onAddApi={handleAddApi}
              onRemoveApi={handleRemoveApi}
              onUpdateApi={handleUpdateApi}
            />
            
            <DocumentVersion
              documentVersion={documentVersion}
              onDocumentVersionChange={setDocumentVersion}
            />
            
            <FormActions onClear={handleClear} />
          </form>
        </div>
        
        <div className="preview-section">
          <PDFPreview
            projectTitle={projectTitle}
            documentVersion={documentVersion}
            apis={apis}
            settings={settings}
            template={template}
          />
        </div>
      </div>
    </div>
  )
}

export default App

