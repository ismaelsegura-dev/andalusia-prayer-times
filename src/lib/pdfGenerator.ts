import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularHorariosOracion } from './prayerTimesEngine';
import { CITIES } from './cities';
import { HIJRI_MONTHS, getHijriMonthStart, getHijriMonthLength } from './lunar-calendar';
import { useStore } from '../store';

export const fetchLocalImageAsBase64 = async (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

/** Abreviatura del mes hijri para la cabecera de tabla */
const getHijriMonthShort = (monthIndex: number): string => {
  const shorts = [
    "Muh.", "Saf.", "R.A.", "R.T.",
    "J.A.", "J.T.", "Raj.", "Sha.",
    "Ram.", "Shw.", "D.Q.", "D.H."
  ];
  return shorts[monthIndex - 1] ?? "Dia";
};

export const generateHighFidelityPDF = async (
  cityId: string,
  selectedHijriMonth: number,
  selectedHijriYear: number,
  setIsGenerating: (v: boolean) => void
) => {
  const city = CITIES[cityId];
  if (!city) return;

  const { validatedMonths } = useStore.getState();

  setIsGenerating(true);
  try {
    const startDate = getHijriMonthStart(selectedHijriYear, selectedHijriMonth, validatedMonths);
    const daysInMonth = getHijriMonthLength(selectedHijriYear, selectedHijriMonth, validatedMonths);

    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    const rgbPri = hexToRgb(city.col_pri);
    const rgbSec = hexToRgb(city.col_sec);
    const rgbAcc = hexToRgb(city.col_acc);

    const margin = 12; // reduced margin for more space

    // ── 1. MARCO EXTERIOR BRUTALISTA ──
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.rect(margin, margin, w - margin * 2, h - margin * 2, 'S');

    // ── 2. CABECERA / FUNDACION ──
    let currentY = margin + 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const title = city.fundacion ? city.fundacion.toUpperCase() : city.nombre_es.toUpperCase();
    doc.text(title, w / 2, currentY, { align: 'center' });
    currentY += 4;

    // Linea decorativa bajo fundacion
    doc.setLineWidth(0.6);
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.line(margin + 8, currentY, w - margin - 8, currentY);
    currentY += 3;

    // ── 3. TEXTO DESCRIPTIVO DEL DOCUMENTO ──
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8.5);

    const mesHijri = HIJRI_MONTHS[selectedHijriMonth - 1];
    const mesShort = getHijriMonthShort(selectedHijriMonth);
    const anioGregStart = startDate.getFullYear();
    const anioGregEnd = addDays(startDate, daysInMonth - 1).getFullYear();
    const anioGregStr = anioGregStart === anioGregEnd ? String(anioGregStart) : `${anioGregStart}/${anioGregEnd}`;

    doc.text('Parte de los momentos del salah correspondiente', w / 2, currentY, { align: 'center' });
    currentY += 3.8;
    doc.text(`al mes de ${mesHijri} del año ${selectedHijriYear} h. (${anioGregStr} E.C.)`, w / 2, currentY, { align: 'center' });
    currentY += 3.8;
    doc.text(`para la ciudad de ${city.nombre_es} y cercanias.`, w / 2, currentY, { align: 'center' });
    currentY += 4.5;

    // ── 4. TABLA DE HORARIOS (compacta, 1 pagina) ──
    const tableData: (string | boolean)[][] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      const isQadr = (i + 1) === 27 && selectedHijriMonth === 9;
      tableData.push([String(i + 1), fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha, isQadr]);
    }

    autoTable(doc, {
      head: [[mesShort, 'Fecha', 'Fajr', 'Shuruq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']],
      body: tableData.map(row => row.slice(0, 8)),
      startY: currentY,
      theme: 'grid',
      styles: {
        font: 'courier',
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 0.8,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: rgbPri,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 10, fontStyle: 'bold' },
        1: { cellWidth: 26, halign: 'left' },
        2: { cellWidth: 16 },
        3: { cellWidth: 16, textColor: [130, 130, 130] },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18, fontStyle: 'bold', textColor: rgbSec },
        7: { cellWidth: 18 }
      },
      margin: { left: margin + 2, right: margin + 2 },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const isQadrRow = tableData[rowIndex]?.[8] === true;
          if (isQadrRow) {
            doc.setFillColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
            doc.rect(data.cell.x, data.cell.y, 1.0, data.cell.height, 'F');
            doc.setFillColor(255, 251, 240);
            doc.rect(data.cell.x + 1.0, data.cell.y, data.cell.width - 1.0, data.cell.height, 'F');
          }
        }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 2.5;

    // ── 5. DIA DE OBSERVACION (dia 28) ──
    const dia28Row = tableData.find(r => r[0] === '28');
    if (dia28Row) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin + 5, finalY, w - margin * 2 - 10, 5, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(123, 88, 0);
      doc.text(`Dia de observacion: ${dia28Row[1]}`, w / 2, finalY + 3.2, { align: 'center' });
      finalY += 7;
    }

    // ── 6. LEYENDA LAYLAT AL-QADR (solo Ramadan) ──
    const qadrExists = selectedHijriMonth === 9 && tableData.some(r => r[8]);
    if (qadrExists) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin + 5, finalY, w - margin * 2 - 10, 5, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(123, 88, 0);
      doc.text('Dia 27 de Ramadan — Laylat al-Qadr', w / 2, finalY + 3.2, { align: 'center' });
      finalY += 7;
    }

    // ── 7. PIE DE PAGINA TECNICO (compacto) ──
    // Footer starts immediately after table/boxes, but must leave room for stamp at bottom
    const stampH = 5;
    const stampY = h - margin - stampH - 1.5;
    const footerY = Math.min(finalY + 2, stampY - 18); // ensure we don't overlap stamp

    // Double decorative lines
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.setLineWidth(1);
    doc.line(margin + 8, footerY + 12, w - margin - 8, footerY + 12);
    doc.setDrawColor(rgbPri[0], rgbPri[1], rgbPri[2]);
    doc.setLineWidth(0.4);
    doc.line(margin + 8, footerY + 10.5, w - margin - 8, footerY + 10.5);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.text(city.geo, w / 2, footerY + 7.5, { align: 'center' });

    if (city.contacto) {
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(6.2);
      doc.text(city.contacto, w / 2, footerY + 4.5, { align: 'center' });
    }

    if (city.web) {
      doc.setTextColor(rgbSec[0], rgbSec[1], rgbSec[2]);
      doc.setFontSize(6.2);
      doc.text(city.web, w / 2, footerY + 1.5, { align: 'center' });
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(5.5);
    doc.text(
      'Calculado con rigor astronomico · Fiqh Maliki · Angulo de crepusculo 18°',
      w / 2,
      footerY - 1.2,
      { align: 'center' }
    );

    // ── 8. SELLO FALAK QAYRAN ──
    doc.setFillColor(0, 0, 0);
    doc.rect(margin + 5, stampY, w - margin * 2 - 10, stampH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('DATOS PROPORCIONADOS POR FALAK QAYRAN', w / 2, stampY + 3.3, { align: 'center' });

    doc.save(`FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2, '0')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error generando el PDF. Revise la consola.');
  } finally {
    setIsGenerating(false);
  }
};
