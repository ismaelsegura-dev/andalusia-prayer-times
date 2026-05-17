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

/** Abreviatura del mes hijri */
function getHijriShort(monthIndex: number) {
  const shorts = ["Muh.","Saf.","R.A.","R.T.","J.A.","J.T.","Raj.","Sha.","Ram.","Shw.","D.Q.","D.H."];
  return shorts[monthIndex - 1] ?? "Día";
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

    const mesShort = getHijriShort(selectedHijriMonth);
    const mesHijri = HIJRI_MONTHS[selectedHijriMonth - 1];
    const anioGregStart = startDate.getFullYear();
    const anioGregEnd = addDays(startDate, daysInMonth - 1).getFullYear();
    const anioGregStr = anioGregStart === anioGregEnd ? String(anioGregStart) : `${anioGregStart}/${anioGregEnd}`;

    // ── Build rows ──────────────────────────────────────────────────────
    const rows: { vals: string[]; isQadr: boolean }[] = [];
    let dia28Fecha = '';
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      const isQadr = (i + 1) === 27 && selectedHijriMonth === 9;
      if (i + 1 === 28) dia28Fecha = fechaStr;
      rows.push({
        vals: [String(i + 1), fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha],
        isQadr
      });
    }

    // ── Create off-screen container (A4 @ 96dpi → 794×1123px) ───────────
    const A4_W = 794;
    const A4_H = 1123;
    const MARGIN = 28;
    const priColor = city.col_pri;
    const priCss = hexToCssRgb(priColor);
    const secCss = hexToCssRgb(city.col_sec);
    const accCss = hexToCssRgb(city.col_acc);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: ${A4_W}px;
      height: ${A4_H}px;
      background: #fff;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      box-sizing: border-box;
      padding: ${MARGIN}px;
      display: flex;
      flex-direction: column;
      transform: translateX(-110%);
      opacity: 0.01;
      pointer-events: none;
    `;
    wrapper.style.border = '3px solid #000';

    // ── Header ──────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = `text-align:center; border-bottom: 2px solid ${accCss}; padding-bottom: 6px; margin-bottom: 6px;`;
    const title = city.fundacion ? city.fundacion.toUpperCase() : city.nombre_es.toUpperCase();
    header.innerHTML = `
      <div style="font-family: Helvetica, Arial, sans-serif; font-size:22px; font-weight:900; letter-spacing:-0.5px; margin-bottom:2px;">${title}</div>
      <div style="font-family: Helvetica, Arial, sans-serif; font-size:9px; color:#333; margin-bottom:3px;">Parte de los momentos del salah correspondiente al mes de ${mesHijri} del año ${selectedHijriYear} h. (${anioGregStr} E.C.)</div>
      <div style="font-family: Helvetica, Arial, sans-serif; font-size:9px; color:#333;">para la ciudad de ${city.nombre_es} y cercanías.</div>
    `;
    wrapper.appendChild(header);

    // ── Table ────────────────────────────────────────────────────────────
    const table = document.createElement('table');
    const rowFontSize = daysInMonth > 28 ? '9px' : '9.5px';
    table.style.cssText = `width:100%; border-collapse:collapse; font-size:${rowFontSize}; flex-shrink:0;`;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    [mesShort,'Fecha','Fajr','Shuruq','Dhuhr','Asr','Maghrib','Isha'].forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      let extra = '';
      if (h === 'Maghrib') extra = `color:${secCss};`;
      if (h === 'Shuruq') extra = `color:#888;`;
      th.style.cssText = `background:${priCss}; color:#fff; padding:3px 2px; border:1px solid #000; text-align:center; font-weight:700; letter-spacing:0.5px; font-family:Courier New,monospace; ${extra}`;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const bg = row.isQadr ? '#FFFBF0' : (idx % 2 === 1 ? '#f5f5f5' : '#fff');
      row.vals.forEach((cell, ci) => {
        const td = document.createElement('td');
        td.textContent = cell;
        let cellStyle = `padding:2px 2px; border:1px solid #000; text-align:center; background:${bg}; font-family:Courier New,monospace;`;
        if (ci === 0) {
          cellStyle += ` font-weight:bold; color:${row.isQadr ? '#7B5800' : priCss};`;
        }
        if (ci === 1) {
          cellStyle += ` text-align:left; padding-left:4px; color:#333;`;
        }
        if (ci === 3) {
          cellStyle += ` color:#888;`;
        }
        if (ci === 6) {
          cellStyle += ` font-weight:bold; color:${secCss};`;
        }
        if (row.isQadr && ci === 0) {
          cellStyle += ` border-left:3px solid ${accCss};`;
        }
        td.style.cssText = cellStyle;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);

    // ── Dia de Observacion ──
    if (dia28Fecha) {
      const obsDiv = document.createElement('div');
    obsDiv.style.cssText = `margin-top:4px; padding:3px; background:#FFFBF0; border:1px solid ${accCss}; border-radius:2px; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:8px; font-weight:bold; color:#7B5800;`;
    obsDiv.textContent = `Día de observación: ${dia28Fecha}`;
      wrapper.appendChild(obsDiv);
    }

    // ── Laylat al-Qadr (solo Ramadan) ──
    if (selectedHijriMonth === 9 && rows.some(r => r.isQadr)) {
      const qadrDiv = document.createElement('div');
      qadrDiv.style.cssText = `margin-top:4px; padding:3px; background:#FFFBF0; border:1px solid ${accCss}; border-radius:2px; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:8px; font-weight:bold; color:#7B5800;`;
      qadrDiv.textContent = 'Día 27 de Ramadán — Laylat al-Qadr';
      wrapper.appendChild(qadrDiv);
    }

    // ── Footer ───────────────────────────────────────────────────────────
    const footer = document.createElement('div');
    footer.style.cssText = `margin-top:auto; padding-top:4px; text-align:center; font-family:Helvetica,Arial,sans-serif;`;

    // Decorative lines
    footer.innerHTML += `<div style="border-top:2px solid ${accCss}; margin-bottom:1px;"></div>`;
    footer.innerHTML += `<div style="border-top:1px solid ${priCss}; margin-bottom:3px;"></div>`;

    footer.innerHTML += `<div style="font-size:7px; color:#444; margin-bottom:2px;">${city.geo}</div>`;
    if (city.contacto) {
      footer.innerHTML += `<div style="font-size:7px; color:#333; margin-bottom:1px;">${city.contacto}</div>`;
    }
    if (city.web) {
      footer.innerHTML += `<div style="font-size:7px; color:${secCss}; margin-bottom:1px;">${city.web}</div>`;
    }
    footer.innerHTML += `<div style="font-size:6.5px; color:#aaa; margin-bottom:4px;">Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18°</div>`;

    const watermark = document.createElement('div');
    watermark.style.cssText = `background:#000; color:#fff; text-align:center; padding:4px 0; font-size:7px; font-weight:700; letter-spacing:0.5px; font-family:Helvetica,Arial,sans-serif;`;
    watermark.textContent = 'DATOS PROPORCIONADOS POR FALAK QAYRAN';
    footer.appendChild(watermark);
    wrapper.appendChild(footer);

    document.body.appendChild(wrapper);

    // Esperar layout completo del navegador antes de capturar
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 120));

    // ── Capture ──────────────────────────────────────────────────────────
    const dataUrl = await toPng(wrapper, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
    });

    document.body.removeChild(wrapper);

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
