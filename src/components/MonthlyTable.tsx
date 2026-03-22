import React, { useState } from 'react';
import { useStore } from '../store';
import { calcularHorariosOracion } from '../lib/prayerTimesEngine';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CITIES } from '../lib/cities';
import { generateHighFidelityPDF } from '../lib/pdfGenerator';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonthlyTable: React.FC = () => {
  const { selectedCityId, selectedMonth, selectedYear } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const city = CITIES[selectedCityId];
  if (!city) return null;

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const startDate = new Date(selectedYear, selectedMonth - 1, 1);

  return (
    <div className="flex flex-col h-full border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
      {/* Header */}
      <div className="p-6 md:p-8 border-b-4 border-black flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-gray-50 flex-shrink-0">
        <div>
          <h2 className="font-serif text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
            TABLA<br/>MENSUAL
          </h2>
          <span className="font-mono text-sm font-bold px-4 py-2 bg-black text-white uppercase tracking-widest">
            {MONTHS[selectedMonth-1]} {selectedYear}
          </span>
        </div>
        <button 
          onClick={() => generateHighFidelityPDF(selectedCityId, selectedMonth, selectedYear, setIsGenerating)}
          disabled={isGenerating}
          className="font-mono text-xs font-bold uppercase tracking-widest border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors bg-white shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '[ GENERANDO... ]' : '[ DESCARGAR PDF OFICIAL ]'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-black text-white font-mono text-xs uppercase tracking-widest sticky top-0" style={{ backgroundColor: city.col_pri }}>
              <th className="p-4 border-r border-gray-800">Día</th>
              <th className="p-4 border-r border-gray-800">Fajr</th>
              <th className="p-4 border-r border-gray-800 text-gray-300">Amanecer</th>
              <th className="p-4 border-r border-gray-800">Dhuhr</th>
              <th className="p-4 border-r border-gray-800">Asr</th>
              <th className="p-4 border-r border-gray-800 font-bold shadow-inner" style={{ color: city.col_acc }}>Maghrib</th>
              <th className="p-4">Isha</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm md:text-base">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = addDays(startDate, i);
              const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d).local;
              return (
                <tr key={i} className="border-b-2 border-gray-200 hover:bg-gray-100 transition-colors last:border-b-0 group">
                  <td className="p-4 border-r-2 border-gray-200 bg-gray-50 font-bold text-left group-hover:bg-black group-hover:text-white transition-colors w-1/4">
                    <span className="opacity-50 mr-2 text-xs">{format(d, 'EEEE', { locale: es }).slice(0,3)}</span>
                    {format(d, 'dd/MM')}
                  </td>
                  <td className="p-4 border-r border-gray-200 font-bold">{p.fajr}</td>
                  <td className="p-4 border-r border-gray-200 text-gray-400">{p.shuruq}</td>
                  <td className="p-4 border-r border-gray-200 font-bold">{p.dhuhr}</td>
                  <td className="p-4 border-r border-gray-200 font-bold">{p.asr}</td>
                  <td className="p-4 border-r-2 border-gray-200 font-black bg-gray-50" style={{ color: city.col_sec }}>{p.maghrib}</td>
                  <td className="p-4 font-bold">{p.isha}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t-4 border-black bg-black text-white text-center flex-shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-80">
          * Horarios calculados matemáticamente bajo jurisprudencia Maliki (Ángulos: 18° / 17°) para {city.nombre_es}
        </p>
      </div>
    </div>
  );
};

export default MonthlyTable;
