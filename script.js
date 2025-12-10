// Variáveis globais
let apiCount = 0;
const { jsPDF } = window.jspdf;

// Cores da empresa Nexus
const NEXUS_COLORS = {
  primary: "#e41e2d", // Vermelho
  secondary: "#696c71", // Cinza escuro
  tertiary: "#bebfc1", // Cinza claro
  white: "#ffffff",
};

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  addApi(); // Adiciona primeira API por padrão

  // Mostrar aviso se estiver usando file:// protocol
  if (window.location.protocol === "file:") {
    const warning = document.getElementById("corsWarning");
    if (warning) {
      warning.style.display = "block";
    }
  }
});

// Event Listeners
function initializeEventListeners() {
  document.getElementById("addApiBtn").addEventListener("click", addApi);
  document.getElementById("apiForm").addEventListener("submit", generatePDF);
  document.getElementById("clearFormBtn").addEventListener("click", clearForm);

  // Listener para mudança de método HTTP
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("api-method")) {
      toggleMethodFields(e.target);
    }
  });
}

// Adicionar nova API
function addApi() {
  apiCount++;
  const template = document.getElementById("apiTemplate");
  const clone = template.content.cloneNode(true);
  const apiCard = clone.querySelector(".api-card");

  apiCard.setAttribute("data-api-index", apiCount);
  clone.querySelector(".api-number").textContent = apiCount;

  // Event listener para remover API
  clone.querySelector(".btn-remove-api").addEventListener("click", () => {
    apiCard.remove();
    updateApiNumbers();
  });

  document.getElementById("apisContainer").appendChild(clone);
  updateApiNumbers();
}

// Atualizar números das APIs
function updateApiNumbers() {
  const apiCards = document.querySelectorAll(".api-card");
  apiCards.forEach((card, index) => {
    card.querySelector(".api-number").textContent = index + 1;
    card.setAttribute("data-api-index", index + 1);
  });
  apiCount = apiCards.length;
}

// Alternar campos baseado no método HTTP
function toggleMethodFields(selectElement) {
  const apiCard = selectElement.closest(".api-card");
  const queryParamsGroup = apiCard.querySelector(".query-params-group");
  const bodyGroup = apiCard.querySelector(".body-group");
  const method = selectElement.value;

  if (method === "GET") {
    queryParamsGroup.style.display = "block";
    bodyGroup.style.display = "none";
  } else if (["POST", "PUT", "PATCH"].includes(method)) {
    queryParamsGroup.style.display = "none";
    bodyGroup.style.display = "block";
  } else {
    queryParamsGroup.style.display = "none";
    bodyGroup.style.display = "none";
  }
}

// Coletar dados do formulário
function collectFormData() {
  const projectTitle = document.getElementById("projectTitle").value;
  const documentVersion = document.getElementById("documentVersion").value;

  const apis = [];
  document.querySelectorAll(".api-card").forEach((card) => {
    const method = card.querySelector(".api-method").value;
    const api = {
      title: card.querySelector(".api-title").value,
      method: method,
      endpoint: card.querySelector(".api-endpoint").value,
      queryParams:
        method === "GET" ? card.querySelector(".api-query-params").value : "",
      body: ["POST", "PUT", "PATCH"].includes(method)
        ? card.querySelector(".api-body").value
        : "",
      responseSuccess: card.querySelector(".api-response-success").value,
      responseError: card.querySelector(".api-response-error").value,
    };
    apis.push(api);
  });

  return {
    projectTitle,
    documentVersion,
    apis,
  };
}

// Converter imagem para base64
function imageToBase64(imgPath) {
  return new Promise((resolve) => {
    // Tentar usar fetch primeiro (funciona com servidor HTTP)
    if (
      window.location.protocol === "http:" ||
      window.location.protocol === "https:"
    ) {
      fetch(imgPath)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to load");
          return response.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // Se fetch falhar, tentar método Image
          tryImageLoad(imgPath, resolve);
        });
    } else {
      // Para file:// protocol, tentar carregar diretamente
      tryImageLoad(imgPath, resolve);
    }
  });
}

function tryImageLoad(imgPath, resolve) {
  const img = new Image();
  img.onload = () => {
    try {
      // Validar se a imagem carregou corretamente
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        console.warn("Imagem tem dimensões inválidas");
        resolve(null);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const dataUrl = canvas.toDataURL("image/png");
      // Validar se o dataURL foi gerado corretamente
      if (dataUrl && dataUrl.startsWith("data:image")) {
        resolve(dataUrl);
      } else {
        console.warn("DataURL inválido gerado");
        resolve(null);
      }
    } catch (e) {
      console.warn("Erro ao converter imagem:", e);
      resolve(null);
    }
  };
  img.onerror = () => {
    console.warn(
      "Não foi possível carregar a logo. O PDF será gerado sem a logo."
    );
    resolve(null);
  };
  // Tentar sem crossOrigin primeiro
  img.src = imgPath;
}

// Converter hex para RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Gerar PDF com abordagem estruturada
async function generatePDF(e) {
  e.preventDefault();

  if (!document.getElementById("apiForm").checkValidity()) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  const data = collectFormData();

  if (data.apis.length === 0) {
    alert("Adicione pelo menos uma API.");
    return;
  }

  try {
    // Carregar logo
    let logoBase64 = null;
    try {
      logoBase64 = await imageToBase64("Logotipo_Nexus2 (1).png");
      if (logoBase64 && !logoBase64.startsWith("data:image")) {
        logoBase64 = null;
      }
    } catch (error) {
      console.warn("Logo não pôde ser carregada:", error);
      logoBase64 = null;
    }

    // Nova implementação usando jsPDF diretamente
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const footerHeight = 15; // Altura reservada para o rodapé
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;
    const lineHeight = 7;
    const sectionSpacing = 15;

    // Adicionar rodapé e numeração de página
    const addFooterAndPageNumber = (pdfDoc, version) => {
      const pageNum = pdfDoc.internal.getNumberOfPages();
      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      pdfDoc.setFontSize(8);
      const gray = hexToRgb(NEXUS_COLORS.secondary);
      pdfDoc.setTextColor(gray.r, gray.g, gray.b);

      const footerText = `Nexus Nexus Consultoria em ERP | Versão: ${version} | Data: ${currentDate} | Página ${pageNum}`;
      pdfDoc.text(footerText, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });

      pdfDoc.setTextColor(0, 0, 0);
    };

    // Função auxiliar para adicionar nova página
    const addNewPage = () => {
      pdf.addPage();
      currentY = margin;
      addFooterAndPageNumber(pdf, data.documentVersion);
    };

    // Função para adicionar texto com quebra de linha automática
    const addText = (text, fontSize = 11, isBold = false, color = null) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont(undefined, "bold");
      } else {
        pdf.setFont(undefined, "normal");
      }
      if (color) {
        const rgb = hexToRgb(color);
        pdf.setTextColor(rgb.r, rgb.g, rgb.b);
      }

      const lines = pdf.splitTextToSize(text, contentWidth);
      // Garantir espaço para o rodapé (altura do rodapé + margem de segurança)
      if (
        currentY + lines.length * lineHeight >
        pageHeight - footerHeight - 5
      ) {
        addNewPage();
      }

      lines.forEach((line) => {
        pdf.text(line, margin, currentY);
        currentY += lineHeight;
      });

      if (color) {
        pdf.setTextColor(0, 0, 0); // Reset para preto
      }
    };

    // Função para adicionar código JSON formatado estilo Postman
    const addCodeBlock = (code, fontSize = 8.5) => {
      // Tentar formatar JSON se possível
      let formattedCode = code;
      try {
        const parsed = JSON.parse(code);
        formattedCode = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Se não for JSON válido, usar o código original
        formattedCode = code;
      }

      pdf.setFont("courier", "normal");

      // Cores estilo Postman
      const postmanBg = hexToRgb("#0d1117"); // Fundo escuro do Postman
      const postmanBorder = hexToRgb("#30363d"); // Borda sutil
      const postmanText = hexToRgb("#c9d1d9"); // Texto principal do Postman

      const codeLines = pdf.splitTextToSize(formattedCode, contentWidth - 20);
      const lineHeight = fontSize * 0.65;
      const padding = 10;
      const codeHeight = codeLines.length * lineHeight + padding * 2;

      // Garantir espaço para o rodapé
      if (currentY + codeHeight > pageHeight - footerHeight - 5) {
        addNewPage();
      }

      // Desenhar fundo estilo Postman com bordas arredondadas
      pdf.setFillColor(postmanBg.r, postmanBg.g, postmanBg.b);
      pdf.setDrawColor(postmanBorder.r, postmanBorder.g, postmanBorder.b);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(
        margin,
        currentY - 2,
        contentWidth,
        codeHeight,
        3,
        3,
        "FD"
      );

      // Adicionar texto com syntax highlighting
      pdf.setFontSize(fontSize);
      let yPos = currentY + padding;

      codeLines.forEach((line) => {
        let xPos = margin + padding;
        const tokens = tokenizeJsonLine(line);

        tokens.forEach((token) => {
          // Aplicar cor baseado no tipo do token (cores neutras)
          if (token.type === "string") {
            // Tom de cinza claro para strings
            pdf.setTextColor(220, 220, 220);
          } else if (token.type === "number") {
            // Tom de cinza médio para números
            pdf.setTextColor(190, 190, 190);
          } else if (token.type === "symbol") {
            pdf.setTextColor(255, 255, 255); // Branco para símbolos
          } else if (token.type === "key") {
            // Tom de cinza claro para chaves
            pdf.setTextColor(240, 240, 240);
          } else {
            pdf.setTextColor(201, 209, 217); // Cinza claro padrão
          }

          pdf.text(token.value, xPos, yPos);
          xPos += pdf.getTextWidth(token.value);
        });

        yPos += lineHeight;
      });

      currentY += codeHeight + 5;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
    };

    // Função para tokenizar linha JSON (versão simplificada e mais robusta)
    const tokenizeJsonLine = (line) => {
      const tokens = [];
      let i = 0;

      while (i < line.length) {
        const char = line[i];

        // String entre aspas duplas
        if (char === '"') {
          const start = i;
          i++;
          // Pular caracteres escapados
          while (i < line.length) {
            if (line[i] === "\\" && i + 1 < line.length) {
              i += 2;
            } else if (line[i] === '"') {
              i++;
              break;
            } else {
              i++;
            }
          }
          tokens.push({ type: "string", value: line.substring(start, i) });
        }
        // Número (inteiro ou decimal)
        else if (/\d/.test(char)) {
          const start = i;
          while (i < line.length && /[\d.]/.test(line[i])) {
            i++;
          }
          tokens.push({ type: "number", value: line.substring(start, i) });
        }
        // Símbolos JSON
        else if (/[{}[\]:,]/.test(char)) {
          tokens.push({ type: "symbol", value: char });
          i++;
        }
        // Espaços e tabs
        else if (/\s/.test(char)) {
          tokens.push({ type: "space", value: char });
          i++;
        }
        // Outros (chaves, palavras-chave)
        else {
          const start = i;
          while (i < line.length && !/[{}[\]:,"\s]/.test(line[i])) {
            i++;
          }
          if (i > start) {
            const value = line.substring(start, i);
            tokens.push({ type: "key", value: value });
          } else {
            i++;
          }
        }
      }

      return tokens;
    };

    // PÁGINA 1: Capa melhorada
    // Adicionar linha decorativa no topo
    const primaryColor = hexToRgb(NEXUS_COLORS.primary);
    pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setLineWidth(2);
    pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);

    if (logoBase64) {
      try {
        // Adicionar logo
        const logoWidth = 70;
        const logoHeight = 25;
        pdf.addImage(
          logoBase64,
          "PNG",
          (pageWidth - logoWidth) / 2,
          currentY + 10,
          logoWidth,
          logoHeight
        );
        currentY += logoHeight + 30;
      } catch (e) {
        console.warn("Erro ao adicionar logo:", e);
      }
    }

    // Título com destaque
    const titleColor = hexToRgb(NEXUS_COLORS.primary);
    pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
    pdf.setFontSize(26);
    pdf.setFont(undefined, "bold");
    const titleLines = pdf.splitTextToSize(data.projectTitle, contentWidth);
    titleLines.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, currentY + index * 10, { align: "center" });
    });
    currentY += titleLines.length * 10 + 20;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");

    // Adicionar linha decorativa na parte inferior
    pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setLineWidth(1);
    pdf.line(margin, currentY + 10, pageWidth - margin, currentY + 10);
    currentY += 30;

    addFooterAndPageNumber(pdf, data.documentVersion);

    // PÁGINA 2: Sumário melhorado
    addNewPage();
    const tocColor = hexToRgb(NEXUS_COLORS.primary);
    pdf.setTextColor(tocColor.r, tocColor.g, tocColor.b);
    pdf.setFontSize(20);
    pdf.setFont(undefined, "bold");
    pdf.text("Sumário", pageWidth / 2, currentY, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");
    currentY += 15;

    // Linha decorativa
    pdf.setDrawColor(tocColor.r, tocColor.g, tocColor.b);
    pdf.setLineWidth(1);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Adicionar itens do sumário com melhor formatação
    pdf.setFontSize(11);
    addText("1. Autenticação", 11, false);
    let apiIndex = 2;
    data.apis.forEach((api, index) => {
      addText(`${apiIndex}. ${api.title}`, 11, false);
      apiIndex++;
    });

    // PÁGINA 3: Autenticação melhorada
    addNewPage();
    const sectionColor = hexToRgb(NEXUS_COLORS.primary);
    pdf.setTextColor(sectionColor.r, sectionColor.g, sectionColor.b);
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("Autenticação", margin, currentY);
    pdf.setFont(undefined, "normal");

    // Linha decorativa abaixo do título
    pdf.setDrawColor(sectionColor.r, sectionColor.g, sectionColor.b);
    pdf.setLineWidth(1.5);
    pdf.line(margin, currentY + 3, margin + 60, currentY + 3);
    pdf.setTextColor(0, 0, 0);
    currentY += 12;

    addText(
      "API para busca do token Bearer para acesso às APIs Rest do Protheus",
      9.5,
      true
    );
    addText(
      "Mais detalhes sobre a configuração e dos modelos de autenticação disponível no link:",
      9
    );

    const linkColor = hexToRgb(NEXUS_COLORS.secondary);
    pdf.setTextColor(linkColor.r, linkColor.g, linkColor.b);
    addText(
      "https://tdn.totvs.com/pages/releaseview.action?pageId=465383509",
      9
    );
    pdf.setTextColor(0, 0, 0);

    currentY += 5;
    addText("O Endpoint /token", 10, true);
    addText(
      "Devido ao tráfego de usuário e senha para esse endpoint, ele é um servidor que recomendamos fortemente que seja acessado pelo protocolo seguro https. Caso seja utilizado sem o uso do SSL, uma mensagem é impressa no console do servidor a cada requisição que é respondida.",
      9
    );
    addText(
      "Seus parâmetros são trafegados via http headers conforme exemplo abaixo:",
      9
    );

    currentY += 5;
    addText("Métodos: POST", 9, true);
    addText(
      "URL: https://{host}/rest/api/oauth2/v1/token?grant_type=password",
      9
    );
    addText("POST /api/oauth2/v1/token", 9, true);
    addText("Host exemplo: https://localhost:8080/rest", 9);
    addText("Query Params: ?grant_type=password", 9);

    currentY += 5;
    addText("Headers:", 9, true);
    addCodeBlock("password : senha do usuário\nusername : usuário do sistema");

    currentY += 5;
    addText("Exemplo de retorno:", 9, true);
    const authResponse = `{
   "access_token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InBKd3RQdWJsaWNLZXlGb3IyNTYifQ.eyJpc3MiOiJUT1RWUy1BRFZQTC1GV0pXVCIsInN1YiI6Ik9SVVNQSVYiLCJpYXQiOjE2OTAyMzg0MTcsInVzZXJpZCI6IjAwMDEwNSIsImV4cCI6MTY5MDI0MjAxNywiZW52SWQiOiJRVUlURV9QUkQifQ.lZTZXNeGGi6TS3IQELsvFRYyrXXI-_gM4NYQHy9viO_xPfAVCrLDqtFEQi1lFME4VFjG2rR3YjRubsOf0BY_V3LuG0ydO7l1lG4_HKhFLVQ7CF_afVWGWSDZeAA8bRwMMs0AkfN46DRN6SzwsupeX6_qCbKWBSz8jhFN5-DMJ74JRgVOaF1zR6Mh7jNt-IjWqLNjrWi1kDH3XlfmXaUpitmgFyJK38cctcfNZP16BZf_ef5Fr6oM-FzUou326cfmVytr_8H5bdKc9B24EOo_xQwiJSXYBZs52vyx7NX3DpeW7i1dRgf00DcuXvAEKxe_Hn36Q4iSJZHLAitQMPkKAQ",
   "refresh_token":"nRZMn8psW01pWjCllRoCQ02S.hHNf_NIZVH5xeWrghy5jGyLsM9B3cscAR7fBqZwqOpggKu6R8SjsawPtRrVrI2oBN5b7y23W0tvUUtIUTDedREc_pU1pviCkmCQ0RNzSVWNtxJipoR4zRjXL-tguhZtyVjOov2jB2xjbKC8AUY0Hasj__qyTSdTjrQEHR8F9t_CQmvjRg0GsFh-eSMJJv7AzjhFqAB3WQkjJg.kcjs3wbCWbciFH92g7QkPCCY_yhoC2TVex4-LRo3aUNrBsL4nCAfV-Hq96wXYsvAOXve4gd8iecPOw0Vo2KGL-zVLmge13bQZ2_HEVe7k-O-ZeMnFCDmjVR7eJ3Gq33RaC27J5suIEnN6r9_9ZNr-Y5vS8zz2yxIoSSvEK3gbWdLL6k4U8i9wT0L11-neaerEu69GIxNEVasYXQU9K63zK_PJW137lls_BEb2tJXEMeeGqaCGLdweB30Cq5-YAS4QZ0R6Nit4xxx5NpYnZ1TnrcYNNK8AyrNpYILFFx5j9dnpwRezI7oy5R4juix1tByk4atX-Kcbjxu-50c2UD78w",
   "scope":"default",
   "token_type":"Bearer",
   "expires_in":3600
}`;
    addCodeBlock(authResponse);

    // PÁGINAS: APIs melhoradas
    addNewPage();
    const apisTitleColor = hexToRgb(NEXUS_COLORS.primary);
    pdf.setTextColor(apisTitleColor.r, apisTitleColor.g, apisTitleColor.b);
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("APIs do Projeto", margin, currentY);
    pdf.setFont(undefined, "normal");

    // Linha decorativa abaixo do título
    pdf.setDrawColor(apisTitleColor.r, apisTitleColor.g, apisTitleColor.b);
    pdf.setLineWidth(1.5);
    pdf.line(margin, currentY + 3, margin + 80, currentY + 3);
    pdf.setTextColor(0, 0, 0);
    currentY += 15;

    data.apis.forEach((api, index) => {
      // Garantir espaço suficiente para o rodapé
      if (currentY > pageHeight - footerHeight - 10) {
        addNewPage();
      }

      // Separador visual entre APIs (exceto a primeira)
      if (index > 0) {
        const separatorColor = hexToRgb(NEXUS_COLORS.tertiary);
        pdf.setDrawColor(separatorColor.r, separatorColor.g, separatorColor.b);
        pdf.setLineWidth(0.5);
        pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
        currentY += 8;
      }

      // Título da API com badge do método (cores neutras)
      const methodColors = {
        GET: NEXUS_COLORS.secondary, // Cinza escuro
        POST: NEXUS_COLORS.primary, // Vermelho da empresa
        PUT: NEXUS_COLORS.secondary, // Cinza escuro
        PATCH: NEXUS_COLORS.tertiary, // Cinza claro
        DELETE: NEXUS_COLORS.secondary, // Cinza escuro
      };

      const methodColor = methodColors[api.method] || NEXUS_COLORS.secondary;
      const methodRgb = hexToRgb(methodColor);

      // Desenhar badge do método melhorado com bordas arredondadas (menor)
      const badgeWidth = 20;
      const badgeHeight = 8;
      pdf.setFillColor(methodRgb.r, methodRgb.g, methodRgb.b);
      pdf.setDrawColor(methodRgb.r * 0.7, methodRgb.g * 0.7, methodRgb.b * 0.7);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(
        margin,
        currentY - 5,
        badgeWidth,
        badgeHeight,
        2,
        2,
        "FD"
      );
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont(undefined, "bold");
      pdf.text(api.method, margin + 2.5, currentY - 1);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);

      // Título da API
      pdf.setFontSize(13);
      pdf.setFont(undefined, "bold");
      const titleColor = hexToRgb(NEXUS_COLORS.primary);
      pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
      pdf.text(api.title, margin + 25, currentY - 1);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      currentY += 12;

      // Endpoint como texto normal (sem fundo)
      addText("Endpoint:", 10, true);
      pdf.setFont("courier", "normal");
      pdf.setFontSize(10);
      const endpointTextColor = hexToRgb(NEXUS_COLORS.secondary); // Cinza escuro para URL
      pdf.setTextColor(
        endpointTextColor.r,
        endpointTextColor.g,
        endpointTextColor.b
      );
      const endpointLines = pdf.splitTextToSize(api.endpoint, contentWidth);
      // Garantir espaço para o rodapé
      if (
        currentY + endpointLines.length * lineHeight >
        pageHeight - footerHeight - 5
      ) {
        addNewPage();
      }
      endpointLines.forEach((line) => {
        pdf.text(line, margin, currentY);
        currentY += lineHeight;
      });
      currentY += 3;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");

      // Query Params ou Body
      if (api.method === "GET" && api.queryParams) {
        const sectionTitleColor = hexToRgb(NEXUS_COLORS.secondary);
        pdf.setTextColor(
          sectionTitleColor.r,
          sectionTitleColor.g,
          sectionTitleColor.b
        );
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.text("Query Parameters:", margin, currentY);
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(0, 0, 0);
        currentY += 6;
        addCodeBlock(api.queryParams);
      } else if (["POST", "PUT", "PATCH"].includes(api.method) && api.body) {
        const sectionTitleColor = hexToRgb(NEXUS_COLORS.secondary);
        pdf.setTextColor(
          sectionTitleColor.r,
          sectionTitleColor.g,
          sectionTitleColor.b
        );
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.text("Body de Envio:", margin, currentY);
        pdf.setFont(undefined, "normal");
        pdf.setTextColor(0, 0, 0);
        currentY += 6;
        addCodeBlock(formatJSON(api.body));
      }

      // Resposta 200 (cor neutra)
      const successColor = hexToRgb(NEXUS_COLORS.secondary); // Cinza escuro
      pdf.setTextColor(successColor.r, successColor.g, successColor.b);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("Exemplo de Retorno 200:", margin, currentY);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      currentY += 6;
      addCodeBlock(formatJSON(api.responseSuccess));

      // Resposta de Erro (cor neutra)
      const errorColor = hexToRgb(NEXUS_COLORS.secondary); // Cinza escuro
      pdf.setTextColor(errorColor.r, errorColor.g, errorColor.b);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("Exemplo de Retorno de Erro:", margin, currentY);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      currentY += 6;
      addCodeBlock(formatJSON(api.responseError));

      currentY += sectionSpacing;
    });

    // Adicionar rodapé em todas as páginas
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooterAndPageNumber(pdf, data.documentVersion);
    }

    // Salvar PDF
    const fileName = `${data.projectTitle.replace(/[^a-z0-9]/gi, "_")}_v${
      data.documentVersion
    }.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
  }
}

// Criar conteúdo HTML para o PDF
function createPDFContent(data, logoBase64) {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Só incluir logo se for válida (não null, não vazia, e começa com data:)
  const logoImg =
    logoBase64 && logoBase64.startsWith("data:image")
      ? `<img src="${logoBase64}" alt="Nexus Consultoria em ERP" class="pdf-logo" onerror="this.remove()">`
      : "";

  let apisHTML = "";
  data.apis.forEach((api, index) => {
    const methodClass = api.method.toLowerCase();
    let paramsHTML = "";

    if (api.method === "GET" && api.queryParams) {
      paramsHTML = `
                <span class="pdf-label">Query Parameters:</span>
                <div class="pdf-code-block">${escapeHtml(api.queryParams)}</div>
            `;
    } else if (["POST", "PUT", "PATCH"].includes(api.method) && api.body) {
      paramsHTML = `
                <span class="pdf-label">Body de Envio:</span>
                <div class="pdf-code-block">${formatJSON(api.body)}</div>
            `;
    }

    apisHTML += `
            <div class="pdf-subsection">
                <div class="pdf-subsection-title">
                    <span class="pdf-method ${methodClass}">${api.method}</span>
                    ${escapeHtml(api.title)}
                </div>
                <span class="pdf-label">Endpoint:</span>
                <div class="pdf-endpoint">${escapeHtml(api.endpoint)}</div>
                ${paramsHTML}
                <span class="pdf-label">Exemplo de Retorno 200:</span>
                <div class="pdf-code-block">${formatJSON(
                  api.responseSuccess
                )}</div>
                <span class="pdf-label">Exemplo de Retorno de Erro:</span>
                <div class="pdf-code-block">${formatJSON(
                  api.responseError
                )}</div>
            </div>
        `;
  });

  return `
        <div class="pdf-container">
            <div class="pdf-header">
                ${logoImg}
                <h1 class="pdf-title">${escapeHtml(data.projectTitle)}</h1>
            </div>
            
            <div class="pdf-section">
                <h2 class="pdf-section-title">Autenticação</h2>
                <div class="pdf-subsection">
                    <p><strong>API para busca do token Bearer para acesso às APIs Rest do Protheus</strong></p>
                    <p>Mais detalhes sobre a configuração e dos modelos de autenticação disponível no link:</p>
                    <p><a href="https://tdn.totvs.com/pages/releaseview.action?pageId=465383509" style="color: #718096;">https://tdn.totvs.com/pages/releaseview.action?pageId=465383509</a></p>
                    
                    <h3 style="margin-top: 20px; margin-bottom: 10px; color: #2d3748;">O Endpoint /token</h3>
                    <p>Devido ao tráfego de usuário e senha para esse endpoint, ele é um servidor que recomendamos fortemente que seja acessado pelo protocolo seguro https. Caso seja utilizado sem o uso do SSL, uma mensagem é impressa no console do servidor a cada requisição que é respondida.</p>
                    <p>Seus parâmetros são trafegados via http headers conforme exemplo abaixo:</p>
                    
                    <p><strong>Métodos:</strong> POST</p>
                    <p><strong>URL:</strong> https://quite-prd-protheus.totvscloud.com.br:14808/rest/api/oauth2/v1/token?grant_type=password</p>
                    <p><strong>POST /api/oauth2/v1/token</strong></p>
                    <p><strong>Host exemplo:</strong> https://localhost:8080/rest</p>
                    <p><strong>Query Params:</strong> ?grant_type=password</p>
                    
                    <span class="pdf-label">Headers:</span>
                    <div class="pdf-code-block">password : senha do usuário
username : usuário do sistema</div>
                    
                    <span class="pdf-label">Exemplo de retorno:</span>
                    <div class="pdf-code-block">{
   "access_token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InBKd3RQdWJsaWNLZXlGb3IyNTYifQ.eyJpc3MiOiJUT1RWUy1BRFZQTC1GV0pXVCIsInN1YiI6Ik9SVVNQSVYiLCJpYXQiOjE2OTAyMzg0MTcsInVzZXJpZCI6IjAwMDEwNSIsImV4cCI6MTY5MDI0MjAxNywiZW52SWQiOiJRVUlURV9QUkQifQ.lZTZXNeGGi6TS3IQELsvFRYyrXXI-_gM4NYQHy9viO_xPfAVCrLDqtFEQi1lFME4VFjG2rR3YjRubsOf0BY_V3LuG0ydO7l1lG4_HKhFLVQ7CF_afVWGWSDZeAA8bRwMMs0AkfN46DRN6SzwsupeX6_qCbKWBSz8jhFN5-DMJ74JRgVOaF1zR6Mh7jNt-IjWqLNjrWi1kDH3XlfmXaUpitmgFyJK38cctcfNZP16BZf_ef5Fr6oM-FzUou326cfmVytr_8H5bdKc9B24EOo_xQwiJSXYBZs52vyx7NX3DpeW7i1dRgf00DcuXvAEKxe_Hn36Q4iSJZHLAitQMPkKAQ",
   "refresh_token":"nRZMn8psW01pWjCllRoCQ02S.hHNf_NIZVH5xeWrghy5jGyLsM9B3cscAR7fBqZwqOpggKu6R8SjsawPtRrVrI2oBN5b7y23W0tvUUtIUTDedREc_pU1pviCkmCQ0RNzSVWNtxJipoR4zRjXL-tguhZtyVjOov2jB2xjbKC8AUY0Hasj__qyTSdTjrQEHR8F9t_CQmvjRg0GsFh-eSMJJv7AzjhFqAB3WQkjJg.kcjs3wbCWbciFH92g7QkPCCY_yhoC2TVex4-LRo3aUNrBsL4nCAfV-Hq96wXYsvAOXve4gd8iecPOw0Vo2KGL-zVLmge13bQZ2_HEVe7k-O-ZeMnFCDmjVR7eJ3Gq33RaC27J5suIEnN6r9_9ZNr-Y5vS8zz2yxIoSSvEK3gbWdLL6k4U8i9wT0L11-neaerEu69GIxNEVasYXQU9K63zK_PJW137lls_BEb2tJXEMeeGqaCGLdweB30Cq5-YAS4QZ0R6Nit4xxx5NpYnZ1TnrcYNNK8AyrNpYILFFx5j9dnpwRezI7oy5R4juix1tByk4atX-Kcbjxu-50c2UD78w",
   "scope":"default",
   "token_type":"Bearer",
   "expires_in":3600
}</div>
                </div>
            </div>
            
            <div class="pdf-section">
                <h2 class="pdf-section-title">APIs do Projeto</h2>
                ${apisHTML}
            </div>
            
            <div class="pdf-footer">
                <p><strong>Nexus Consultoria em ERP</strong></p>
                <p>Versão: ${escapeHtml(
                  data.documentVersion
                )} | Data de Geração: ${currentDate}</p>
            </div>
        </div>
    `;
}

// Adicionar rodapé em todas as páginas do PDF
function addFooterToPDF(pdf, version) {
  const pageCount = pdf.internal.getNumberOfPages();
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(108, 117, 125);
    pdf.text(
      `Nexus Consultoria em ERP | Versão: ${version} | Data: ${currentDate}`,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
}

// Formatar JSON
function formatJSON(jsonString) {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Escapar HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Limpar formulário
function clearForm() {
  if (confirm("Tem certeza que deseja limpar todo o formulário?")) {
    document.getElementById("apiForm").reset();
    document.getElementById("apisContainer").innerHTML = "";
    apiCount = 0;
    addApi();
  }
}
