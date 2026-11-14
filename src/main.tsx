import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with automatic updates and offline readiness logging
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[ServiceWorker] New content available, updating cache.');
  },
  onOfflineReady() {
    console.log('[ServiceWorker] Spana is ready to browse offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
