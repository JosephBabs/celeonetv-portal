import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Retire le loader de démarrage une fois l'application affichée (durée minimale pour laisser l'animation se lire).
const boot = document.getElementById('boot');
if (boot) {
  const started = performance.now();
  requestAnimationFrame(() => {
    const wait = Math.max(0, 900 - (performance.now() - started));
    window.setTimeout(() => {
      boot.classList.add('done');
      window.setTimeout(() => boot.remove(), 500);
    }, wait);
  });
}
