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
  return shorts[monthIndex - 1] ?? "Día";
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
    const w = doc.internal.pageSize.getWidth();   // 210
    const h = doc.internal.pageSize.getHeight();  // 297

    const rgbPri = hexToRgb(city.col_pri);
    const rgbSec = hexToRgb(city.col_sec);
    const rgbAcc = hexToRgb(city.col_acc);

    const margin = 14;
    const contentW = w - margin * 2; // 182 mm

    // ── 1. MARCO EXTERIOR ──
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.rect(margin, margin, contentW, h - margin * 2, 'S');

    // ── 2. CABECERA ──
    let y = margin + 7;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text((city.fundacion || city.nombre_es).toUpperCase(), w / 2, y, { align: 'center' });
    y += 5;

    doc.setLineWidth(0.7);
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.line(margin + 10, y, w - margin - 10, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8.5);

    const mesHijri = HIJRI_MONTHS[selectedHijriMonth - 1];
    const mesShort = getHijriMonthShort(selectedHijriMonth);
    const anioGregStart = startDate.getFullYear();
    const anioGregEnd = addDays(startDate, daysInMonth - 1).getFullYear();
    const anioGregStr = anioGregStart === anioGregEnd ? String(anioGregStart) : `${anioGregStart}/${anioGregEnd}`;

    doc.text('Parte de los momentos del salah correspondiente', w / 2, y, { align: 'center' });
    y += 3.8;
    doc.text(`al mes de ${mesHijri} del año ${selectedHijriYear} h. (${anioGregStr} E.C.)`, w / 2, y, { align: 'center' });
    y += 3.8;
    doc.text(`para la ciudad de ${city.nombre_es} y cercanías.`, w / 2, y, { align: 'center' });
    y += 5;

    // ── 3. TABLA DE HORARIOS (centrada, ocupa todo el ancho disponible) ──
    const tableBody: (string | number)[][] = [];
    let dia29Fecha = '';
    let hasQadr = false;

    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      if (i + 1 === 29) dia29Fecha = fechaStr;
      if (i + 1 === 27 && selectedHijriMonth === 9) hasQadr = true;
      tableBody.push([i + 1, fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha]);
    }

    autoTable(doc, {
      head: [[mesShort, 'Fecha', 'Fajr', 'Shuruq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']],
      body: tableBody,
      startY: y,
      theme: 'grid',
      styles: {
        font: 'courier',
        fontSize: 7.4,
        halign: 'center',
        cellPadding: 0.6,
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
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { halign: 'left' },
        3: { textColor: [130, 130, 130] },
        6: { fontStyle: 'bold', textColor: rgbSec }
      },
      margin: { left: margin + 3, right: margin + 3 },
      tableWidth: 'auto',
      pageBreak: 'avoid',
      showFoot: 'never'
    });

    let finalY = (doc as any).lastAutoTable.finalY + 4;

    // ── 4. DÍA DE OBSERVACIÓN ──
    if (dia29Fecha) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin + 5, finalY, contentW - 10, 5.5, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(123, 88, 0);
      doc.text(`Día de observación: ${dia29Fecha}`, w / 2, finalY + 3.5, { align: 'center' });
      finalY += 8;
    }

    // ── 5. LEYENDA LAYLAT AL-QADR ──
    if (hasQadr) {
      doc.setFillColor(255, 251, 240);
      doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin + 5, finalY, contentW - 10, 5.5, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(123, 88, 0);
      doc.text('Día 27 de Ramadán — Laylat al-Qadr', w / 2, finalY + 3.5, { align: 'center' });
      finalY += 8;
    }

    // ── 6. PIE TÉCNICO ──
    const stampH = 5.5;
    const stampY = h - margin - stampH - 2;
    const minFooterTop = stampY - 26;
    const footerTop = Math.min(finalY + 2, minFooterTop);

    // Líneas decorativas
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.setLineWidth(1);
    doc.line(margin + 10, footerTop + 13, w - margin - 10, footerTop + 13);
    doc.setDrawColor(rgbPri[0], rgbPri[1], rgbPri[2]);
    doc.setLineWidth(0.4);
    doc.line(margin + 10, footerTop + 11.5, w - margin - 10, footerTop + 11.5);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(city.geo, w / 2, footerTop + 8.5, { align: 'center' });

    if (city.contacto) {
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(6.5);
      doc.text(city.contacto, w / 2, footerTop + 5, { align: 'center' });
    }
    if (city.web) {
      doc.setTextColor(rgbSec[0], rgbSec[1], rgbSec[2]);
      doc.setFontSize(6.5);
      doc.text(city.web, w / 2, footerTop + 1.5, { align: 'center' });
    }

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(5.8);
    doc.text(
      'Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18°',
      w / 2,
      footerTop - 2,
      { align: 'center' }
    );

    // ── 7. SELLO ──
    doc.setFillColor(0, 0, 0);
    doc.rect(margin + 5, stampY, contentW - 10, stampH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DATOS PROPORCIONADOS POR FALAK QAYRAN', w / 2, stampY + 3.5, { align: 'center' });

    doc.save(`FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2, '0')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error generando el PDF. Revise la consola.');
  } finally {
    setIsGenerating(false);
  }
};
