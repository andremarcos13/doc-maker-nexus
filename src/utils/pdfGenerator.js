import { jsPDF } from "jspdf";
import { normalizeQueryParams } from "./queryParams";

// Cores padrão da empresa Nexus (serão sobrescritas pelas settings)
const DEFAULT_COLORS = {
  primary: "#e41e2d", // Vermelho
  secondary: "#696c71", // Cinza escuro
  tertiary: "#bebfc1", // Cinza claro
  white: "#ffffff",
};

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

// Converter imagem para Base64
function imageToBase64(imgPath) {
  return new Promise((resolve) => {
    // Tentar fetch primeiro (para http/https)
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      fetch(imgPath)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => tryImageLoad(imgPath, resolve);
          reader.readAsDataURL(blob);
        })
        .catch(() => tryImageLoad(imgPath, resolve));
    } else {
      tryImageLoad(imgPath, resolve);
    }
  });
}

function tryImageLoad(imgPath, resolve) {
  const img = new Image();
  img.onload = () => {
    try {
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
  img.src = imgPath;
}

// Formatar JSON
function formatJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Gerar conteúdo do PDF (usado tanto para preview quanto para download)
export async function generatePDFContent(data, isPreview = false) {
  let pdf = null;
  try {
    // Obter configurações do template ou usar padrões
    const settings = data.settings || data.template || {};
    const colors = settings.colors || DEFAULT_COLORS;
    const fonts = settings.fonts || {
      main: "helvetica",
      baseSize: 10,
      code: "courier",
    };
    const layout = settings.layout || {
      margin: 20,
      sectionSpacing: 15,
      showPageNumbers: true,
      showTableOfContents: true,
    };
    const codeStyle = settings.codeStyle || {
      backgroundColor: "#0d1117",
      borderColor: "#30363d",
    };

    // Carregar logo
    let logoBase64 = null;
    try {
      logoBase64 = await imageToBase64("/Logotipo_Nexus2 (1).png");
      if (logoBase64 && !logoBase64.startsWith("data:image")) {
        logoBase64 = null;
      }
    } catch (error) {
      console.warn("Logo não pôde ser carregada:", error);
      logoBase64 = null;
    }

    // Nova implementação usando jsPDF diretamente
    pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = layout.margin || 20;
    const footerHeight = 15; // Altura reservada para o rodapé
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;
    const lineHeight = fonts.baseSize * 0.7 || 7;
    const sectionSpacing = layout.sectionSpacing || 15;

    // Adicionar rodapé e numeração de página - Design Premium
    const addFooterAndPageNumber = (pdfDoc, version, pageNum) => {
      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      // Linha decorativa sutil acima do rodapé
      const footerGray = hexToRgb(colors.secondary || DEFAULT_COLORS.secondary);
      pdfDoc.setDrawColor(
        footerGray.r * 0.5,
        footerGray.g * 0.5,
        footerGray.b * 0.5
      );
      pdfDoc.setLineWidth(0.3);
      pdfDoc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(footerGray.r, footerGray.g, footerGray.b);

      const footerText = `Nexus Consultoria em ERP | Versão: ${version} | Data: ${currentDate} | Página ${pageNum}`;
      pdfDoc.text(footerText, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });

      pdfDoc.setTextColor(0, 0, 0);
    };

    // Função auxiliar para adicionar nova página
    const addNewPage = () => {
      pdf.addPage();
      currentY = margin;
      // Rodapé será adicionado depois em todas as páginas exceto a capa
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

    // Função para adicionar código JSON formatado estilo Postman (com suporte a quebra de página)
    const addCodeBlock = (code, fontSize = 8.5) => {
      // Tentar formatar JSON se possível
      let formattedCode = code;
      try {
        const parsed = JSON.parse(code);
        formattedCode = JSON.stringify(parsed, null, 2);
      } catch (e) {
        formattedCode = code;
      }

      pdf.setFont(fonts.code || "courier", "normal");

      // Cores estilo Postman (usar do codeStyle se disponível, mas com cinza mais claro)
      const postmanBg = hexToRgb(codeStyle.backgroundColor || "#4a4a4a"); // Cinza mais claro para melhor legibilidade
      const postmanBorder = hexToRgb(codeStyle.borderColor || "#30363d");

      const codeLines = pdf.splitTextToSize(formattedCode, contentWidth - 20);
      const lineHeight = fontSize * 0.7;
      const padding = 6; // Padding reduzido

      // Altura disponível para o código (descontando padding e margem do rodapé)
      const availableHeight =
        pageHeight - footerHeight - currentY - padding * 2 - 5;
      const maxLinesPerPage = Math.floor(availableHeight / lineHeight);

      let lineIndex = 0;
      let isFirstPage = true;

      while (lineIndex < codeLines.length) {
        // Calcular quantas linhas cabem na página atual
        const availableHeightForPage =
          pageHeight - footerHeight - currentY - padding * 2 - 5;
        const linesForThisPage = Math.min(
          Math.floor(availableHeightForPage / lineHeight),
          codeLines.length - lineIndex
        );

        // Se não há espaço suficiente, adicionar nova página
        if (
          linesForThisPage <= 0 ||
          currentY + padding + lineHeight > pageHeight - footerHeight - 5
        ) {
          addNewPage();
          isFirstPage = false;
          continue;
        }

        const pageCodeHeight = linesForThisPage * lineHeight + padding * 2;
        const startY = currentY;

        // Desenhar fundo estilo Postman para esta página
        pdf.setFillColor(postmanBg.r, postmanBg.g, postmanBg.b);
        pdf.setDrawColor(postmanBorder.r, postmanBorder.g, postmanBorder.b);
        pdf.setLineWidth(0.5);

        // Se for a primeira página, bordas arredondadas no topo
        // Se for a última página, bordas arredondadas na parte inferior
        // Se for página do meio, sem bordas arredondadas
        const isLastPage = lineIndex + linesForThisPage >= codeLines.length;

        // Desenhar bloco com bordas retas (sem arredondamento)
        pdf.rect(margin, startY - 2, contentWidth, pageCodeHeight, "FD");

        // Adicionar texto com syntax highlighting melhorado
        pdf.setFontSize(fontSize);
        let yPos = startY + padding;

        // Desenhar as linhas desta página
        for (
          let i = 0;
          i < linesForThisPage && lineIndex < codeLines.length;
          i++
        ) {
          const line = codeLines[lineIndex];
          let xPos = margin + padding;
          const tokens = tokenizeJsonLine(line);

          tokens.forEach((token) => {
            // Aplicar cores realistas estilo Postman/VS Code
            if (token.type === "string") {
              // Amarelo/dourado para valores string (valores após :)
              pdf.setTextColor(255, 198, 109);
            } else if (token.type === "number") {
              // Verde para números
              pdf.setTextColor(121, 192, 113);
            } else if (token.type === "symbol") {
              // Branco para símbolos { } [ ] : ,
              pdf.setTextColor(255, 255, 255);
            } else if (token.type === "key") {
              // Azul claro para chaves/propriedades (antes de :)
              pdf.setTextColor(79, 193, 255);
            } else if (token.type === "space") {
              // Espaços mantêm a cor atual (não mudam cor)
              // Não precisa mudar cor para espaços
            } else {
              // Cinza claro para outros (palavras-chave como true, false, null)
              pdf.setTextColor(201, 209, 217);
            }

            // Só desenhar se não for espaço (espaços são tratados pelo posicionamento)
            if (token.type !== "space") {
              pdf.text(token.value, xPos, yPos);
              xPos += pdf.getTextWidth(token.value);
            } else {
              // Para espaços, apenas avançar a posição
              xPos += pdf.getTextWidth(token.value);
            }
          });

          yPos += lineHeight;
          lineIndex++;
        }

        currentY = startY + pageCodeHeight;
        isFirstPage = false;
      }

      currentY += 5; // Espaçamento após o bloco de código
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(fonts.main || "helvetica", "normal");
    };

    const addQueryParamsTable = (queryParams) => {
      const params = normalizeQueryParams(queryParams).filter((p) => p.name.trim());
      if (params.length === 0) return;

      const tableBg = hexToRgb(codeStyle.backgroundColor || "#4a4a4a");
      const tableBorder = hexToRgb(codeStyle.borderColor || "#30363d");
      const headerBg = hexToRgb("#333333");

      const rowHeight = 8;
      const headerHeight = 10;
      const colPadding = 3;

      const nameColWidth = contentWidth * 0.22;
      const typeColWidth = contentWidth * 0.16;
      const requiredColWidth = contentWidth * 0.18;
      const descColWidth = contentWidth * 0.44;
      const columns = [
        { label: "Parâmetro", width: nameColWidth },
        { label: "Tipo", width: typeColWidth },
        { label: "Obrigatório", width: requiredColWidth },
        { label: "Descrição", width: descColWidth },
      ];

      const tableHeight = headerHeight + params.length * rowHeight;
      if (currentY + tableHeight > pageHeight - footerHeight - 5) {
        addNewPage();
      }

      const tableStartY = currentY;
      const tableWidth = contentWidth;

      pdf.setFillColor(tableBg.r, tableBg.g, tableBg.b);
      pdf.rect(
        margin,
        tableStartY + headerHeight - 2,
        tableWidth,
        tableHeight - headerHeight,
        "F"
      );

      pdf.setFillColor(headerBg.r, headerBg.g, headerBg.b);
      pdf.rect(margin, tableStartY - 2, tableWidth, headerHeight, "F");

      pdf.setDrawColor(tableBorder.r, tableBorder.g, tableBorder.b);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, tableStartY - 2, tableWidth, tableHeight, "D");

      pdf.setFontSize(8);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(255, 255, 255);

      let headerX = margin;
      columns.forEach((col) => {
        pdf.text(col.label, headerX + colPadding, tableStartY + 5);
        headerX += col.width;
      });

      pdf.setFont(undefined, "normal");

      let rowY = tableStartY + headerHeight;
      const keyColor = hexToRgb("#4FC1FF");
      const typeColor = hexToRgb("#FFC66D");
      const descColor = hexToRgb("#C9D1D9");

      params.forEach((param, index) => {
        if (index % 2 === 1) {
          const altBg = hexToRgb("#3a3a3a");
          pdf.setFillColor(altBg.r, altBg.g, altBg.b);
          pdf.rect(margin, rowY, tableWidth, rowHeight, "F");
        }

        pdf.setDrawColor(
          tableBorder.r * 0.7,
          tableBorder.g * 0.7,
          tableBorder.b * 0.7
        );
        pdf.setLineWidth(0.3);
        pdf.line(margin, rowY + rowHeight, margin + tableWidth, rowY + rowHeight);

        pdf.setFontSize(8);
        const cells = [
          { text: param.name, color: keyColor },
          { text: param.type, color: typeColor },
          { text: param.required ? "Sim" : "Não", color: descColor },
          { text: param.description, color: descColor },
        ];

        let cellX = margin;
        cells.forEach((cell, cellIndex) => {
          pdf.setTextColor(cell.color.r, cell.color.g, cell.color.b);
          const lines = pdf.splitTextToSize(
            cell.text || "",
            columns[cellIndex].width - colPadding * 2
          );
          pdf.text(lines[0] || "", cellX + colPadding, rowY + 5);
          cellX += columns[cellIndex].width;
        });

        rowY += rowHeight;
      });

      pdf.setDrawColor(
        tableBorder.r * 0.8,
        tableBorder.g * 0.8,
        tableBorder.b * 0.8
      );
      pdf.setLineWidth(0.3);
      let dividerX = margin;
      columns.slice(0, -1).forEach((col) => {
        dividerX += col.width;
        pdf.line(
          dividerX,
          tableStartY + headerHeight - 2,
          dividerX,
          tableStartY + tableHeight - 2
        );
      });

      currentY = tableStartY + tableHeight + 5;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(fonts.main || "helvetica", "normal");
    };

    // Função para tokenizar linha JSON (melhorada para diferenciar chaves de valores)
    const tokenizeJsonLine = (line) => {
      const tokens = [];
      let i = 0;
      let expectingValue = false; // Flag para saber se estamos esperando um valor (após :)

      while (i < line.length) {
        const char = line[i];

        // String entre aspas duplas
        if (char === '"') {
          const start = i;
          i++;
          while (i < line.length) {
            if (line[i] === "\\" && i + 1 < line.length) {
              i += 2; // Pular caractere escapado
            } else if (line[i] === '"') {
              i++;
              break;
            } else {
              i++;
            }
          }
          const stringValue = line.substring(start, i);

          // Se estamos esperando um valor (após :), é um valor string
          // Caso contrário, é uma chave
          if (expectingValue) {
            tokens.push({ type: "string", value: stringValue });
            expectingValue = false; // Valor processado
          } else {
            tokens.push({ type: "key", value: stringValue });
          }
        }
        // Número (inteiro ou decimal) - sempre é um valor
        else if (
          /\d/.test(char) ||
          (char === "-" && i + 1 < line.length && /\d/.test(line[i + 1]))
        ) {
          const start = i;
          if (char === "-") i++; // Incluir sinal negativo
          while (i < line.length && /[\d.eE+-]/.test(line[i])) {
            i++;
          }
          tokens.push({ type: "number", value: line.substring(start, i) });
          expectingValue = false; // Valor processado
        }
        // Símbolos JSON
        else if (/[{}[\]]/.test(char)) {
          tokens.push({ type: "symbol", value: char });
          expectingValue = false; // Reset ao encontrar objeto/array
          i++;
        }
        // Dois pontos - marca que o próximo token é um valor
        else if (char === ":") {
          tokens.push({ type: "symbol", value: char });
          expectingValue = true; // Próximo token será um valor
          i++;
        }
        // Vírgula - separador, próxima propriedade será uma chave
        else if (char === ",") {
          tokens.push({ type: "symbol", value: char });
          expectingValue = false; // Reset para próxima propriedade (será chave)
          i++;
        }
        // Espaços e tabs
        else if (/\s/.test(char)) {
          tokens.push({ type: "space", value: char });
          i++;
        }
        // Palavras-chave JSON (true, false, null) - sempre são valores
        else {
          const start = i;
          while (i < line.length && !/[{}[\]:,"\s]/.test(line[i])) {
            i++;
          }
          if (i > start) {
            const value = line.substring(start, i);
            // Verificar se é palavra-chave JSON
            if (value === "true" || value === "false" || value === "null") {
              tokens.push({ type: "key", value: value }); // Tratar como keyword (cor diferente)
            } else {
              // Outros tokens não reconhecidos
              tokens.push({ type: "key", value: value });
            }
            expectingValue = false; // Reset após processar
          } else {
            i++;
          }
        }
      }

      return tokens;
    };

    // PÁGINA 1: Capa melhorada (centralizada, sem rodapé) - Design Premium
    const primaryColor = hexToRgb(colors.primary);
    const secondaryColor = hexToRgb(colors.secondary);

    // Centralizar verticalmente na página
    const pageCenterY = pageHeight / 2;
    let coverY = pageCenterY - 50; // Começar um pouco acima do centro

    // Elemento decorativo sutil no topo (círculo)
    const lightPrimary = {
      r: Math.min(255, primaryColor.r + 230),
      g: Math.min(255, primaryColor.g + 230),
      b: Math.min(255, primaryColor.b + 230),
    };
    pdf.setFillColor(lightPrimary.r, lightPrimary.g, lightPrimary.b);
    pdf.circle(pageWidth / 2, coverY - 30, 3, "F");

    // Linha decorativa superior (mais elegante)
    pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setLineWidth(1.5);
    pdf.line(margin + 40, coverY - 20, pageWidth - margin - 40, coverY - 20);

    // Linha decorativa adicional (mais sutil)
    pdf.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 50, coverY - 18, pageWidth - margin - 50, coverY - 18);

    if (logoBase64) {
      try {
        const logoWidth = 75;
        const logoHeight = 28;
        pdf.addImage(
          logoBase64,
          "PNG",
          (pageWidth - logoWidth) / 2,
          coverY,
          logoWidth,
          logoHeight
        );
        coverY += logoHeight + 35;
      } catch (e) {
        console.warn("Erro ao adicionar logo:", e);
      }
    }

    // Título com destaque (centralizado) - mais elegante
    pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setFontSize(32);
    pdf.setFont(undefined, "bold");
    const titleLines = pdf.splitTextToSize(
      data.projectTitle,
      contentWidth - 20
    );
    titleLines.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, coverY + index * 14, { align: "center" });
    });
    coverY += titleLines.length * 14 + 35;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");

    // Linha decorativa inferior (mais elegante)
    pdf.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 50, coverY, pageWidth - margin - 50, coverY);

    pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    pdf.setLineWidth(1.5);
    pdf.line(margin + 40, coverY + 2, pageWidth - margin - 40, coverY + 2);

    // Elemento decorativo sutil no rodapé (círculo)
    pdf.setFillColor(lightPrimary.r, lightPrimary.g, lightPrimary.b);
    pdf.circle(pageWidth / 2, coverY + 15, 3, "F");

    // NÃO adicionar rodapé na capa

    // PÁGINA 2: Sumário melhorado com links - Design Premium
    const pageReferences = {};
    const apiPageNumbers = []; // Declarar aqui para estar disponível em todo o escopo
    let authPageNum = 0; // Número da página de autenticação

    if (layout.showTableOfContents) {
      addNewPage();
      const tocPageNum = pdf.internal.getNumberOfPages();
      const tocColor = hexToRgb(colors.primary);
      const tocSecondary = hexToRgb(colors.secondary);

      // Título do sumário com design elegante
      pdf.setTextColor(tocColor.r, tocColor.g, tocColor.b);
      pdf.setFontSize(24);
      pdf.setFont(undefined, "bold");
      pdf.text("Sumário", pageWidth / 2, currentY, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
      currentY += 5;

      // Linha decorativa elegante
      pdf.setDrawColor(tocSecondary.r, tocSecondary.g, tocSecondary.b);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 30, currentY, pageWidth - margin - 30, currentY);

      pdf.setDrawColor(tocColor.r, tocColor.g, tocColor.b);
      pdf.setLineWidth(1.5);
      pdf.line(
        margin + 20,
        currentY + 2,
        pageWidth - margin - 20,
        currentY + 2
      );
      currentY += 12;

      pdf.setFontSize(11.5);

      // Item 1: Autenticação (número de página será adicionado depois) - com estilo
      const authY = currentY;
      const linkBlue = hexToRgb("#0066cc"); // Cor azul padrão de link
      pdf.setTextColor(linkBlue.r, linkBlue.g, linkBlue.b);
      pdf.setFont(undefined, "bold");
      pdf.text("1. Autenticação", margin + 5, currentY);
      pdf.setFont(undefined, "normal");
      currentY += 12;
      pdf.setTextColor(0, 0, 0);

      let apiIndex = 2;
      data.apis.forEach((api) => {
        pdf.setTextColor(linkBlue.r, linkBlue.g, linkBlue.b); // Cor azul de link
        pdf.setFont(undefined, "bold");
        pdf.text(`${apiIndex}. ${api.title}`, margin + 5, currentY);
        pdf.setFont(undefined, "normal");
        pageReferences[`api-${apiIndex - 2}`] = {
          y: currentY,
          title: api.title,
        };
        currentY += 12;
        pdf.setTextColor(0, 0, 0);
        apiIndex++;
      });

      // Guardar referência para autenticação
      pageReferences["auth"] = { y: authY };
    }

    // PÁGINA 3: Autenticação melhorada (com bookmark para sumário)
    addNewPage();
    authPageNum = pdf.internal.getNumberOfPages(); // Número real da página no PDF
    const sectionColor = hexToRgb(colors.primary);

    // Adicionar bookmark/anchor para o sumário
    if (layout.showTableOfContents) {
      pdf.outline.add(null, "Autenticação", authPageNum);
    }

    // Título da Autenticação com badge do método POST (mesmo estilo das APIs)
    const methodColors = {
      GET: "#27a5dd",
      POST: "#4add27",
      PATCH: "#dddd27",
      PUT: "#e96d14",
      DELETE: "#e0331d",
    };

    const methodColor = methodColors["POST"];
    const methodRgb = hexToRgb(methodColor);

    // Alinhar badge e título - título centralizado verticalmente em relação ao badge
    const badgeHeight = 8;
    const badgeWidth = 18;
    const badgeCenterY = currentY;

    // Desenhar badge do método POST (bordas retas)
    pdf.setFillColor(methodRgb.r, methodRgb.g, methodRgb.b);
    pdf.setDrawColor(methodRgb.r * 0.7, methodRgb.g * 0.7, methodRgb.b * 0.7);
    pdf.setLineWidth(0.3);
    pdf.rect(
      margin,
      badgeCenterY - badgeHeight / 2,
      badgeWidth,
      badgeHeight,
      "FD"
    );

    // Texto POST centralizado no badge (vertical e horizontal)
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont(undefined, "bold");
    const methodTextWidth = pdf.getTextWidth("POST");
    const methodX = margin + (badgeWidth - methodTextWidth) / 2;
    const methodY = badgeCenterY + 1.5;
    pdf.text("POST", methodX, methodY);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(0, 0, 0);

    // Título "Autenticação" centralizado verticalmente em relação ao badge
    pdf.setFontSize(13);
    pdf.setFont(undefined, "bold");
    const titleColor = hexToRgb(colors.primary);
    pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
    const titleY = badgeCenterY + 0.5;
    pdf.text("Autenticação", margin + badgeWidth + 5, titleY);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(0, 0, 0);
    currentY += Math.max(13 * 0.4, badgeHeight / 2) + 5;

    // Endpoint como texto normal (sem fundo) com cor de link
    addText("Endpoint:", 10, true);
    pdf.setFont(fonts.code || "courier", "normal");
    pdf.setFontSize(10);
    const linkBlue = hexToRgb("#0066cc");
    pdf.setTextColor(linkBlue.r, linkBlue.g, linkBlue.b);
    const endpointUrl = "https://188.166.221.188/rest/api/oauth2/v1/token";
    const endpointLines = pdf.splitTextToSize(endpointUrl, contentWidth);
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
    pdf.setFont(fonts.main || "helvetica", "normal");

    // Explicação genérica sobre tokens
    addText("Sobre Tokens de Autenticação:", 10, true);
    addText(
      "Um token de autenticação é uma credencial de acesso que permite que um aplicativo ou serviço identifique e autorize um usuário ou sistema. O token Bearer é um tipo de token de acesso usado em protocolos OAuth 2.0 e funciona como uma chave temporária que concede permissões específicas.",
      9
    );
    addText(
      "Para obter um token, é necessário fazer uma requisição POST ao endpoint de autenticação fornecendo credenciais válidas (usuário e senha) através dos headers HTTP. O servidor valida as credenciais e retorna um token de acesso que deve ser incluído em todas as requisições subsequentes no header 'Authorization' com o formato 'Bearer {token}'.",
      9
    );
    addText(
      "O token possui um tempo de expiração limitado (geralmente definido em segundos) e pode ser renovado usando um refresh_token quando necessário.",
      9
    );

    currentY += 5;
    addText("Exemplo de Retorno:", 10, true);
    const authResponse = `{
   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsNTYifQ...",
   "refresh_token": "nRZMn8psW01pWjCllRoCQ02S...",
   "scope": "default",
   "token_type": "Bearer",
   "expires_in": 3600
}`;
    addCodeBlock(authResponse);

    // PÁGINAS: APIs melhoradas
    addNewPage();
    const apisTitleColor = hexToRgb(colors.primary);
    pdf.setTextColor(apisTitleColor.r, apisTitleColor.g, apisTitleColor.b);
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("APIs do Projeto", margin, currentY);
    pdf.setFont(undefined, "normal");

    // Linha decorativa elegante
    pdf.setDrawColor(
      apisTitleColor.r * 0.7,
      apisTitleColor.g * 0.7,
      apisTitleColor.b * 0.7
    );
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY + 3, margin + 70, currentY + 3);

    pdf.setDrawColor(apisTitleColor.r, apisTitleColor.g, apisTitleColor.b);
    pdf.setLineWidth(2);
    pdf.line(margin, currentY + 5, margin + 80, currentY + 5);
    pdf.setTextColor(0, 0, 0);
    currentY += 18;

    data.apis.forEach((api, index) => {
      // Sempre começar cada API em uma nova página
      if (index > 0) {
        addNewPage();
      } else {
        // Para a primeira API, verificar se há espaço suficiente, senão adicionar nova página
        if (currentY > pageHeight - footerHeight - 50) {
          addNewPage();
        }
      }

      // Guardar número da página atual para o link (após adicionar nova página se necessário)
      const currentPageNum = pdf.internal.getNumberOfPages();
      apiPageNumbers.push(currentPageNum);

      // Separador visual elegante entre APIs (exceto a primeira)
      if (index > 0) {
        currentY += 5;
        const separatorColor = hexToRgb(colors.tertiary);
        // Linha decorativa com ponto central
        pdf.setFillColor(separatorColor.r, separatorColor.g, separatorColor.b);
        pdf.circle(pageWidth / 2, currentY - 2, 1.5, "F");
        pdf.setDrawColor(
          separatorColor.r * 0.7,
          separatorColor.g * 0.7,
          separatorColor.b * 0.7
        );
        pdf.setLineWidth(0.3);
        pdf.line(margin, currentY - 2, pageWidth / 2 - 8, currentY - 2);
        pdf.line(
          pageWidth / 2 + 8,
          currentY - 2,
          pageWidth - margin,
          currentY - 2
        );
        currentY += 10;
      }

      // Título da API com badge do método (cores padrão HTTP)
      const methodColors = {
        GET: "#27a5dd", // Azul
        POST: "#4add27", // Verde
        PATCH: "#dddd27", // Amarelo
        PUT: "#e96d14", // Laranja
        DELETE: "#e0331d", // Vermelho
      };

      const methodColor = methodColors[api.method] || colors.secondary;
      const methodRgb = hexToRgb(methodColor);

      // Alinhar badge e título - título centralizado verticalmente em relação ao badge
      const badgeHeight = 8; // Badge menor
      const badgeWidth = 18; // Badge mais estreito
      const badgeCenterY = currentY; // Centro vertical do badge

      // Desenhar badge do método (bordas retas)
      pdf.setFillColor(methodRgb.r, methodRgb.g, methodRgb.b);
      pdf.setDrawColor(methodRgb.r * 0.7, methodRgb.g * 0.7, methodRgb.b * 0.7);
      pdf.setLineWidth(0.3);
      pdf.rect(
        margin,
        badgeCenterY - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
        "FD"
      );

      // Texto GET centralizado no badge (vertical e horizontal)
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont(undefined, "bold");
      const methodTextWidth = pdf.getTextWidth(api.method);
      const methodX = margin + (badgeWidth - methodTextWidth) / 2; // Centralizado horizontalmente
      const methodY = badgeCenterY + 1.5; // Centralizado verticalmente no badge
      pdf.text(api.method, methodX, methodY);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);

      // Título da API centralizado verticalmente em relação ao badge
      pdf.setFontSize(13);
      pdf.setFont(undefined, "bold");
      const titleColor = hexToRgb(colors.primary);
      pdf.setTextColor(titleColor.r, titleColor.g, titleColor.b);
      // Título alinhado verticalmente com o centro do badge
      // Ajuste fino: altura do texto 13pt ≈ 4.6mm, badge tem 8mm, então centralizar
      const titleY = badgeCenterY + 0.5; // Pequeno ajuste para alinhamento visual perfeito
      pdf.text(api.title, margin + badgeWidth + 5, titleY); // Pequeno espaçamento após o badge
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      currentY += Math.max(13 * 0.4, badgeHeight / 2) + 5;

      // Endpoint como texto normal (sem fundo) com cor de link
      addText("Endpoint:", 10, true);
      pdf.setFont(fonts.code || "courier", "normal");
      pdf.setFontSize(10);
      const linkBlue = hexToRgb("#0066cc"); // Cor azul de link
      pdf.setTextColor(linkBlue.r, linkBlue.g, linkBlue.b);
      const endpointLines = pdf.splitTextToSize(api.endpoint, contentWidth);
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
      pdf.setFont(fonts.main || "helvetica", "normal");

      // Query Params ou Body
      const queryParams = normalizeQueryParams(api.queryParams).filter((p) => p.name.trim());
      if (api.method === "GET" && queryParams.length > 0) {
        const sectionTitleColor = hexToRgb(colors.secondary);
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
        addQueryParamsTable(api.queryParams);
      } else if (["POST", "PUT", "PATCH"].includes(api.method) && api.body) {
        const sectionTitleColor = hexToRgb(colors.secondary);
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
      const successColor = hexToRgb(colors.secondary);
      pdf.setTextColor(successColor.r, successColor.g, successColor.b);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("Exemplo de Retorno 200:", margin, currentY);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      currentY += 6;
      addCodeBlock(formatJSON(api.responseSuccess));

      // Resposta de Erro (cor neutra)
      const errorColor = hexToRgb(colors.secondary);
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

    // Adicionar rodapé em todas as páginas EXCETO a capa (se habilitado)
    if (layout.showPageNumbers) {
      const totalPages = pdf.internal.getNumberOfPages();
      // Começar da página 2 (pular a capa), mas numerar a partir de 1
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        // Número da página exibido (página 2 = página 1, página 3 = página 2, etc)
        const pageNumber = i - 1;
        addFooterAndPageNumber(pdf, data.documentVersion, pageNumber);
      }
    }

    // Adicionar links clicáveis e números de página no sumário (se existir)
    if (layout.showTableOfContents && pageReferences["auth"]) {
      pdf.setPage(2); // Página do sumário

      const linkBlue = hexToRgb("#0066cc");
      const gray = hexToRgb(colors.secondary || DEFAULT_COLORS.secondary);

      // Adicionar apenas números de página e links (sem reescrever o texto)
      const authY = pageReferences["auth"].y;
      // Adicionar número da página à direita
      pdf.setTextColor(gray.r, gray.g, gray.b);
      pdf.setFontSize(11.5);
      const authPageDisplay = authPageNum - 1; // Página exibida (página 3 do PDF = página 2 do documento)
      pdf.text(`${authPageDisplay}`, pageWidth - margin - 10, authY, {
        align: "right",
      });
      // Link clicável
      pdf.link(margin + 5, authY - 5, pageWidth - margin * 2 - 10, 8, {
        page: authPageNum,
      });

      // Adicionar números de página e links para APIs
      let apiIndex = 2;
      data.apis.forEach((api, idx) => {
        if (pageReferences[`api-${apiIndex - 2}`] && apiPageNumbers[idx]) {
          const apiY = pageReferences[`api-${apiIndex - 2}`].y;
          // Adicionar número da página à direita
          pdf.setTextColor(gray.r, gray.g, gray.b);
          const apiPageDisplay = apiPageNumbers[idx] - 1; // Página exibida
          pdf.text(`${apiPageDisplay}`, pageWidth - margin - 10, apiY, {
            align: "right",
          });
          // Link clicável
          pdf.link(margin + 5, apiY - 5, pageWidth - margin * 2 - 10, 8, {
            page: apiPageNumbers[idx],
          });
        }
        apiIndex++;
      });
    }

    // Se for preview, retornar o PDF sem salvar
    if (isPreview) {
      return pdf;
    }

    // Salvar PDF
    const fileName = `${data.projectTitle.replace(/[^a-z0-9]/gi, "_")}_v${
      data.documentVersion
    }.pdf`;
    pdf.save(fileName);

    return pdf;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    if (!isPreview) {
      alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
    }
    // Em modo preview, ainda tentar retornar o PDF se existir
    if (isPreview && typeof pdf !== "undefined") {
      console.warn("Erro durante geração, mas retornando PDF parcial:", error);
      return pdf;
    }
    throw error;
  }
}

// Gerar PDF (wrapper para compatibilidade)
export async function generatePDF(data) {
  await generatePDFContent(data, false);
}
