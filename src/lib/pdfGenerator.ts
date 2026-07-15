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

/** Helper para cargar imágenes */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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

    const margin = 15;

    // ── 1. LOGO Y ENCABEZADO ──
    let y = margin;

    // Cargar y añadir el logo de la mezquita
    if (city.logo) {
      try {
        const logoImg = await loadImage(city.logo);
        const logoW = 50;
        const logoH = (logoImg.height / logoImg.width) * logoW;
        doc.addImage(logoImg, 'PNG', w/2 - logoW/2, y, logoW, logoH);
        y += logoH + 5;
      } catch (e) {
        console.warn('No se pudo cargar el logo:', e);
        y += 25; // Espacio reservado si no hay logo
      }
    } else {
      y += 25;
    }

    // Título con información del mes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const mesHijri = HIJRI_MONTHS[selectedHijriMonth - 1];
    doc.text(
      `Parte de los momentos del salah correspondiente al mes de ${mesHijri} del año ${selectedHijriYear} h.`,
      w / 2,
      y,
      { align: 'center' }
    );
    y += 5;
    doc.text(
      `(2026 E.C.) para la ciudad de ${city.nombre_es} y cercanías.`,
      w / 2,
      y,
      { align: 'center' }
    );
    y += 8;

    // ── 2. TABLA DE HORARIOS ──
    const tableBody: (string | number)[][] = [];
    let dia29Fecha = '';

    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      if (i + 1 === 29) dia29Fecha = fechaStr;
      tableBody.push([i + 1, fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha]);
    }

    autoTable(doc, {
      head: [['mes.', 'fecha', 'subh', 'shuruq', 'dhuhr', "'asr", 'magrib', "'isha"]],
      body: tableBody,
      startY: y,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        halign: 'center',
        cellPadding: 1.5,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center' },
        1: { halign: 'left' }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      pageBreak: 'avoid',
      showFoot: 'never'
    });

    let finalY = (doc as any).lastAutoTable.finalY + 8;

    // ── 3. DÍA DE OBSERVACIÓN ──
    if (dia29Fecha) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Día de observación: [La fecha] (a final de mes, que se sale a ver si hay luna)`,
        w / 2,
        finalY,
        { align: 'center' }
      );
      finalY += 6;
    }

    // ── 4. INFORMACIÓN TÉCNICA ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `${city.nombre_es} (${city.geo})`,
      w / 2,
      finalY,
      { align: 'center' }
    );
    finalY += 4;
    doc.text(
      'Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18°',
      w / 2,
      finalY,
      { align: 'center' }
    );
    finalY += 8;

    // ── 5. DATOS DE CONTACTO ──
    if (city.contacto || city.web) {
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      const contactText = [city.contacto, city.web].filter(Boolean).join(' · ');
      doc.text(contactText, w / 2, finalY, { align: 'center' });
      finalY += 6;
    }

    // ── 6. SELLO INFERIOR ─
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text('DATOS PROPORCIONADOS POR FALAK QAYRAN', w / 2, finalY, { align: 'center' });

    doc.save(`FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2, '0')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error generando el PDF. Revise la consola.');
  } finally {
    setIsGenerating(false);
  }
};
