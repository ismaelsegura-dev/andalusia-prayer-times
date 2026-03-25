import { useState } from 'react';
import { StoreProvider } from './store';
import FalakQayranSelector from './components/FalakQayranSelector';
import Dashboard from './components/Dashboard';
import MonthlyTable from './components/MonthlyTable';
import AdminPanel from './components/AdminPanel';

const AppContent = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans uppercase flex flex-col">
      {/* Brutalist Header */}
      <header className="p-6 md:p-8 flex justify-between items-start md:items-end border-b-4 border-black shrink-0 relative overflow-hidden bg-white z-10">
        <div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black leading-none tracking-tighter">
            PRECISIÓN<br />ANDALUZA
          </h1>
          <p className="mt-2 font-mono text-xs md:text-sm font-bold tracking-widest text-gray-500">
            MOTOR CÁLCULO SOBERANO // [MALIKI]
          </p>
        </div>
        <div className="flex flex-col items-end gap-4 z-10 relative">
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="font-mono text-xs font-bold uppercase tracking-widest bg-black text-white px-4 py-2 border-2 border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0_0_#000] focus:outline-none transition-all"
          >
            {showAdmin ? '[ VOLVER AL INICIO ]' : '[ PANEL EMIR ]'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full relative p-4 md:p-8">
        {showAdmin ? (
          <div className="max-w-6xl mx-auto">
            <AdminPanel />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <FalakQayranSelector />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-12">
                <Dashboard />
              </div>
              <div className="lg:col-span-12">
                <MonthlyTable />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 border-t-4 border-black bg-black text-white shrink-0 mt-8">
        <p className="font-mono text-xs text-center uppercase tracking-widest font-bold">
          {new Date().getFullYear()} // DIRECTORIO RELIGIOSO INDEPENDIENTE
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
