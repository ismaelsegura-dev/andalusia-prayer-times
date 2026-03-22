import React, { useState } from 'react';
import { useStore } from '../store';
import { HIJRI_MONTHS } from '../lib/lunar-calendar';
import { format, addDays } from 'date-fns';

const AdminPanel: React.FC = () => {
  const { isAdmin, setIsAdmin, validatedMonths, setValidatedMonth } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'emir123') {
      setIsAdmin(true);
      setError('');
    } else {
      setError('CREDENCIALES INVÁLIDAS');
    }
  };

  if (!isAdmin) {
    return (
      <div className="border-4 border-black p-8 md:p-12 bg-white max-w-lg mx-auto shadow-[12px_12px_0_0_#000]">
        <header className="mb-8 border-b-4 border-black pb-4">
          <h2 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            GOBERNANZA<br/>LOCAL
          </h2>
          <span className="font-mono text-xs font-bold px-2 py-1 bg-black text-white mt-4 inline-block tracking-widest uppercase">
            ACCESO RESTRINGIDO
          </span>
        </header>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
              CLAVE DE AUTORIDAD
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="border-4 border-black p-4 font-mono text-lg outline-none focus:bg-gray-50 focus:shadow-[4px_4px_0_0_#000] transition-all"
            />
          </div>
          <button type="submit" className="bg-black text-white font-mono font-bold text-sm uppercase tracking-widest p-4 border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0_0_#000] hover:shadow-none translate-y-0 active:translate-x-[4px] active:translate-y-[4px]">
            [ AUTENTICAR ]
          </button>
        </form>
        {error && (
          <div className="mt-8 p-4 border-2 border-rose-800 bg-rose-50 text-center">
            <p className="font-mono text-rose-800 font-bold text-xs uppercase tracking-widest animate-pulse">
              [ ERROR: {error} ]
            </p>
          </div>
        )}
      </div>
    );
  }

  let latestKey = '';
  let latestStart = '';
  for (const [k, v] of Object.entries(validatedMonths)) {
    if (!latestKey || new Date(v as string) > new Date(latestStart)) {
      latestKey = k;
      latestStart = v as string;
    }
  }

  const handleValidate = (days: 29 | 30) => {
    if (!latestKey) {
      setValidatedMonth('1445-09', format(new Date(), 'yyyy-MM-dd'));
      alert('SISTEMA INICIALIZADO EN RAMADÁN 1445.');
      return;
    }

    const [yStr, mStr] = latestKey.split('-');
    let y = parseInt(yStr);
    let m = parseInt(mStr);
    
    let nextM = m + 1;
    let nextY = y;
    if (nextM > 12) {
      nextM = 1;
      nextY = y + 1;
    }

    const nextKey = `${nextY}-${nextM.toString().padStart(2, '0')}`;
    const nextStartGregorian = format(addDays(new Date(latestStart), days), 'yyyy-MM-dd');

    setValidatedMonth(nextKey, nextStartGregorian);
    alert(`LUNA VALIDADA: ${days} DÍAS.\nEL MES ${HIJRI_MONTHS[nextM-1]} COMENZARÁ EL ${nextStartGregorian}.`);
  };

  return (
    <div className="border-4 border-black bg-white shadow-[12px_12px_0_0_#000]">
      {/* Header */}
      <div className="bg-black text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">
            PANEL DEL<br/>EMIR
          </h2>
          <span className="font-mono text-xs font-bold px-3 py-1 bg-white text-black uppercase tracking-widest">
            TERMINAL ACTIVA
          </span>
        </div>
        <button 
          onClick={() => setIsAdmin(false)}
          className="font-mono text-xs font-bold border-2 border-white px-4 py-2 hover:bg-white hover:text-black transition-colors uppercase tracking-widest"
        >
          [ DESCONECTAR ]
        </button>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* State Info */}
        <div className="border-2 border-black p-6 bg-gray-50 flex flex-col justify-center shadow-inner">
          {latestKey ? (
            <>
              <p className="font-mono text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                MES ACTUAL EN CURSO
              </p>
              <h3 className="font-serif text-3xl font-black uppercase text-black mb-1">
                {HIJRI_MONTHS[parseInt(latestKey.split('-')[1])-1]} {latestKey.split('-')[0]}
              </h3>
              <p className="font-mono text-xs uppercase tracking-widest border-t border-gray-200 mt-4 pt-4">
                INICIADO EL {format(new Date(latestStart), 'dd/MM/yyyy')}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <span className="block w-3 h-3 bg-black"></span>
              <p className="font-mono text-xs font-bold uppercase tracking-widest">NO HAY MESES REGISTRADOS EN BD LOCAL</p>
            </div>
          )}
        </div>

        {/* Validation Action */}
        <div className="border-4 border-black flex flex-col shadow-[4px_4px_0_0_#000]">
          <div className="p-4 border-b-4 border-black bg-white flex-shrink-0">
            <h4 className="font-serif text-2xl font-black uppercase tracking-tighter mb-2">VALIDAR AVISTAMIENTO</h4>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 leading-relaxed">
              FIJE LA DURACIÓN DEL MES EN CURSO DECLARANDO SI LA LUNA FUE AVISTADA HOY.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-1">
            <button 
              onClick={() => latestKey ? handleValidate(29) : handleValidate(30)}
              className="flex-1 p-6 font-mono font-bold text-sm uppercase tracking-widest border-b-2 sm:border-b-0 sm:border-r-2 border-black hover:bg-black hover:text-white transition-colors flex flex-col items-center justify-center gap-2"
            >
              <span className="text-4xl font-serif">29</span>
              <span className="text-[10px]">{latestKey ? 'Tuvo 29 días' : 'INICIALIZAR'}</span>
            </button>
            {latestKey && (
              <button 
                onClick={() => handleValidate(30)}
                className="flex-1 p-6 font-mono font-bold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex flex-col items-center justify-center gap-2"
              >
                <span className="text-4xl font-serif">30</span>
                <span className="text-[10px]">Tuvo 30 días</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
