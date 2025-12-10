import { useState, useEffect } from 'react'
import './ApiCard.css'

function ApiCard({ api, index, onRemove, onUpdate, canRemove }) {
  const [method, setMethod] = useState(api.method || '')

  useEffect(() => {
    setMethod(api.method || '')
  }, [api.method])

  const handleMethodChange = (e) => {
    const newMethod = e.target.value
    setMethod(newMethod)
    onUpdate('method', newMethod)
  }

  const showQueryParams = method === 'GET'
  const showBody = ['POST', 'PUT', 'PATCH'].includes(method)

  return (
    <div className="api-card">
      <div className="api-header">
        <h3>API {index}</h3>
        {canRemove && (
          <button 
            type="button" 
            className="btn-remove-api"
            onClick={onRemove}
            title="Remover API"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="form-group">
        <label>Título da API *</label>
        <input
          type="text"
          value={api.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          required
          placeholder="Ex: Buscar Clientes"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Método HTTP *</label>
          <select
            value={method}
            onChange={handleMethodChange}
            required
          >
            <option value="">Selecione...</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className="form-group">
          <label>Endpoint *</label>
          <input
            type="text"
            value={api.endpoint}
            onChange={(e) => onUpdate('endpoint', e.target.value)}
            required
            placeholder="Ex: /api/v1/clientes"
          />
        </div>
      </div>

      {showQueryParams && (
        <div className="form-group">
          <label>Query Parameters (separados por vírgula)</label>
          <input
            type="text"
            value={api.queryParams}
            onChange={(e) => onUpdate('queryParams', e.target.value)}
            placeholder="Ex: page=1, limit=10"
          />
        </div>
      )}

      {showBody && (
        <div className="form-group">
          <label>Body de Envio (JSON)</label>
          <textarea
            value={api.body}
            onChange={(e) => onUpdate('body', e.target.value)}
            rows="6"
            placeholder='Ex: {"nome": "João", "email": "joao@example.com"}'
          />
        </div>
      )}

      <div className="form-group">
        <label>Exemplo de Retorno 200 *</label>
        <textarea
          value={api.responseSuccess}
          onChange={(e) => onUpdate('responseSuccess', e.target.value)}
          rows="8"
          required
          placeholder='Ex: {"status": "success", "data": {...}}'
        />
      </div>

      <div className="form-group">
        <label>Exemplo de Retorno de Erro *</label>
        <textarea
          value={api.responseError}
          onChange={(e) => onUpdate('responseError', e.target.value)}
          rows="8"
          required
          placeholder='Ex: {"status": "error", "message": "..."}'
        />
      </div>
    </div>
  )
}

export default ApiCard

