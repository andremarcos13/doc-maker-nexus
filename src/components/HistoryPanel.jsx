import { useState, useEffect, useRef } from 'react'
import { getHistory, clearHistory, removeFromHistory } from '../utils/historyManager'
import './HistoryPanel.css'

function HistoryPanel({ onLoadDocument, onImportPdf }) {
  const [history, setHistory] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const saved = getHistory()
    setHistory(saved)
  }

  const handleLoad = (item) => {
    onLoadDocument(item.data)
    setIsOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este documento do histórico?')) {
      removeFromHistory(id)
      loadHistory()
    }
  }

  const handleClear = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      clearHistory()
      loadHistory()
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onImportPdf) return

    setImporting(true)
    try {
      await onImportPdf(file)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="history-panel">
      <div className="doc-load-actions">
        <button
          type="button"
          className="history-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '📚 Fechar Histórico' : `📚 Histórico (${history.length})`}
        </button>
        <button
          type="button"
          className="import-pdf-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? 'Importando PDF...' : '📄 Importar PDF'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={handleImport}
        />
      </div>

      {isOpen && (
        <div className="history-content">
          {history.length === 0 ? (
            <div className="history-empty">
              <p>Nenhum documento gerado ainda</p>
            </div>
          ) : (
            <>
              <div className="history-actions">
                <button onClick={handleClear} className="btn-clear-history">
                  🗑️ Limpar Histórico
                </button>
              </div>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-info">
                      <h4>{item.data.projectTitle || 'Sem título'}</h4>
                      <p className="history-meta">
                        Versão: {item.data.documentVersion} | 
                        {new Date(item.timestamp).toLocaleString('pt-BR')} |
                        {item.data.apis?.length || 0} API(s)
                      </p>
                    </div>
                    <div className="history-item-actions">
                      <button
                        onClick={() => handleLoad(item)}
                        className="btn-load"
                      >
                        📂 Carregar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default HistoryPanel

