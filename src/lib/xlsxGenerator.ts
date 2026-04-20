import * as XLSX from 'xlsx';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularHorariosOracion } from './prayerTimesEngine';
import { CITIES } from './cities';
import { HIJRI_MONTHS, getHijriMonthStart, getHijriMonthLength } from './lunar-calendar';
import { useStore } from '../store';

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

    const tableData = [];
    tableData.push([
      `FALAK QAYRAN - TABLA DE HORARIOS // ${city.nombre_es.toUpperCase()}`
    ]);
    tableData.push([
      `MES: ${HIJRI_MONTHS[selectedHijriMonth-1].toUpperCase()} ${selectedHijriYear}`
    ]);
    tableData.push([]);
    
    tableData.push(['FECHA', 'FAJR', 'SHURUQ', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']);

    for (let i = 0; i < daysInMonth; i++) {
        const d = addDays(startDate, i);
        const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
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

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horarios");
    
    // Column widths
    ws['!cols'] = [
        { wch: 25 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 }
    ];

    XLSX.writeFile(wb, `FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2,'0')}.xlsx`);
  } catch (e) {
    console.error(e);
    alert('Error generando el archivo XLSX.');
  } finally {
    setIsGenerating(false);
  }
};
