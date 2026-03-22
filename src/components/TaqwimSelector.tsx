import React, { useState } from 'react';
import { useStore } from '../store';
import { CITIES } from '../lib/cities';
import { generateHighFidelityPDF } from '../lib/pdfGenerator';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const TaqwimSelector: React.FC = () => {
  const { 
    selectedCityId, setSelectedCityId,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear
  } = useStore();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i + 1); // allow 1 year future, 3 past
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="border-4 border-black p-6 md:p-8 bg-white shadow-[8px_8px_0_0_#000] mb-8 relative z-20">
      <div className="flex flex-col xl:flex-row gap-6 items-end">
        <div className="flex flex-col md:flex-row gap-6 flex-1 w-full">
          {/* City Select */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
              COMUNIDAD ISLÁMICA // CIUDAD
            </label>
            <div className="relative">
              <select 
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="w-full border-4 border-black p-4 font-serif text-2xl font-black uppercase appearance-none bg-white cursor-pointer focus:outline-none focus:bg-gray-50"
              >
                {Object.values(CITIES).map(city => (
                  <option key={city.id} value={city.id}>
                    Mezquita de {city.nombre_es}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                ▼
              </div>
            </div>
          </div>

          {/* Date Selectors Group */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col gap-2 w-full sm:w-56">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
                MES GREGORIANO
              </label>
              <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border-4 border-black p-4 font-mono text-xl font-bold uppercase appearance-none bg-white cursor-pointer focus:outline-none focus:bg-gray-50"
                >
                  {MONTHS.map((m, i) => (
                     <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-40">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
                AÑO
              </label>
              <div className="relative">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border-4 border-black p-4 font-mono text-xl font-bold uppercase appearance-none bg-white cursor-pointer focus:outline-none focus:bg-gray-50"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button Wrapper */}
        <div className="w-full xl:w-auto flex-shrink-0">
          <button 
            onClick={() => generateHighFidelityPDF(selectedCityId, selectedMonth, selectedYear, setIsGenerating)}
            disabled={isGenerating}
            className="w-full xl:w-auto font-mono text-sm md:text-base font-bold uppercase tracking-widest border-2 border-black px-8 py-4 bg-black text-white hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0_0_#D1D5DB] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed h-[60px] flex items-center justify-center cursor-pointer"
          >
            {isGenerating ? '[ GENERANDO... ]' : '[ DESCARGAR PDF ]'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaqwimSelector;
