# 📚 Gerador de Documentação de APIs - Nexus Projetos

Sistema web profissional para gerar documentação de APIs em formato PDF a partir de dados coletados do Postman. Desenvolvido com React e Vite, oferece uma interface moderna e intuitiva para criação de documentação técnica completa.

![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF.svg)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5.1-orange.svg)

## 🎯 Funcionalidades

### ✨ Principais Recursos

- ✅ **Interface React Moderna**: Componentes reutilizáveis e interface responsiva
- ✅ **Preview em Tempo Real**: Visualize o PDF antes de gerar
- ✅ **Múltiplas APIs**: Adicione quantas APIs precisar
- ✅ **Autenticação Fixa**: Seção de autenticação OAuth2 padrão Protheus
- ✅ **Tabela de Query Parameters**: Visual estilo Postman para métodos GET
- ✅ **Syntax Highlighting**: JSON formatado com cores estilo Postman/VS Code
- ✅ **Sumário Interativo**: Links clicáveis para navegação no PDF
- ✅ **Configurações Avançadas**: Personalize cores, fontes e layouts
- ✅ **Templates Customizáveis**: Salve e reutilize configurações
- ✅ **Histórico de Documentos**: Acesse documentos gerados anteriormente

### 🎨 Design Profissional

- Badges coloridos para métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Cores padrão HTTP respeitadas
- Layout limpo e organizado
- Quebra de página automática
- Numeração de páginas
- Rodapé com versão e data

## 🚀 Instalação

### Pré-requisitos

- Node.js 16+ e npm (ou yarn/pnpm)

### Passos para Instalação

1. **Clone o repositório** (ou baixe os arquivos)

   ```bash
   git clone <url-do-repositorio>
   cd "MD PDF"
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**

   Abra seu navegador em `http://localhost:5173` (ou a porta indicada no terminal)

## 📖 Como Usar

### 1. Preencher Informações do Projeto

- **Título do Projeto**: Nome do seu projeto de APIs
- **Versão do Documento**: Versão da documentação (ex: 1.0.0)

### 2. Adicionar APIs

1. Clique em **"➕ Adicionar Nova API"**
2. Preencha os campos:
   - **Título da API**: Nome descritivo da API
   - **Método HTTP**: Selecione GET, POST, PUT, PATCH ou DELETE
   - **Endpoint**: URL completa do endpoint
   - **Query Parameters** (apenas para GET): Parâmetros de consulta
   - **Body** (apenas para POST/PUT/PATCH): Corpo da requisição em JSON
   - **Exemplo de Retorno 200**: JSON de resposta de sucesso
   - **Exemplo de Retorno de Erro**: JSON de resposta de erro

### 3. Visualizar Preview

- O preview é gerado automaticamente conforme você preenche os dados
- Use o botão **"🔄 Atualizar Preview"** para forçar atualização

### 4. Personalizar (Opcional)

- **Configurações**: Ajuste cores, fontes e espaçamentos
- **Templates**: Salve configurações para reutilizar
- **Histórico**: Acesse documentos gerados anteriormente

### 5. Gerar PDF

Clique em **"📄 Gerar PDF"** e o documento será baixado automaticamente.

## 📋 Estrutura do PDF Gerado

O PDF gerado contém as seguintes seções:

### 1. Capa

- Logo da Nexus Projetos (centralizada)
- Título do Projeto
- Design elegante e profissional

### 2. Sumário

- Links clicáveis para navegação
- Números de página
- Índice completo do documento

### 3. Autenticação

- Badge POST verde
- Endpoint de autenticação
- Explicação sobre tokens Bearer
- Exemplo de retorno

### 4. APIs do Projeto

Cada API contém:

- **Badge do método HTTP** (com cores padrão)
- **Título da API**
- **Endpoint** (em azul, estilo link)
- **Query Parameters** (tabela estilo Postman para GET)
- **Body de Envio** (bloco JSON formatado para POST/PUT/PATCH)
- **Exemplo de Retorno 200** (JSON com syntax highlighting)
- **Exemplo de Retorno de Erro** (JSON com syntax highlighting)

### 5. Rodapé

- Informações da empresa
- Versão do documento
- Data de geração
- Numeração de páginas

## 🎨 Características de Design

### Cores Padrão HTTP

- **GET**: `#27a5dd` (Azul)
- **POST**: `#4add27` (Verde)
- **PATCH**: `#dddd27` (Amarelo)
- **PUT**: `#e96d14` (Laranja)
- **DELETE**: `#e0331d` (Vermelho)

### Cores da Empresa

- **Primary**: `#e41e2d` (Vermelho)
- **Secondary**: `#696c71` (Cinza escuro)
- **Tertiary**: `#bebfc1` (Cinza claro)

### Syntax Highlighting JSON

- **Strings**: Amarelo/dourado (`#FFC66D`)
- **Números**: Verde (`#79C071`)
- **Chaves**: Azul claro (`#4FC1FF`)
- **Símbolos**: Branco
- **Fundo**: Cinza escuro (`#4a4a4a`)

## 📁 Estrutura do Projeto

```text
MD PDF/
├── public/
│   └── Logotipo_Nexus2 (1).png    # Logo da empresa
├── src/
│   ├── components/                # Componentes React
│   │   ├── ApiCard.jsx           # Card individual de API
│   │   ├── ApiList.jsx            # Lista de APIs
│   │   ├── AuthSection.jsx        # Seção de autenticação
│   │   ├── DocumentVersion.jsx     # Campo de versão
│   │   ├── FormActions.jsx        # Botões de ação
│   │   ├── Header.jsx             # Cabeçalho
│   │   ├── HistoryPanel.jsx       # Painel de histórico
│   │   ├── PDFPreview.jsx         # Preview do PDF
│   │   ├── ProjectInfo.jsx        # Informações do projeto
│   │   ├── SettingsPanel.jsx      # Painel de configurações
│   │   └── TemplateSelector.jsx   # Seletor de templates
│   ├── utils/                     # Utilitários
│   │   ├── pdfGenerator.js        # Geração do PDF
│   │   ├── pdfPreview.js          # Preview do PDF
│   │   ├── templateManager.js     # Gerenciamento de templates
│   │   └── historyManager.js      # Gerenciamento de histórico
│   ├── App.jsx                    # Componente principal
│   ├── main.jsx                   # Ponto de entrada
│   └── index.css                  # Estilos globais
├── index.html                     # HTML principal
├── package.json                   # Dependências
├── vite.config.js                 # Configuração do Vite
└── README.md                      # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- **React 18.2.0**: Framework JavaScript para interface
- **Vite 5.0.8**: Build tool e dev server
- **jsPDF 2.5.1**: Geração de PDFs no cliente
- **CSS3**: Estilização moderna e responsiva

## ⚙️ Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

## 🎯 Funcionalidades Avançadas

### Preview em Tempo Real

- Atualização automática conforme você digita
- Visualização instantânea do resultado final
- Botão de atualização manual

### Configurações Personalizáveis

- **Cores**: Personalize cores primárias, secundárias e terciárias
- **Cores JSON**: Ajuste cores do syntax highlighting
- **Fontes**: Escolha fontes principais e de código
- **Layout**: Ajuste margens e espaçamentos

### Templates

- Salve configurações personalizadas
- Templates padrão incluídos
- Carregue templates salvos rapidamente
- Delete templates não utilizados

### Histórico

- Acesse documentos gerados anteriormente
- Carregue dados de documentos anteriores
- Delete itens do histórico
- Limpe todo o histórico

## 📝 Notas Importantes

- A seção de autenticação é **fixa** e sempre será incluída no PDF
- Cada API sempre começa em uma nova página
- Query Parameters aparecem como tabela estilo Postman apenas para métodos GET
- Body aparece como bloco JSON formatado para POST, PUT e PATCH
- A logo deve estar na pasta `public/` para aparecer no PDF
- O PDF suporta quebra de página automática para conteúdo extenso
- Links no sumário são clicáveis e navegam para as seções correspondentes

## 🐛 Solução de Problemas

### Logo não aparece no PDF

- **Causa**: Logo não encontrada ou formato não suportado
- **Solução**: Certifique-se de que `Logotipo_Nexus2 (1).png` está na pasta `public/`
- O PDF será gerado normalmente mesmo sem a logo

### Preview não atualiza

- **Causa**: Dados inválidos ou erro na geração
- **Solução**:
  - Verifique se pelo menos uma API está completa (título, método e endpoint)
  - Abra o console do navegador (F12) para ver erros
  - Clique em "🔄 Atualizar Preview" manualmente

### PDF não está gerando

- Verifique se todos os campos obrigatórios estão preenchidos
- Abra o console do navegador (F12) para ver erros
- Certifique-se de ter pelo menos uma API válida

### Erros de CORS

- Este é um projeto React com Vite, então deve ser executado via `npm run dev`
- Não abra o `index.html` diretamente no navegador

## 📄 Licença

Este projeto foi desenvolvido para uso interno da **Nexus Consultoria em ERP**.

---

## 💝 Créditos

Desenvolvido para Nexus Consultoria em ERP
