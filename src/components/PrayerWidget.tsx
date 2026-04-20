import React, { useState, useEffect } from 'react';
import { calcularHorariosOracion } from '../lib/prayerTimesEngine';
import { CITIES, CityConfig } from '../lib/cities';

// ─────────────────────────────────────────────────────────────────────────────
//  WIDGET — Contador + Horarios del Día
//  Ruta: /widget?city=granada&key=SECRET_KEY
//
//  SEGURIDAD:
//    1. Si la ?key no coincide con WIDGET_SECRET_KEY → pantalla bloqueada.
//    2. No hay enlace público a esta ruta en la UI de la app.
//    3. Solo tú conoces la clave y la compartes a quien autorizas (mezquitas).
//
//  EMBEDDING (iframe):
//    <iframe
//      src="https://falak-qayran.vercel.app/widget?city=granada&key=TU_CLAVE"
//      width="400" height="520" frameborder="0" style="border:none;"
//    ></iframe>
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️  CAMBIA ESTA CLAVE antes de compartirla — no la publiques en ningún commit público.
const WIDGET_SECRET_KEY = 'falak2024emir';

const PRAYER_NAMES: Record<string, string> = {
  fajr: 'Fajr',
  shuruq: 'Amanecer',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

function parseTimeToDate(timeStr: string, ref: Date): Date | null {
  if (!timeStr || timeStr.startsWith('No')) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(ref);
  d.setHours(h, m, 0, 0);
  return d;
}

const PrayerWidget: React.FC = () => {
  // ── Auth check ─────────────────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const key = params.get('key') ?? '';
  const cityId = params.get('city') ?? 'alcala';

  if (key !== WIDGET_SECRET_KEY) {
    return (
      <div style={{
        fontFamily: 'monospace',
        background: '#000',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        flexDirection: 'column',
        gap: '1rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem' }}>🔒</div>
        <div style={{ fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.75rem' }}>
          ACCESO RESTRINGIDO<br />FALAK QAYRĀN
        </div>
        <div style={{ opacity: 0.5, fontSize: '0.65rem', maxWidth: '200px', lineHeight: 1.6 }}>
          Este widget requiere autorización.<br />Contacta con el administrador de Falak Qayrān.
        </div>
      </div>
    );
  }

  const city: CityConfig | undefined = CITIES[cityId];
  if (!city) {
    return (
      <div style={{
        fontFamily: 'monospace', background: '#111', color: '#fff',
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.75rem', letterSpacing: '0.1em'
      }}>
        CIUDAD NO ENCONTRADA: {cityId}
      </div>
    );
  }

  return <WidgetContent city={city} />;
};

const WidgetContent: React.FC<{ city: CityConfig }> = ({ city }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const prayers = calcularHorariosOracion(
    city.coords.lat, city.coords.lng, city.coords.alt, now, city.maghribOffset
  );
  const local = prayers.local;

  const schedule = Object.entries(PRAYER_NAMES).map(([key, label]) => ({
    key,
    label,
    time: local[key as keyof typeof local],
    date: parseTimeToDate(local[key as keyof typeof local], now),
  }));

  // Find the next prayer
  const upcoming = schedule.filter(p => p.date && p.date.getTime() > now.getTime());
  const next = upcoming[0] ?? null;

  let countdown = '--:--:--';
  let isUrgent = false;
  if (next?.date) {
    const diff = next.date.getTime() - now.getTime();
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      countdown = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      isUrgent = diff < 60 * 60 * 1000;
    }
  }

  const nextDisplayTime = next?.date
    ? `${String(next.date.getHours()).padStart(2,'0')}:${String(next.date.getMinutes()).padStart(2,'0')}`
    : '';

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      background: city.col_pri,
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
    }}>
      {/* City header */}
      <div style={{
        padding: '1rem 1.25rem 0.75rem',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em', lineHeight: 1, textTransform: 'uppercase' }}>
            {city.nombre_es}
          </div>
          <div style={{ fontSize: '0.55rem', opacity: 0.7, letterSpacing: '0.15em', marginTop: '2px' }}>
            FALAK QAYRĀN // HORARIOS
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.6rem', opacity: 0.7, letterSpacing: '0.1em' }}>
          {now.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
        </div>
      </div>

      {/* Countdown hero */}
      <div style={{
        padding: '1.5rem 1.25rem 1.25rem',
        textAlign: 'center',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
      }}>
        {next && (
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', opacity: 0.75, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
            Próxima: {next.label} · {nextDisplayTime}
          </div>
        )}
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          letterSpacing: '0.05em',
          color: isUrgent ? '#FBBF24' : city.col_acc,
          lineHeight: 1,
          transition: 'color 0.3s',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {countdown}
        </div>
        {next && (
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.5, marginTop: '0.4rem' }}>
            {next.key.toUpperCase()}
          </div>
        )}
      </div>

      {/* Prayer times list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {schedule.map(({ key, label, time }) => {
          const isNext = next?.key === key;
          return (
            <div key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              background: isNext ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'background 0.3s',
            }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: isNext ? 900 : 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                opacity: isNext ? 1 : 0.7,
              }}>
                {label}
                {key === 'asr' && (
                  <span style={{
                    fontSize: '0.45rem',
                    letterSpacing: '0.1em',
                    marginLeft: '0.4rem',
                    opacity: 0.6,
                    border: '1px solid rgba(255,255,255,0.4)',
                    padding: '1px 3px',
                  }}>
                    MALIKI
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: isNext ? city.col_acc : 'rgba(255,255,255,0.85)',
              }}>
                {time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer brand */}
      <div style={{
        padding: '0.6rem',
        textAlign: 'center',
        fontSize: '0.5rem',
        letterSpacing: '0.15em',
        opacity: 0.4,
        textTransform: 'uppercase',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        Falak Qayrān · Motor Maliki Soberano
      </div>
    </div>
  );
};

export default PrayerWidget;
