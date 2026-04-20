import { toPng } from 'html-to-image';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularHorariosOracion } from './prayerTimesEngine';
import { CITIES } from './cities';
import { HIJRI_MONTHS, getHijriMonthStart, getHijriMonthLength } from './lunar-calendar';
import { useStore } from '../store';

/** Hex → CSS rgb() */
function hexToCssRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `rgb(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)})` : '#000';
}

export const generatePNG = async (
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

    // ── Build rows ──────────────────────────────────────────────────────
    const rows: string[][] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      rows.push([
        `${i + 1} ${HIJRI_MONTHS[selectedHijriMonth-1].substring(0,3).toUpperCase()} [${format(d, 'dd/MM', { locale: es })}]`,
        p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha
      ]);
    }

    // ── Create off-screen container (A4 @ 96dpi → 794×1123px) ───────────
    const A4_W = 794;
    const A4_H = 1123;
    const MARGIN = 32;
    const priColor = city.col_pri;
    const priCss = hexToCssRgb(priColor);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed; left: -9999px; top: -9999px;
      width: ${A4_W}px; height: ${A4_H}px;
      background: #fff;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      box-sizing: border-box;
      padding: ${MARGIN}px;
      display: flex;
      flex-direction: column;
    `;

    // Outer border
    wrapper.style.border = '3px solid #000';

    // ── Header ──────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = `text-align:center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 10px;`;
    const cityTitle = city.nombre_es.toUpperCase();
    header.innerHTML = `
      <div style="font-family: Helvetica, Arial, sans-serif; font-size:26px; font-weight:900; letter-spacing:-1px; margin-bottom:4px;">${cityTitle}</div>
      <div style="font-size:11px; font-weight:700; letter-spacing:2px; margin-bottom:6px;">FALAK QAYRAN // HORARIOS DE ORACIÓN</div>
      <div style="font-size:13px; font-weight:700; letter-spacing:1px; margin-bottom:4px;">${HIJRI_MONTHS[selectedHijriMonth-1].toUpperCase()} ${selectedHijriYear}</div>
      <div style="font-size:8px; opacity:0.6;">LAT: ${city.coords.lat.toFixed(4)}° // LNG: ${city.coords.lng.toFixed(4)}° // ALT: ${city.coords.alt}m</div>
    `;
    wrapper.appendChild(header);

    // ── Table ────────────────────────────────────────────────────────────
    const table = document.createElement('table');
    table.style.cssText = `width:100%; border-collapse:collapse; font-size:${daysInMonth > 28 ? '9.5px' : '10.5px'}; flex:1;`;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['FECHA','FAJR','SHURUQ','DHUHR','ASR','MAGHRIB','ISHA'].forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.cssText = `background:${priCss}; color:#fff; padding:5px 4px; border:1px solid #000; text-align:center; font-weight:700; letter-spacing:1px;`;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const bg = idx % 2 === 1 ? '#e1e1e1' : '#fff';
      row.forEach((cell, ci) => {
        const td = document.createElement('td');
        td.textContent = cell;
        let cellStyle = `padding:4px; border:1px solid #000; text-align:center; background:${bg};`;
        if (ci === 0) {
          cellStyle = `padding:4px 6px; border:1px solid #000; text-align:left; background:#d2d2d2; font-weight:700;`;
        }
        td.style.cssText = cellStyle;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);

    // ── Footer ───────────────────────────────────────────────────────────
    const footer = document.createElement('div');
    footer.style.cssText = `margin-top:auto; padding-top:8px; border-top:1px solid #000; text-align:center; font-size:7px;`;
    if (city.fundacion) {
      footer.innerHTML += `<div style="font-weight:700; font-size:9px; margin-bottom:2px;">${city.fundacion.toUpperCase()}</div>`;
    }
    let contact = '';
    if (city.contacto) contact += city.contacto + ' | ';
    if (city.web) contact += city.web;
    if (contact) footer.innerHTML += `<div style="opacity:0.7; margin-bottom:4px;">${contact}</div>`;
    footer.innerHTML += `<div style="opacity:0.6; margin-bottom:6px; font-style:italic;">* Horarios calculados matemáticamente bajo jurisprudencia Maliki (Ángulos: 18° / 17°) para ${city.nombre_es.toLowerCase().startsWith('mezquita') ? city.nombre_es : `Mezquita de ${city.nombre_es}`}.</div>`;

    const watermark = document.createElement('div');
    watermark.style.cssText = `background:#000; color:#fff; text-align:center; padding:5px 0; font-size:8px; font-weight:700; letter-spacing:1px;`;
    watermark.textContent = 'DATOS PROPORCIONADOS POR FALAK QAYRAN';
    footer.appendChild(watermark);
    wrapper.appendChild(footer);

    document.body.appendChild(wrapper);

    // ── Capture ──────────────────────────────────────────────────────────
    const dataUrl = await toPng(wrapper, {
      width: A4_W,
      height: A4_H,
      pixelRatio: 2, // Retina quality
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(wrapper);

    // Trigger download
    const link = document.createElement('a');
    link.download = `FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2,'0')}.png`;
    link.href = dataUrl;
    link.click();

  } catch (e) {
    console.error(e);
    alert('Error generando PNG.');
  } finally {
    setIsGenerating(false);
  }
};
