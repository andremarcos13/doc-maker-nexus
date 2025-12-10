const TEMPLATES_KEY = 'api_doc_templates'

export function saveTemplate(template) {
  const templates = loadTemplates()
  const updated = [...templates, template]
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated))
}

export function loadTemplates() {
  try {
    const saved = localStorage.getItem(TEMPLATES_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Erro ao carregar templates:', error)
    return []
  }
}

export function deleteTemplate(templateId) {
  const templates = loadTemplates()
  const updated = templates.filter(t => t.id !== templateId)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated))
}

export function getTemplate(templateId) {
  const templates = loadTemplates()
  return templates.find(t => t.id === templateId)
}

