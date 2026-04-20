import React, { useState } from 'react';
import { useStore } from '../store';
import { CITIES } from '../lib/cities';
import { generateHighFidelityPDF } from '../lib/pdfGenerator';
import { HIJRI_MONTHS, getValidatedLunarDate } from '../lib/lunar-calendar';

const FalakQayranSelector: React.FC = () => {
  const { 
    selectedCityId, setSelectedCityId,
    selectedHijriMonth, setSelectedHijriMonth,
    selectedHijriYear, setSelectedHijriYear,
    validatedMonths
  } = useStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Always detect the current Hijri date on every fresh load
  React.useEffect(() => {
    const current = getValidatedLunarDate(new Date(), validatedMonths);
    setSelectedHijriMonth(current.month);
    setSelectedHijriYear(current.year);
  // intentionally empty deps — run once on mount to set today's Hijri date
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Current Hijri date — used to lock future months
  const todayHijri = getValidatedLunarDate(new Date(), validatedMonths);
  const years = [1448, 1447, 1446, 1445]; // newest first

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
                    {city.nombre_es.toLowerCase().startsWith('mezquita') ? city.nombre_es : `Mezquita de ${city.nombre_es}`}
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
                MES HIJRI
              </label>
              <div className="relative">
                <select 
                  value={selectedHijriMonth}
                  onChange={(e) => setSelectedHijriMonth(parseInt(e.target.value))}
                  className="w-full border-4 border-black p-4 font-mono text-xl font-bold uppercase appearance-none bg-white cursor-pointer focus:outline-none focus:bg-gray-50"
                >
                  {HIJRI_MONTHS.map((m, i) => {
                    const monthNum = i + 1;
                    const monthKey = `${selectedHijriYear}-${monthNum.toString().padStart(2, '0')}`;
                    const isValidated = !!validatedMonths[monthKey];
                    const isFuture =
                      selectedHijriYear > todayHijri.year ||
                      (selectedHijriYear === todayHijri.year && monthNum > todayHijri.month);
                    
                    // A month is available if it's not future OR if it has been validated by the Emir
                    const isDisabled = isFuture && !isValidated;

                    return (
                      <option key={monthNum} value={monthNum} disabled={isDisabled}>
                        {m}{isDisabled ? ' 🔒' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                  ▼
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-40">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
                AÑO HIJRI
              </label>
              <div className="relative">
                <select 
                  value={selectedHijriYear}
                  onChange={(e) => setSelectedHijriYear(parseInt(e.target.value))}
                  className="w-full border-4 border-black p-4 font-mono text-xl font-bold uppercase appearance-none bg-white cursor-pointer focus:outline-none focus:bg-gray-50"
                >
                  {years.map(y => {
                    const isFutureYear = y > todayHijri.year;
                    return (
                      <option key={y} value={y} disabled={isFutureYear}>
                        {y}{isFutureYear ? ' 🔒' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="w-full xl:w-auto flex-shrink-0 flex flex-col sm:flex-row gap-3">
          {/* PDF */}
          <DownloadButton
            id="btn-download-pdf"
            label="PDF"
            isGenerating={isGenerating}
            onClick={async () => {
              await generateHighFidelityPDF(selectedCityId, selectedHijriMonth, selectedHijriYear, setIsGenerating);
              setDownloadSuccess(true);
              setTimeout(() => setDownloadSuccess(false), 2000);
            }}
            successLabel={downloadSuccess}
          />
          {/* PNG */}
          <DownloadButton
            id="btn-download-png"
            label="PNG"
            isGenerating={isGenerating}
            onClick={async () => {
              const { generatePNG } = await import('../lib/pngGenerator');
              await generatePNG(selectedCityId, selectedHijriMonth, selectedHijriYear, setIsGenerating);
            }}
          />
          {/* XLSX */}
          <DownloadButton
            id="btn-download-xlsx"
            label="XLSX"
            isGenerating={isGenerating}
            onClick={async () => {
              const { generateXLSX } = await import('../lib/xlsxGenerator');
              generateXLSX(selectedCityId, selectedHijriMonth, selectedHijriYear, setIsGenerating);
            }}
          />
        </div>
      </div>
    </div>
  );
};

const DownloadButton = ({
  id,
  label,
  isGenerating,
  onClick,
  successLabel,
}: {
  id: string;
  label: string;
  isGenerating: boolean;
  onClick: () => void;
  successLabel?: boolean;
}) => (
  <button
    id={id}
    onClick={onClick}
    disabled={isGenerating}
    className={`font-mono text-sm font-bold uppercase tracking-widest border-2 px-6 py-4 transition-all h-[60px] flex items-center justify-center cursor-pointer whitespace-nowrap ${
      successLabel
        ? 'border-black bg-white text-black shadow-none translate-x-[4px] translate-y-[4px]'
        : 'border-black bg-black text-white hover:bg-white hover:text-black shadow-[4px_4px_0_0_#D1D5DB] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {isGenerating ? '[ ... ]' : successLabel ? '[ ✔ ]' : `[ ↓ ${label} ]`}
  </button>
);

export default FalakQayranSelector;
