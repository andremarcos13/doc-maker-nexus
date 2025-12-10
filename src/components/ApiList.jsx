import { useState } from 'react'
import ApiCard from './ApiCard'
import './ApiList.css'

function ApiList({ apis, onAddApi, onRemoveApi, onUpdateApi }) {
  return (
    <section className="form-section">
      <h2>🔌 APIs do Projeto</h2>
      <div className="apis-container">
        {apis.map((api, index) => (
          <ApiCard
            key={api.id}
            api={api}
            index={index + 1}
            onRemove={() => onRemoveApi(api.id)}
            onUpdate={(field, value) => onUpdateApi(api.id, field, value)}
            canRemove={apis.length > 1}
          />
        ))}
      </div>
      <button 
        type="button" 
        onClick={onAddApi}
        className="btn btn-secondary"
      >
        ➕ Adicionar Nova API
      </button>
    </section>
  )
}

export default ApiList

