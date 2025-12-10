import { useState, useEffect } from 'react'
import { saveTemplate, loadTemplates, deleteTemplate } from '../utils/templateManager'
import './TemplateSelector.css'

const DEFAULT_TEMPLATES = [
  {
    id: 'default',
    name: 'Padrão Nexus',
    description: 'Template padrão com cores da empresa',
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
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Design limpo e minimalista',
    colors: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      tertiary: '#ecf0f1'
    },
    fonts: {
      main: 'helvetica',
      baseSize: 11,
      code: 'courier'
    },
    layout: {
      margin: 25,
      sectionSpacing: 20,
      showPageNumbers: true,
      showTableOfContents: true
    },
    codeStyle: {
      backgroundColor: '#f8f9fa',
      borderColor: '#dee2e6'
    }
  },
  {
    id: 'dark',
    name: 'Escuro',
    description: 'Tema escuro para visualização',
    colors: {
      primary: '#3498db',
      secondary: '#95a5a6',
      tertiary: '#34495e'
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
      backgroundColor: '#1a1a1a',
      borderColor: '#444'
    }
  }
]

function TemplateSelector({ currentTemplate, onTemplateChange }) {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
  const [customTemplates, setCustomTemplates] = useState([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  useEffect(() => {
    const saved = loadTemplates()
    setCustomTemplates(saved)
  }, [])

  const allTemplates = [...templates, ...customTemplates]

  const handleSelectTemplate = (template) => {
    onTemplateChange(template)
  }

  const handleSaveCurrent = () => {
    if (!templateName.trim()) {
      alert('Por favor, informe um nome para o template')
      return
    }

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: templateDescription || 'Template customizado',
      ...currentTemplate
    }

    const updated = [...customTemplates, newTemplate]
    setCustomTemplates(updated)
    saveTemplate(newTemplate)
    setShowSaveDialog(false)
    setTemplateName('')
    setTemplateDescription('')
  }

  const handleDeleteTemplate = (templateId) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      const updated = customTemplates.filter(t => t.id !== templateId)
      setCustomTemplates(updated)
      deleteTemplate(templateId)
    }
  }

  return (
    <div className="template-selector">
      <h3>📋 Templates de PDF</h3>
      
      <div className="template-actions">
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="btn-save-template"
        >
          💾 Salvar Template Atual
        </button>
      </div>

      {showSaveDialog && (
        <div className="save-template-dialog">
          <h4>Salvar Template</h4>
          <label>
            Nome do Template *
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ex: Template Corporativo"
            />
          </label>
          <label>
            Descrição
            <input
              type="text"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Descrição do template"
            />
          </label>
          <div className="dialog-actions">
            <button onClick={handleSaveCurrent} className="btn-primary">
              Salvar
            </button>
            <button onClick={() => setShowSaveDialog(false)} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="templates-grid">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${
              currentTemplate.id === template.id ? 'active' : ''
            }`}
            onClick={() => handleSelectTemplate(template)}
          >
            <div className="template-header">
              <h4>{template.name}</h4>
              {template.id.startsWith('custom-') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTemplate(template.id)
                  }}
                  className="btn-delete-template"
                  title="Excluir template"
                >
                  🗑️
                </button>
              )}
            </div>
            <p className="template-description">{template.description}</p>
            <div className="template-preview">
              <div
                className="color-preview"
                style={{ backgroundColor: template.colors.primary }}
              />
              <div
                className="color-preview"
                style={{ backgroundColor: template.colors.secondary }}
              />
              <div
                className="color-preview"
                style={{ backgroundColor: template.colors.tertiary }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateSelector

