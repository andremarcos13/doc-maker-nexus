# Gerador de Documentação de APIs - React

Versão React do gerador de documentação de APIs para Nexus Projetos.

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Copie o logo para a pasta `public`:
```bash
cp "Logotipo_Nexus2 (1).png" public/
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Header.jsx
│   ├── ProjectInfo.jsx
│   ├── AuthSection.jsx
│   ├── ApiList.jsx
│   ├── ApiCard.jsx
│   ├── DocumentVersion.jsx
│   └── FormActions.jsx
├── utils/              # Utilitários
│   └── pdfGenerator.js # Lógica de geração de PDF
├── App.jsx             # Componente principal
├── App.css             # Estilos globais
├── main.jsx            # Ponto de entrada
└── index.css           # Reset CSS
```

## ✨ Vantagens da Versão React

- **Componentização**: Código organizado em componentes reutilizáveis
- **Estado Centralizado**: Gerenciamento de estado mais fácil
- **Extensibilidade**: Fácil adicionar novas funcionalidades
- **Manutenibilidade**: Código mais limpo e organizado
- **Customizações**: Facilita adicionar configurações avançadas de PDF

## 🔧 Próximas Melhorias Possíveis

- Preview do PDF em tempo real
- Templates de PDF customizáveis
- Exportação em outros formatos (Markdown, HTML)
- Configurações avançadas de estilo
- Histórico de documentos gerados
- Validação de JSON em tempo real

