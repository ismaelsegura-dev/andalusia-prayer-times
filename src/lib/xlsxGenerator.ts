import * as XLSX from 'xlsx';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularHorariosOracion } from './prayerTimesEngine';
import { CITIES } from './cities';
import { HIJRI_MONTHS, getHijriMonthStart, getHijriMonthLength } from './lunar-calendar';
import { useStore } from '../store';

/** Abreviatura del mes hijri */
function getHijriShort(monthIndex: number) {
  const shorts = ["Muh.","Saf.","R.A.","R.T.","J.A.","J.T.","Raj.","Sha.","Ram.","Shw.","D.Q.","D.H."];
  return shorts[monthIndex - 1] ?? "Dia";
}

export const generateXLSX = (
  cityId: string,
  selectedHijriMonth: number,
  selectedHijriYear: number,
  setIsGenerating: (v: boolean) => void
) => {
  setIsGenerating(true);
  try {
    const city = CITIES[cityId];
    if (!city) return;

    const { validatedMonths } = useStore.getState();
    const startDate = getHijriMonthStart(selectedHijriYear, selectedHijriMonth, validatedMonths);
    const daysInMonth = getHijriMonthLength(selectedHijriYear, selectedHijriMonth, validatedMonths);

    const mesShort = getHijriShort(selectedHijriMonth);
    const mesHijri = HIJRI_MONTHS[selectedHijriMonth - 1];
    const anioGregStart = startDate.getFullYear();
    const anioGregEnd = addDays(startDate, daysInMonth - 1).getFullYear();
    const anioGregStr = anioGregStart === anioGregEnd ? String(anioGregStart) : `${anioGregStart}/${anioGregEnd}`;

    const tableData: (string | number)[][] = [];

    // Header info
    tableData.push([`FALAK QAYRAN — TABLA DE HORARIOS // ${city.nombre_es.toUpperCase()}`]);
    tableData.push([`MES: ${mesHijri} ${selectedHijriYear} h. (${anioGregStr} E.C.)`]);
    tableData.push([]);

    // Column headers
    tableData.push([mesShort, 'Fecha', 'Fajr', 'Shuruq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);

    let dia28Fecha = '';
    let hasQadr = false;

    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      if (i + 1 === 28) dia28Fecha = fechaStr;
      if (i + 1 === 27 && selectedHijriMonth === 9) hasQadr = true;
      tableData.push([i + 1, fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha]);
    }

    tableData.push([]);

    if (dia28Fecha) {
      tableData.push(['Día de observación:', dia28Fecha, '', '', '', '', '', '']);
    }

    if (hasQadr) {
      tableData.push(['Dia 27 de Ramadan — Laylat al-Qadr', '', '', '', '', '', '', '']);
    }

    tableData.push([]);
    tableData.push([city.geo, '', '', '', '', '', '', '']);
    if (city.contacto) tableData.push([city.contacto, '', '', '', '', '', '', '']);
    if (city.web) tableData.push([city.web, '', '', '', '', '', '', '']);
    tableData.push(['Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18°', '', '', '', '', '', '', '']);
    tableData.push(['DATOS PROPORCIONADOS POR FALAK QAYRAN', '', '', '', '', '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horarios");

    // Column widths
    ws['!cols'] = [
      { wch: 8 },   // Dia
      { wch: 16 },  // Fecha
      { wch: 8 },   // Fajr
      { wch: 8 },   // Shuruq
      { wch: 8 },   // Dhuhr
      { wch: 8 },   // Asr
      { wch: 9 },   // Maghrib
      { wch: 9 }    // Isha
    ];

    XLSX.writeFile(wb, `FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2,'0')}.xlsx`);
  } catch (e) {
    console.error(e);
    alert('Error generando el archivo XLSX.');
  } finally {
    setIsGenerating(false);
  }
};
