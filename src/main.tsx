import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { syncMonthsFromServer } from './lib/api';

syncMonthsFromServer();

// Re-sincroniza al volver a la app: los decretos del emir llegan
// aunque el usuario tenga la PWA abierta desde antes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') syncMonthsFromServer();
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
