const HISTORY_KEY = 'api_doc_history'
const MAX_HISTORY_ITEMS = 50

export function saveToHistory(data) {
  const history = getHistory()
  const newItem = {
    id: `doc-${Date.now()}`,
    timestamp: Date.now(),
    data: {
      projectTitle: data.projectTitle,
      documentVersion: data.documentVersion,
      apis: data.apis.map(api => ({
        title: api.title,
        method: api.method,
        endpoint: api.endpoint,
        queryParams: api.queryParams,
        body: api.body,
        responseSuccess: api.responseSuccess,
        responseError: api.responseError
      }))
    }
  }

  // Adicionar no início e limitar quantidade
  const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function getHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    return []
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

export function removeFromHistory(id) {
  const history = getHistory()
  const updated = history.filter(item => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

