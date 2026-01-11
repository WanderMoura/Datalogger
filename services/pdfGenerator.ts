
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CoolingResult } from '../types';
import { formatDecimal } from './coolingLogic';

const FOOTER_TEXT = "TESTO 174H Termistor NTC - Série 85327157";

/**
 * Normaliza e valida a imagem base64 para o jsPDF
 */
async function validateImage(dataUrl: string | undefined): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return null;
  
  // Se for uma imagem vazia (placeholder), ignoramos
  if (dataUrl.includes("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(dataUrl);
    img.onerror = () => {
      console.warn("Imagem detectada como corrompida ou inválida.");
      resolve(null);
    };
    img.src = dataUrl;
  });
}

/**
 * Detecta o formato da imagem a partir do DataURL
 */
function getImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'JPEG';
}

export async function generatePDF(result: CoolingResult, chartBase64: string) {
  const { params, kGlobal, totalMinutes, taxaMedia, urMax, urMin, urMean, dataPoints } = result;
  
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 72;
  const topHeaderY = 50; 
  const tableStartY = topHeaderY + 45; // Valor calculado: 95

  // Validação da Logo
  const validLogo = await validateImage(params.logoBase64);

  // 1. Tabela de Metadados (Cabeçalho Principal)
  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { 
        fontSize: 9, 
        cellPadding: 4, 
        font: 'helvetica', 
        lineColor: [0, 0, 0], 
        lineWidth: 0.5,
        textColor: [0, 0, 0]
    },
    body: [
      [
        { 
          content: params.nome.toUpperCase(), 
          colSpan: 2, 
          styles: { fillColor: [220, 220, 220], halign: 'center', fontStyle: 'bold', fontSize: 11 } 
        }
      ],
      [
        { 
          content: params.objetivo, 
          colSpan: 2, 
          styles: { fillColor: [255, 255, 255], halign: 'left' } 
        }
      ],
      [
        `Data: ${params.data} • Início: ${params.inicio} • Fim: ${params.fim} •\nIntervalo Total (min): ${totalMinutes}`,
        `Produto Analisado: ${params.produto}`
      ],
      [
        `Temperatura (Máx/Mín/Méd)\n${formatDecimal(params.Ti)} ºC / ${formatDecimal(params.Tf)} ºC / ${formatDecimal((params.Ti + params.Tf) / 2)} ºC`,
        `Umidade Relativa [%Hr] (Máx/Mín/Méd)\n${formatDecimal(urMax)} / ${formatDecimal(urMin)} / ${formatDecimal(urMean)}`
      ],
      [
        `Taxa média de resfriamento\n${formatDecimal(taxaMedia, 5)} ºC/min`,
        `Constante Newtoniana (k global)\n${formatDecimal(kGlobal, 4)} min-¹`
      ]
    ],
    columnStyles: {
      0: { cellWidth: 230 },
      1: { cellWidth: 'auto' }
    }
  });

  // 2. Títulos Técnicos (Entre Grid e Gráfico)
  const lastTableY = (doc as any).lastAutoTable?.finalY || 200;
  const textTitleY = lastTableY + 30;
  const textSubY = textTitleY + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Validação de Resfriamento - ${params.data}`, pageW / 2, textTitleY, { align: 'center' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Tabela linear; k por minuto; curva exponencial (Newton)`, pageW / 2, textSubY, { align: 'center' });

  // 3. Inserção do Gráfico
  const chartY = textSubY + 15;
  if (chartBase64) {
      try {
        doc.addImage(chartBase64, 'PNG', margin, chartY, pageW - (margin * 2), 240, undefined, 'FAST');
      } catch (e) {
        console.error("Falha ao injetar gráfico no PDF:", e);
      }
  }

  // 4. Tabela Detalhada de Dados
  autoTable(doc, {
    startY: chartY + 255, 
    // margin.top definido como tableStartY (95) para alinhar com o grid da pág 1 em novas páginas
    margin: { top: tableStartY, left: margin, right: margin, bottom: 60 },
    head: [['ID', 'Data/Hora', 'Temp. Produto [°C]', 'Umidade [%Hr]', 'k (min-¹)']],
    body: dataPoints.map(p => [
      p.id.toString(),
      p.timestamp,
      formatDecimal(p.tempLinear),
      formatDecimal(p.ur),
      formatDecimal(p.k, 4)
    ]),
    theme: 'grid',
    headStyles: { 
        fillColor: [235, 235, 235], 
        textColor: [0, 0, 0], 
        fontSize: 8, 
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
    },
    styles: { 
        fontSize: 8, 
        halign: 'center', 
        cellPadding: 3,
        lineColor: [180, 180, 180],
        lineWidth: 0.2
    }
  });

  // 5. Observações Finais com Horários Sincronizados
  const finalY = (doc as any).lastAutoTable?.finalY || 0;
  
  const startFullTime = dataPoints[0].timestamp.split(' ')[1];
  const endFullTime = dataPoints[dataPoints.length - 1].timestamp.split(' ')[1];
  const finalTempFormated = formatDecimal(dataPoints[dataPoints.length - 1].tempLinear);

  const obs = `Processo iniciado às ${startFullTime}. Registro finalizado ao atingir ${finalTempFormated} ºC às ${endFullTime}.`;
  
  if (finalY > 0 && finalY + 40 < pageH - 60) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(obs, margin, finalY + 25);
  }

  // 6. Cabeçalho e Rodapé Fixos (Todas as páginas)
  const totalPages = doc.internal.getNumberOfPages();
  const MAX_LOGO_W = 70;
  const MAX_LOGO_H = 25;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const baselineY = topHeaderY + 5;

    if (validLogo) {
        try {
          const props = doc.getImageProperties(validLogo);
          const ratio = props.width / props.height;
          let w = MAX_LOGO_W;
          let h = w / ratio;
          
          if (h > MAX_LOGO_H) {
            h = MAX_LOGO_H;
            w = h * ratio;
          }

          doc.addImage(validLogo, getImageFormat(validLogo), margin, baselineY - h + 2, w, h, undefined, 'FAST');
        } catch (e) {
          console.error(`Erro na logo (Pág ${i}):`, e);
        }
    }

    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const tsLabel = `${params.timestamp}`;
    doc.text(tsLabel, pageW - margin, baselineY, { align: 'right' });

    const footY = pageH - 35;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, footY, { align: 'right' });
    doc.setFont("helvetica", "italic");
    doc.text(FOOTER_TEXT, pageW - margin, footY + 12, { align: 'right' });
  }

  doc.save(`Relatorio_PCC2B_${params.produto.replace(/\s+/g, '_')}.pdf`);
}
