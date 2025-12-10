# 🚀 Funcionalidades Avançadas - Gerador de Documentação de APIs

## ✨ Funcionalidades Implementadas

### 1. 📄 Preview do PDF em Tempo Real
- **Visualização instantânea**: Veja como o PDF ficará antes de gerar
- **Atualização automática**: O preview é atualizado automaticamente quando você altera os dados
- **Botão de atualização manual**: Force uma atualização quando necessário
- **Interface responsiva**: Preview em uma coluna separada para melhor visualização

**Como usar:**
- O preview aparece automaticamente no lado direito da tela
- Preencha os dados do formulário e veja o resultado em tempo real
- Clique em "🔄 Atualizar Preview" para forçar uma nova geração

---

### 2. ⚙️ Configurações Avançadas de Estilo

#### 🎨 Cores
- **Cor Primária**: Cor principal usada em títulos e destaques
- **Cor Secundária**: Cor para textos secundários e links
- **Cor Terciária**: Cor para separadores e elementos terciários
- **Seletor visual**: Escolha cores usando o seletor de cores ou digite o código hex

#### 📝 Fontes
- **Fonte Principal**: Escolha entre Helvetica, Times ou Courier
- **Tamanho da Fonte Base**: Ajuste o tamanho base (8-14pt)
- **Fonte de Código**: Fonte usada nos blocos de código JSON

#### 📐 Layout
- **Margem**: Ajuste as margens da página (10-30mm)
- **Espaçamento entre Seções**: Controle o espaçamento (5-20mm)
- **Mostrar Números de Página**: Ative/desative numeração
- **Mostrar Sumário**: Ative/desative a página de sumário

#### 🎯 Estilo de Código
- **Fundo do Bloco de Código**: Cor de fundo dos blocos JSON
- **Borda do Bloco de Código**: Cor da borda dos blocos JSON

**Como usar:**
- Clique em "⚙️ Configurações Avançadas" para abrir o painel
- Ajuste as configurações conforme necessário
- As alterações são aplicadas imediatamente no preview

---

### 3. 📋 Templates de PDF Customizáveis

#### Templates Padrão
1. **Padrão Nexus**: Template com as cores oficiais da empresa
2. **Minimalista**: Design limpo e minimalista
3. **Escuro**: Tema escuro para visualização

#### Templates Customizados
- **Salvar Template Atual**: Salve suas configurações como um novo template
- **Gerenciar Templates**: Visualize, selecione e exclua templates
- **Preview Visual**: Veja as cores do template antes de aplicar

**Como usar:**
- Selecione um template clicando no card desejado
- Para salvar um template: ajuste as configurações e clique em "💾 Salvar Template Atual"
- Os templates são salvos localmente no navegador

---

### 4. 📚 Histórico de Documentos Gerados

#### Funcionalidades
- **Salvamento Automático**: Cada PDF gerado é automaticamente salvo no histórico
- **Carregar Documentos**: Recarregue documentos anteriores com um clique
- **Informações Detalhadas**: Veja título, versão, data e quantidade de APIs
- **Gerenciamento**: Exclua documentos individuais ou limpe todo o histórico
- **Limite**: Mantém até 50 documentos no histórico

**Como usar:**
- Clique em "📚 Histórico" para ver os documentos gerados
- Clique em "📂 Carregar" para recarregar um documento
- Use "🗑️" para excluir um documento específico
- "🗑️ Limpar Histórico" remove todos os documentos

---

## 🎯 Fluxo de Trabalho Recomendado

1. **Escolha um Template**: Selecione um template que se aproxime do que você precisa
2. **Ajuste as Configurações**: Use o painel de configurações para personalizar
3. **Preencha os Dados**: Adicione as informações do projeto e APIs
4. **Visualize o Preview**: Acompanhe o resultado em tempo real
5. **Salve como Template (Opcional)**: Se gostar das configurações, salve como template
6. **Gere o PDF**: Clique em "📄 Gerar PDF" quando estiver satisfeito

---

## 💾 Armazenamento Local

Todas as configurações e dados são salvos localmente no navegador:
- **Templates**: `localStorage` com chave `api_doc_templates`
- **Histórico**: `localStorage` com chave `api_doc_history`
- **Limite**: Até 50 itens no histórico

---

## 🔧 Personalização Avançada

### Criando Templates Personalizados

1. Ajuste todas as configurações no painel de configurações
2. Clique em "💾 Salvar Template Atual"
3. Dê um nome e descrição ao template
4. O template estará disponível para uso futuro

### Exportando Configurações

As configurações são armazenadas localmente. Para backup:
- Abra o DevTools (F12)
- Vá em Application > Local Storage
- Copie os valores das chaves `api_doc_templates` e `api_doc_history`

---

## 🎨 Dicas de Design

- **Cores**: Use cores que tenham bom contraste para leitura
- **Fontes**: Helvetica é mais moderna, Times é mais clássica
- **Margens**: Margens maiores (25-30mm) dão um visual mais espaçado
- **Código**: Fundos escuros (#0d1117) são melhores para código

---

## 🐛 Solução de Problemas

### Preview não atualiza
- Clique manualmente em "🔄 Atualizar Preview"
- Verifique se há erros no console (F12)

### Template não salva
- Verifique se o nome do template foi preenchido
- Limpe o cache do navegador se necessário

### Histórico não aparece
- Verifique se já gerou pelo menos um PDF
- Limpe o localStorage e tente novamente

---

## 📝 Notas

- O preview pode demorar alguns segundos para gerar em documentos grandes
- Templates customizados são salvos apenas no navegador atual
- O histórico é limitado a 50 documentos (mais antigos são removidos automaticamente)

