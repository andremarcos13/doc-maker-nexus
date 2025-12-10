import './FormActions.css'

function FormActions({ onClear }) {
  return (
    <div className="form-actions">
      <button type="submit" className="btn btn-primary">
        📄 Gerar PDF
      </button>
      <button 
        type="button" 
        onClick={onClear}
        className="btn btn-danger"
      >
        🗑️ Limpar Formulário
      </button>
    </div>
  )
}

export default FormActions

