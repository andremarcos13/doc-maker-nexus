import { useState } from 'react'
import './SettingsPanel.css'

function SettingsPanel({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="settings-panel">
      <button 
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '⚙️ Fechar Configurações' : '⚙️ Configurações Avançadas'}
      </button>
      
      {isOpen && (
        <div className="settings-content">
          <div className="settings-section">
            <h4>🎨 Cores</h4>
            <div className="settings-group">
              <label>
                Cor Primária
                <input
                  type="color"
                  value={settings.colors.primary}
                  onChange={(e) => handleChange('colors', {
                    ...settings.colors,
                    primary: e.target.value
                  })}
                />
                <input
                  type="text"
                  value={settings.colors.primary}
                  onChange={(e) => handleChange('colors', {
                    ...settings.colors,
                    primary: e.target.value
                  })}
                  className="color-input"
                />
              </label>
              <label>
                Cor Secundária
                <input
                  type="color"
                  value={settings.colors.secondary}
                  onChange={(e) => handleChange('colors', {
                    ...settings.colors,
                    secondary: e.target.value
                  })}
                />
                <input
                  type="text"
                  value={settings.colors.secondary}
                  onChange={(e) => handleChange('colors', {
                    ...settings.colors,
                    secondary: e.target.value
                  })}
                  className="color-input"
                />
              </label>
              <label>
                Cor Terciária
                <input
                  type="color"
                  value={settings.colors.tertiary}
                  onChange={(e) => handleChange('colors', {
                    ...settings.colors,
                    tertiary: e.target.value
                  })}
                />
                <input
                  type="text"
                  value={settings.colors.tertiary}
                  onChange={(e) => handleChange('colors', {
                    ...settings.colors,
                    tertiary: e.target.value
                  })}
                  className="color-input"
                />
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h4>📝 Fontes</h4>
            <div className="settings-group">
              <label>
                Fonte Principal
                <select
                  value={settings.fonts.main}
                  onChange={(e) => handleChange('fonts', {
                    ...settings.fonts,
                    main: e.target.value
                  })}
                >
                  <option value="helvetica">Helvetica</option>
                  <option value="times">Times</option>
                  <option value="courier">Courier</option>
                </select>
              </label>
              <label>
                Tamanho da Fonte Base
                <input
                  type="number"
                  min="8"
                  max="14"
                  value={settings.fonts.baseSize}
                  onChange={(e) => handleChange('fonts', {
                    ...settings.fonts,
                    baseSize: parseInt(e.target.value)
                  })}
                />
              </label>
              <label>
                Fonte de Código
                <select
                  value={settings.fonts.code}
                  onChange={(e) => handleChange('fonts', {
                    ...settings.fonts,
                    code: e.target.value
                  })}
                >
                  <option value="courier">Courier</option>
                  <option value="helvetica">Helvetica</option>
                </select>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h4>📐 Layout</h4>
            <div className="settings-group">
              <label>
                Margem (mm)
                <input
                  type="number"
                  min="10"
                  max="30"
                  value={settings.layout.margin}
                  onChange={(e) => handleChange('layout', {
                    ...settings.layout,
                    margin: parseInt(e.target.value)
                  })}
                />
              </label>
              <label>
                Espaçamento entre Seções
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={settings.layout.sectionSpacing}
                  onChange={(e) => handleChange('layout', {
                    ...settings.layout,
                    sectionSpacing: parseInt(e.target.value)
                  })}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.layout.showPageNumbers}
                  onChange={(e) => handleChange('layout', {
                    ...settings.layout,
                    showPageNumbers: e.target.checked
                  })}
                />
                Mostrar Números de Página
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.layout.showTableOfContents}
                  onChange={(e) => handleChange('layout', {
                    ...settings.layout,
                    showTableOfContents: e.target.checked
                  })}
                />
                Mostrar Sumário
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h4>🎯 Estilo de Código</h4>
            <div className="settings-group">
              <label>
                Fundo do Bloco de Código
                <input
                  type="color"
                  value={settings.codeStyle.backgroundColor}
                  onChange={(e) => handleChange('codeStyle', {
                    ...settings.codeStyle,
                    backgroundColor: e.target.value
                  })}
                />
                <input
                  type="text"
                  value={settings.codeStyle.backgroundColor}
                  onChange={(e) => handleChange('codeStyle', {
                    ...settings.codeStyle,
                    backgroundColor: e.target.value
                  })}
                  className="color-input"
                />
              </label>
              <label>
                Borda do Bloco de Código
                <input
                  type="color"
                  value={settings.codeStyle.borderColor}
                  onChange={(e) => handleChange('codeStyle', {
                    ...settings.codeStyle,
                    borderColor: e.target.value
                  })}
                />
                <input
                  type="text"
                  value={settings.codeStyle.borderColor}
                  onChange={(e) => handleChange('codeStyle', {
                    ...settings.codeStyle,
                    borderColor: e.target.value
                  })}
                  className="color-input"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPanel

