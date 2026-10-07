import { useState, useEffect } from 'react'
import { PARAM_TYPES, emptyQueryParam, normalizeQueryParams } from '../utils/queryParams'
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
    if (newMethod === 'GET' && normalizeQueryParams(api.queryParams).length === 0) {
      onUpdate('queryParams', [emptyQueryParam()])
    }
  }

  const params = normalizeQueryParams(api.queryParams)

  const updateParam = (paramIndex, field, value) => {
    const next = params.map((param, i) =>
      i === paramIndex ? { ...param, [field]: value } : param
    )
    onUpdate('queryParams', next)
  }

  const addParam = () => {
    onUpdate('queryParams', [...params, emptyQueryParam()])
  }

  const removeParam = (paramIndex) => {
    onUpdate('queryParams', params.filter((_, i) => i !== paramIndex))
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
          <label>Query Parameters</label>
          <div className="params-table-wrap">
            <table className="params-table">
              <thead>
                <tr>
                  <th>Parâmetro</th>
                  <th>Tipo</th>
                  <th>Obrigatório</th>
                  <th>Descrição</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {params.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="params-empty">Nenhum parâmetro</td>
                  </tr>
                ) : params.map((param, paramIndex) => (
                  <tr key={paramIndex}>
                    <td>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParam(paramIndex, 'name', e.target.value)}
                        placeholder="page"
                      />
                    </td>
                    <td>
                      <select
                        value={param.type}
                        onChange={(e) => updateParam(paramIndex, 'type', e.target.value)}
                      >
                        {PARAM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="params-required">
                      <label>
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => updateParam(paramIndex, 'required', e.target.checked)}
                        />
                        Sim
                      </label>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => updateParam(paramIndex, 'description', e.target.value)}
                        placeholder="Número da página"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-remove-param"
                        onClick={() => removeParam(paramIndex)}
                        title="Remover parâmetro"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn-add-param" onClick={addParam}>
              + Adicionar parâmetro
            </button>
          </div>
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

