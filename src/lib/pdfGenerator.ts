import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularHorariosOracion } from './prayerTimesEngine';
import { CITIES } from './cities';
import { HIJRI_MONTHS, getHijriMonthStart, getHijriMonthLength } from './lunar-calendar';
import { useStore } from '../store';

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

    const margin = 15;

    // ── 1. MARCO EXTERIOR BRUTALISTA ──
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.rect(margin, margin, w - margin * 2, h - margin * 2, 'S');

    // ── 2. CABECERA / FUNDACION ──
    let currentY = margin + 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    const title = city.fundacion ? city.fundacion.toUpperCase() : city.nombre_es.toUpperCase();
    doc.text(title, w / 2, currentY, { align: 'center' });
    currentY += 7;

    // Linea decorativa bajo fundacion
    doc.setLineWidth(1);
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.line(margin + 10, currentY, w - margin - 10, currentY);
    currentY += 5;

    // ── 3. TEXTO DESCRIPTIVO DEL DOCUMENTO ──
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);

    const mesHijri = HIJRI_MONTHS[selectedHijriMonth - 1];
    const mesShort = getHijriMonthShort(selectedHijriMonth);
    const anioGregStart = startDate.getFullYear();
    const anioGregEnd = addDays(startDate, daysInMonth - 1).getFullYear();
    const anioGregStr = anioGregStart === anioGregEnd ? String(anioGregStart) : `${anioGregStart}/${anioGregEnd}`;

    doc.text('Parte de los momentos del salah correspondiente', w / 2, currentY, { align: 'center' });
    currentY += 4.2;
    doc.text(`al mes de ${mesHijri} del año ${selectedHijriYear} h. (${anioGregStr} E.C.)`, w / 2, currentY, { align: 'center' });
    currentY += 4.2;
    doc.text(`para la ciudad de ${city.nombre_es} y cercanias.`, w / 2, currentY, { align: 'center' });
    currentY += 6;

    // ── 4. TABLA DE HORARIOS ──
    const tableBody: (string | number)[][] = [];
    let dia28Fecha = '';
    let hasQadr = false;

    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      if (i + 1 === 28) dia28Fecha = fechaStr;
      if (i + 1 === 27 && selectedHijriMonth === 9) hasQadr = true;
      tableBody.push([i + 1, fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha]);
    }

    autoTable(doc, {
      head: [[mesShort, 'Fecha', 'Fajr', 'Shuruq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']],
      body: tableBody,
      startY: currentY,
      theme: 'grid',
      styles: {
        font: 'courier',
        fontSize: 8,
        halign: 'center',
        cellPadding: 1,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.4
      },
      headStyles: {
        fillColor: rgbPri,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8.5
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 12, fontStyle: 'bold' },
        1: { cellWidth: 28, halign: 'left' },
        2: { cellWidth: 18 },
        3: { cellWidth: 18, textColor: [120, 120, 120] },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 20, fontStyle: 'bold', textColor: rgbSec },
        7: { cellWidth: 20 }
      },
      margin: { top: currentY, left: margin + 2, right: margin + 2 },
      pageBreak: 'avoid',
      showFoot: 'never',
      tableWidth: 'auto'
    });

    let finalY = (doc as any).lastAutoTable.finalY + 5;

    // ── 5. DIA DE OBSERVACION (dia 28 del mes) ──
    if (dia28Fecha) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin + 5, finalY, w - margin * 2 - 10, 6, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(123, 88, 0);
      doc.text(`Dia de observacion: ${dia28Fecha}`, w / 2, finalY + 4, { align: 'center' });
      finalY += 9;
    }

    // ── 6. LEYENDA LAYLAT AL-QADR (solo Ramadan) ──
    if (hasQadr) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin + 5, finalY, w - margin * 2 - 10, 6, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(123, 88, 0);
      doc.text('Dia 27 de Ramadan — Laylat al-Qadr', w / 2, finalY + 4, { align: 'center' });
      finalY += 9;
    }

    // ── 7. PIE DE PAGINA TECNICO ──
    // Asegurar que no solape con el sello
    const stampH = 6;
    const stampY = h - margin - stampH - 2;
    const minFooterY = stampY - 28;
    const footerY = finalY < minFooterY ? finalY : minFooterY;

    // Lineas decorativas dobles
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.setLineWidth(1.2);
    doc.line(margin + 10, footerY + 14, w - margin - 10, footerY + 14);
    doc.setDrawColor(rgbPri[0], rgbPri[1], rgbPri[2]);
    doc.setLineWidth(0.5);
    doc.line(margin + 10, footerY + 12.5, w - margin - 10, footerY + 12.5);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(city.geo, w / 2, footerY + 9, { align: 'center' });

    if (city.contacto) {
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(6.8);
      doc.text(city.contacto, w / 2, footerY + 5.5, { align: 'center' });
    }

    if (city.web) {
      doc.setTextColor(rgbSec[0], rgbSec[1], rgbSec[2]);
      doc.setFontSize(6.8);
      doc.text(city.web, w / 2, footerY + 2, { align: 'center' });
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(6);
    doc.text(
      'Calculado con rigor astronomico · Fiqh Maliki · Angulo de crepusculo 18°',
      w / 2,
      footerY - 1.5,
      { align: 'center' }
    );

    // ── 8. SELLO FALAK QAYRAN ──
    doc.setFillColor(0, 0, 0);
    doc.rect(margin + 5, stampY, w - margin * 2 - 10, stampH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DATOS PROPORCIONADOS POR FALAK QAYRAN', w / 2, stampY + 4, { align: 'center' });

    doc.save(`FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2, '0')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error generando el PDF. Revise la consola.');
  } finally {
    setIsGenerating(false);
  }
};
