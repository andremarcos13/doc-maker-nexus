import './ProjectInfo.css'

function ProjectInfo({ projectTitle, onProjectTitleChange }) {
  return (
    <section className="form-section">
      <h2>📋 Informações do Projeto</h2>
      <div className="form-group">
        <label htmlFor="projectTitle">Título do Projeto *</label>
        <input
          type="text"
          id="projectTitle"
          value={projectTitle}
          onChange={(e) => onProjectTitleChange(e.target.value)}
          required
          placeholder="Ex: API de Integração Protheus"
        />
      </div>
    </section>
  )
}

export default ProjectInfo

