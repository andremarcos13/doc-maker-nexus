import './DocumentVersion.css'

function DocumentVersion({ documentVersion, onDocumentVersionChange }) {
  return (
    <section className="form-section">
      <h2>📌 Versão do Documento</h2>
      <div className="form-group">
        <label htmlFor="documentVersion">Versão *</label>
        <input
          type="text"
          id="documentVersion"
          value={documentVersion}
          onChange={(e) => onDocumentVersionChange(e.target.value)}
          required
          placeholder="Ex: 1.0.0"
        />
      </div>
    </section>
  )
}

export default DocumentVersion

