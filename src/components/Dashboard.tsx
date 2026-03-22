import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { calcularHorariosOracion } from '../lib/prayerTimesEngine';
import { CITIES } from '../lib/cities';

const Dashboard: React.FC = () => {
  const { selectedCityId } = useStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const city = CITIES[selectedCityId];
  if (!city) return null;

  const prayers = calcularHorariosOracion(city.coords.lat, city.coords.lng, city.coords.alt, now);
  const localTimes = prayers.local;

  const parseTime = (timeStr: string) => {
    if (!timeStr || timeStr.startsWith('No')) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const schedule = [
    { name: 'fajr', time: parseTime(localTimes.fajr) },
    { name: 'shuruq', time: parseTime(localTimes.shuruq) },
    { name: 'dhuhr', time: parseTime(localTimes.dhuhr) },
    { name: 'asr', time: parseTime(localTimes.asr) },
    { name: 'maghrib', time: parseTime(localTimes.maghrib) },
    { name: 'isha', time: parseTime(localTimes.isha) },
  ];

  let nextPrayerName = 'none';
  let nextPrayerTime: Date | null = null;

  for (const p of schedule) {
    if (p.time && p.time.getTime() > now.getTime()) {
      nextPrayerName = p.name;
      nextPrayerTime = p.time;
      break;
    }
  }

  let countdown = '';
  if (nextPrayerTime) {
    const diff = nextPrayerTime.getTime() - now.getTime();
    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      countdown = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full items-stretch">
      {/* Date & Location Header - Takes left half on large screens */}
      <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] flex-1 flex flex-col items-center justify-center relative overflow-hidden group min-h-[300px] p-8" style={{ backgroundColor: city.col_pri }}>
        <p className="font-mono text-sm font-bold tracking-widest text-white opacity-90 mb-4 z-10 text-center uppercase">
          {city.nombre_es} // PRÓXIMO REZO //
        </p>
        <h3 className="font-serif text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter mb-6 z-10 leading-none text-white text-center">
          {nextPrayerName !== 'none' ? nextPrayerName : 'MAÑANA'}
        </h3>
        <div className="font-mono text-5xl md:text-6xl font-black tracking-widest z-10 text-center" style={{ color: city.col_acc }}>
          {countdown || '--:--:--'}
        </div>
      </div>

      {/* Prayers List - Takes right half */}
      <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] flex-1 flex flex-col">
        <div className="bg-black text-white p-4 flex justify-between items-center font-mono text-xs font-bold uppercase tracking-widest">
          <span>Rezo Hoy ({format(now, 'dd/MM/yy')})</span>
          <span>Hora Local</span>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <PrayerRow name="Fajr" time={localTimes.fajr} isActive={nextPrayerName === 'fajr'} />
          <PrayerRow name="Amanecer" time={localTimes.shuruq} isActive={nextPrayerName === 'shuruq'} />
          <PrayerRow name="Dhuhr" time={localTimes.dhuhr} isActive={nextPrayerName === 'dhuhr'} />
          <PrayerRow name="Asr" time={localTimes.asr} isActive={nextPrayerName === 'asr'} isMaliki />
          <PrayerRow name="Maghrib" time={localTimes.maghrib} isActive={nextPrayerName === 'maghrib'} />
          <PrayerRow name="Isha" time={localTimes.isha} isActive={nextPrayerName === 'isha'} />
        </div>
      </div>
    </div>
  );
};

const PrayerRow = ({ name, time, isActive, isMaliki }: { name: string, time: string, isActive: boolean, isMaliki?: boolean }) => (
  <div className={`flex justify-between items-center p-4 md:p-5 border-b-2 border-black last:border-b-0 transition-colors flex-1 ${isActive ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}`}>
    <div className="flex items-center gap-3">
      <span className="font-serif text-2xl md:text-3xl font-black uppercase tracking-tighter">
        {name}
      </span>
      {isMaliki && (
        <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border ${isActive ? 'border-white text-white' : 'border-black text-black'}`}>
          MALIKI x1
        </span>
      )}
    </div>
    <span className="font-mono text-xl md:text-2xl font-bold tracking-widest">
      {time}
    </span>
  </div>
);

export default Dashboard;
