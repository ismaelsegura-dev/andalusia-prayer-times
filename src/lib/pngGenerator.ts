import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularHorariosOracion } from './prayerTimesEngine';
import { CITIES } from './cities';
import { HIJRI_MONTHS, getHijriMonthStart, getHijriMonthLength } from './lunar-calendar';
import { useStore } from '../store';

/** Hex → [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
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
    let dia29Fecha = '';
    for (let i = 0; i < daysInMonth; i++) {
      const d = addDays(startDate, i);
      const p = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, d, city.maghribOffset).local;
      const fechaStr = format(d, 'EEE dd MMM', { locale: es }).toLowerCase();
      const isQadr = (i + 1) === 27 && selectedHijriMonth === 9;
      if (i + 1 === 29) dia29Fecha = fechaStr;
      rows.push({
        vals: [String(i + 1), fechaStr, p.fajr, p.shuruq, p.dhuhr, p.asr, p.maghrib, p.isha],
        isQadr
      });
    }

    // ── Canvas setup (A4 @ 2x) ─────────────────────────────────────────
    const SCALE = 2;
    const W = 794 * SCALE;
    const MARGIN = 28 * SCALE;
    const COLS = 8;
    const COL_W = (W - MARGIN * 2) / COLS;

    // Calculate total height needed
    const HEADER_H = 80;
    const ROW_H = 28;
    const FOOTER_H = 120;
    const OBS_H = 30;
    const totalH = MARGIN + HEADER_H + (daysInMonth * ROW_H) + (dia29Fecha ? OBS_H : 0) + FOOTER_H;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;

    const rgbPri = hexToRgb(city.col_pri);
    const rgbSec = hexToRgb(city.col_sec);
    const rgbAcc = hexToRgb(city.col_acc);

    // ── Background ──────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, totalH);

    // ── Border ──────────────────────────────────────────────────────────
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3 * SCALE;
    ctx.strokeRect(MARGIN / 2, MARGIN / 2, W - MARGIN, totalH - MARGIN);

    let y = MARGIN + 10;

    // ── Header ──────────────────────────────────────────────────────────
    const title = city.fundacion ? city.fundacion.toUpperCase() : city.nombre_es.toUpperCase();
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${22 * SCALE}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, y);
    y += 24 * SCALE;

    ctx.fillStyle = '#333333';
    ctx.font = `${9 * SCALE}px Helvetica, Arial, sans-serif`;
    ctx.fillText(`Parte de los momentos del salah correspondiente al mes de ${mesHijri} del año ${selectedHijriYear} h. (${anioGregStr} E.C.)`, W / 2, y);
    y += 14 * SCALE;
    ctx.fillText(`para la ciudad de ${city.nombre_es} y cercanías.`, W / 2, y);
    y += 14 * SCALE;

    // Accent line
    ctx.strokeStyle = `rgb(${rgbAcc.join(',')})`;
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 20, y);
    ctx.lineTo(W - MARGIN - 20, y);
    ctx.stroke();
    y += 16 * SCALE;

    // ── Table header ────────────────────────────────────────────────────
    const headers = [mesShort, 'Fecha', 'Fajr', 'Shuruq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const headerBg = `rgb(${rgbPri.join(',')})`;

    ctx.fillStyle = headerBg;
    ctx.fillRect(MARGIN, y, W - MARGIN * 2, ROW_H);

    ctx.font = `bold ${11 * SCALE}px 'Courier New', Courier, monospace`;
    ctx.textAlign = 'center';

    headers.forEach((h, ci) => {
      const cx = MARGIN + ci * COL_W + COL_W / 2;
      const cy = y + ROW_H / 2 + 4 * SCALE;

      if (h === 'Maghrib') {
        ctx.fillStyle = `rgb(${rgbSec.join(',')})`;
      } else if (h === 'Shuruq') {
        ctx.fillStyle = '#888888';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillText(h, cx, cy);
    });

    // Header border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1 * SCALE;
    ctx.strokeRect(MARGIN, y, W - MARGIN * 2, ROW_H);
    y += ROW_H;

    // ── Table rows ──────────────────────────────────────────────────────
    ctx.font = `${11 * SCALE}px 'Courier New', Courier, monospace`;

    rows.forEach((row, ri) => {
      const bg = row.isQadr ? '#FFFBF0' : (ri % 2 === 1 ? '#f5f5f5' : '#ffffff');
      ctx.fillStyle = bg;
      ctx.fillRect(MARGIN, y, W - MARGIN * 2, ROW_H);

      row.vals.forEach((cell, ci) => {
        const cx = MARGIN + ci * COL_W + COL_W / 2;
        const cy = y + ROW_H / 2 + 4 * SCALE;

        if (ci === 0) {
          ctx.fillStyle = row.isQadr ? '#7B5800' : `rgb(${rgbPri.join(',')})`;
          ctx.font = `bold ${11 * SCALE}px 'Courier New', Courier, monospace`;
        } else if (ci === 1) {
          ctx.fillStyle = '#333333';
          ctx.textAlign = 'left';
          ctx.fillText(cell, MARGIN + ci * COL_W + 6 * SCALE, cy);
          ctx.textAlign = 'center';
          // Draw cell border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 0.5 * SCALE;
          ctx.strokeRect(MARGIN + ci * COL_W, y, COL_W, ROW_H);
          return;
        } else if (ci === 3) {
          ctx.fillStyle = '#888888';
          ctx.font = `${11 * SCALE}px 'Courier New', Courier, monospace`;
        } else if (ci === 6) {
          ctx.fillStyle = `rgb(${rgbSec.join(',')})`;
          ctx.font = `bold ${11 * SCALE}px 'Courier New', Courier, monospace`;
        } else {
          ctx.fillStyle = '#000000';
          ctx.font = `${11 * SCALE}px 'Courier New', Courier, monospace`;
        }

        ctx.fillText(cell, cx, cy);

        // Cell border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5 * SCALE;
        ctx.strokeRect(MARGIN + ci * COL_W, y, COL_W, ROW_H);
      });

      y += ROW_H;
    });

    // ── Día de Observación ──────────────────────────────────────────────
    if (dia29Fecha) {
      y += 8 * SCALE;
      const boxH = 26 * SCALE;
      ctx.fillStyle = '#FFFBF0';
      ctx.fillRect(MARGIN + 10, y, W - MARGIN * 2 - 20, boxH);
      ctx.strokeStyle = `rgb(${rgbAcc.join(',')})`;
      ctx.lineWidth = 1 * SCALE;
      ctx.strokeRect(MARGIN + 10, y, W - MARGIN * 2 - 20, boxH);
      ctx.fillStyle = '#7B5800';
      ctx.font = `bold ${10 * SCALE}px Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Día de observación: ${dia29Fecha}`, W / 2, y + boxH / 2 + 3.5 * SCALE);
      y += boxH + 8 * SCALE;
    }

    // ── Laylat al-Qadr ──────────────────────────────────────────────────
    if (selectedHijriMonth === 9 && rows.some(r => r.isQadr)) {
      const boxH = 26 * SCALE;
      ctx.fillStyle = '#FFFBF0';
      ctx.fillRect(MARGIN + 10, y, W - MARGIN * 2 - 20, boxH);
      ctx.strokeStyle = `rgb(${rgbAcc.join(',')})`;
      ctx.lineWidth = 1 * SCALE;
      ctx.strokeRect(MARGIN + 10, y, W - MARGIN * 2 - 20, boxH);
      ctx.fillStyle = '#7B5800';
      ctx.font = `bold ${10 * SCALE}px Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Día 27 de Ramadán — Laylat al-Qadr', W / 2, y + boxH / 2 + 3.5 * SCALE);
      y += boxH + 8 * SCALE;
    }

    // ── Footer ──────────────────────────────────────────────────────────
    y += 10 * SCALE;

    // Decorative lines
    ctx.strokeStyle = `rgb(${rgbAcc.join(',')})`;
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 20, y);
    ctx.lineTo(W - MARGIN - 20, y);
    ctx.stroke();
    y += 4 * SCALE;

    ctx.strokeStyle = `rgb(${rgbPri.join(',')})`;
    ctx.lineWidth = 1 * SCALE;
    ctx.beginPath();
    ctx.moveTo(MARGIN + 20, y);
    ctx.lineTo(W - MARGIN - 20, y);
    ctx.stroke();
    y += 10 * SCALE;

    ctx.fillStyle = '#444444';
    ctx.font = `${8 * SCALE}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(city.geo, W / 2, y);
    y += 14 * SCALE;

    if (city.contacto) {
      ctx.fillStyle = '#333333';
      ctx.fillText(city.contacto, W / 2, y);
      y += 12 * SCALE;
    }
    if (city.web) {
      ctx.fillStyle = `rgb(${rgbSec.join(',')})`;
      ctx.fillText(city.web, W / 2, y);
      y += 12 * SCALE;
    }

    ctx.fillStyle = '#aaaaaa';
    ctx.font = `${7 * SCALE}px Helvetica, Arial, sans-serif`;
    ctx.fillText('Calculado con rigor astronómico · Fiqh Maliki · Ángulo de crepúsculo 18°', W / 2, y);
    y += 16 * SCALE;

    // Watermark
    const wmH = 22 * SCALE;
    ctx.fillStyle = '#000000';
    ctx.fillRect(MARGIN + 10, y, W - MARGIN * 2 - 20, wmH);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${9 * SCALE}px Helvetica, Arial, sans-serif`;
    ctx.fillText('DATOS PROPORCIONADOS POR FALAK QAYRAN', W / 2, y + wmH / 2 + 3 * SCALE);

    // ── Download ────────────────────────────────────────────────────────
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `FALAK_QAYRAN_${city.id.toUpperCase()}_${selectedHijriYear}_${selectedHijriMonth.toString().padStart(2,'0')}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (e) {
    console.error('PNG generation error:', e);
    alert('Error generando PNG. Revisa la consola para más detalles.');
  } finally {
    setIsGenerating(false);
  }
};
