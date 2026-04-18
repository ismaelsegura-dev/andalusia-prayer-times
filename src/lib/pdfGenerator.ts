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
    const h = doc.internal.pageSize.getHeight();
    
    const rgbPri = hexToRgb(city.col_pri);

    const margin = 15;
    
    // Brutalist Outer Border
    doc.setDrawColor(0, 0, 0);       
    doc.setLineWidth(1.5);
    doc.rect(margin, margin, w - margin*2, h - margin*2, 'S');

    // Branding Header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    const cityTitle = city.nombre_es.toUpperCase();
    doc.text(cityTitle, w/2, margin + 12, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(`FALAK QAYRAN // HORARIOS DE ORACIÓN`, w/2, margin + 18, { align: 'center' });

    // Decorative/Brutalist separator
    doc.setLineWidth(1.5);
    doc.line(margin, margin + 21, w - margin, margin + 21);
    
    doc.setFontSize(11);
    doc.text(`${HIJRI_MONTHS[selectedHijriMonth-1].toUpperCase()} ${selectedHijriYear}`, w/2, margin + 27, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const geoText = `LAT: ${city.coords.lat.toFixed(4)}° // LNG: ${city.coords.lng.toFixed(4)}° // ALT: ${city.coords.alt}m`;
    doc.setFontSize(7.5);
    doc.text(geoText, w/2, margin + 31, { align: 'center' });

    // Table Data
    const tableData = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d).local;
      tableData.push([
        `${i + 1} ${HIJRI_MONTHS[selectedHijriMonth-1].substring(0,3).toUpperCase()} [${format(d, 'dd/MM', { locale: es })}]`,
        p.fajr,
        p.shuruq,
        p.dhuhr,
        p.asr,
        p.maghrib,
        p.isha,
      ]);
    }

    autoTable(doc, {
      head: [['FECHA', 'FAJR', 'SHURUQ', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']],
      body: tableData,
      startY: margin + 34,
      theme: 'grid', // Brutalist grid theme
      styles: { 
        font: 'courier', 
        fontSize: 8.5, 
        halign: 'center', 
        cellPadding: 1.2, 
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      headStyles: { 
        fillColor: rgbPri, // Use the priority color as background for header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [225, 225, 225] },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', fillColor: [210, 210, 210] }
      },
      margin: { top: 35, bottom: 25, left: margin + 2, right: margin + 2 },
      pageBreak: 'avoid'
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    
    // Bottom Section Boundary
    doc.setDrawColor(0,0,0);
    doc.setLineWidth(1);
    doc.line(margin + 5, finalY, w - margin - 5, finalY);

    if (city.fundacion) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(city.fundacion.toUpperCase(), w/2, finalY + 5, { align: 'center' });
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    let contactInfo = "";
    if (city.contacto) contactInfo += city.contacto + " | ";
    if (city.web) contactInfo += city.web;
    if(contactInfo) {
      doc.text(contactInfo, w/2, finalY + 9, { align: 'center' });
    }

    const cityTitleFooter = city.nombre_es.toLowerCase().startsWith('mezquita') ? city.nombre_es : `Mezquita de ${city.nombre_es}`;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`* Horarios calculados matemáticamente bajo jurisprudencia Maliki (Ángulos: 18° / 17°) para ${cityTitleFooter}.`, w/2, finalY + 13, { align: 'center' });

    // MANDATORY TEXT (Falak Qayrán)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setFillColor(0,0,0);
    doc.rect(margin + 5, finalY + 16, w - margin*2 - 10, 6, 'F');
    doc.setTextColor(255,255,255);
    doc.text("DATOS PROPORCIONADOS POR FALAK QAYRAN (PROYECTO DE MEZQUITA GUADAÍRA)", w/2, finalY + 20.25, { align: 'center' });

    doc.save(`FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2,'0')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Error generando el PDF. Revise la consola.');
  } finally {
    setIsGenerating(false);
  }
};
