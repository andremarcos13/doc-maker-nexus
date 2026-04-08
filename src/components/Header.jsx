import "./Header.css";

function Header() {
  const isFileProtocol = window.location.protocol === "file:";

  return (
    <header className="header">
      <h1>Gerador de Documentação de APIs</h1>
    </header>
  );
}

export default Header;
