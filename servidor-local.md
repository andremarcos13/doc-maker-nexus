# 🚀 Como Usar um Servidor Local

Para garantir que a logo apareça no PDF, é recomendado usar um servidor local. Aqui estão algumas opções:

## Opção 1: Live Server (VS Code) - Mais Fácil

1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito no arquivo `index.html`
3. Selecione "Open with Live Server"
4. O navegador abrirá automaticamente

## Opção 2: Python (já instalado na maioria dos sistemas)

Abra o terminal na pasta do projeto e execute:

```bash
# Python 3
python -m http.server 8000

# Ou Python 2
python -m SimpleHTTPServer 8000
```

Depois acesse: `http://localhost:8000`

## Opção 3: Node.js (http-server)

Se você tem Node.js instalado:

```bash
# Instalar globalmente (uma vez)
npm install -g http-server

# Executar na pasta do projeto
http-server
```

Depois acesse: `http://localhost:8080`

## Opção 4: PHP (se já tiver instalado)

```bash
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

---

**Nota**: Se você não usar um servidor local, o PDF ainda será gerado, mas a logo pode não aparecer devido a restrições de segurança do navegador.

