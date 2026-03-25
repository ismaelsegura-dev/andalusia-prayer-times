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
    
    const rgbPri = hexToRgb(city.col_pri);
    const rgbSec = hexToRgb(city.col_sec);
    const rgbAcc = hexToRgb(city.col_acc);

    // Header Banner Background
    doc.setFillColor(rgbPri[0], rgbPri[1], rgbPri[2]);
    doc.rect(0, 0, w, 40, 'F');
    
    // Bottom banner line
    doc.setFillColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.rect(0, 40, w, 2, 'F');

    // Attempt to load and place Logo
    const logoB64 = await fetchLocalImageAsBase64(city.logo);
    if (logoB64) {
      // Assume the logo is roughly a header graphic and we center it.
      doc.addImage(logoB64, 'PNG', w/2 - 40, 4, 80, 28, undefined, 'FAST');
    } else {
      doc.setFont('times', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text(city.nombre_es.toUpperCase(), w/2, 22, { align: 'center' });
    }

    // Title
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`HORARIOS DE REZO — ${HIJRI_MONTHS[selectedHijriMonth-1].toUpperCase()} ${selectedHijriYear}`, w/2, 48, { align: 'center' });
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Basado en coordenadas exactas: ${city.coords.lat.toFixed(4)}, ${city.coords.lng.toFixed(4)}`, w/2, 53, { align: 'center' });

    // Table Data
    const tableData = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d).local;
      tableData.push([
        `${i + 1} ${HIJRI_MONTHS[selectedHijriMonth-1].toUpperCase()} (${format(d, 'dd/MM', { locale: es })})`,
        p.fajr,
        p.shuruq,
        p.dhuhr,
        p.asr,
        p.maghrib,
        p.isha,
      ]);
    }

    autoTable(doc, {
      head: [['FECHA', 'FAJR', 'AMANECER', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']],
      body: tableData,
      startY: 57,
      styles: { font: 'courier', fontSize: 8, halign: 'center', cellPadding: 1, minCellHeight: 5.5 },
      headStyles: { 
        fillColor: rgbPri, 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        minCellHeight: 7
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', minCellWidth: 35 },
        5: { fontStyle: 'bold', textColor: rgbSec } // Maghrib highlight
      },
      margin: { top: 57, bottom: 25 },
      pageBreak: 'avoid'
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    
    // Decorative line
    doc.setDrawColor(rgbAcc[0], rgbAcc[1], rgbAcc[2]);
    doc.setLineWidth(0.5);
    doc.line(15, finalY, w - 15, finalY);

    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text(city.geo, w/2, finalY + 5, { align: 'center' });
    
    if (city.contacto) {
      doc.text(city.contacto, w/2, finalY + 9, { align: 'center' });
    }
    if (city.web) {
      doc.setTextColor(rgbSec[0], rgbSec[1], rgbSec[2]);
      doc.text(city.web, w/2, finalY + 13, { align: 'center' });
    }
    
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18° / 17°', w/2, finalY + 18, { align: 'center' });

    doc.save(`FALAK_QAYRAN_${city.id}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2,'0')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error generando el PDF. Revise la consola.');
  } finally {
    setIsGenerating(false);
  }
};
