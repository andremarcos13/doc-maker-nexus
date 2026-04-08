import "./Header.css";

function Header() {
  const isFileProtocol = window.location.protocol === "file:";

  return (
    <header className="header">
      <h1>Gerador de Documentação de APIs</h1>

      {isFileProtocol && (
        <div className="cors-warning">
          ⚠️ <strong>Dica:</strong> Para garantir que a logo apareça no PDF, use
          um servidor local (ex: Live Server no VS Code) ao invés de abrir o
          arquivo diretamente.
        </div>
      )}
    </header>
  );
}

export default Header;
