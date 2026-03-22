import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

const LocationProvider: React.FC = () => {
  const { location, setLocation } = useStore();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (location) return;

    if (!navigator.geolocation) {
      setErrorMsg('Geolocalización no soportada en este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          alt: pos.coords.altitude || 0
        });
      },
      (err) => {
        setErrorMsg('Denegado o error: ' + err.message);
      }
    );
  }, [location, setLocation]);

  if (location) return null;

  return (
    <section className="p-8 md:p-12 max-w-3xl mx-auto mt-12 mb-12 border-4 border-black bg-white shadow-[12px_12px_0_0_#000]">
      <header className="mb-8 border-b-2 border-black pb-6 flex justify-between items-start">
        <h2 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
          UBICACIÓN<br/>REQUERIDA
        </h2>
        <span className="font-mono text-xs font-bold px-3 py-1 bg-black text-white">
          S.O.S
        </span>
      </header>
      
      <p className="font-mono text-sm md:text-base leading-relaxed max-w-2xl mb-12 text-gray-800">
        EL MOTOR DE PRECISIÓN DE ANDALUCÍA REQUIERE CONOCER TU UBICACIÓN EXACTA PARA CALCULAR LOS ÁNGULOS ASTRONÓMICOS (18°/17°) CON CIENTÍFICA RIGUROSIDAD.
      </p>

      <div className="flex justify-center border-t border-gray-300 pt-8">
        {errorMsg ? (
          <div className="w-full font-mono text-rose-800 font-bold tracking-widest uppercase bg-rose-50 px-4 py-4 border-2 border-rose-800 text-center text-xs">
            [ ERROR: {errorMsg} ]
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-4 bg-gray-50 border-2 border-black px-6 py-4">
            <span className="block w-4 h-4 bg-emerald-800 animate-pulse"></span>
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-emerald-800">
              SOLICITANDO PERMISO ...
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LocationProvider;
