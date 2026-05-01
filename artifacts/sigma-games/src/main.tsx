import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GameProvider } from './context/GameContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';

window.addEventListener('unhandledrejection', (e) => {
  if (!(e.reason instanceof Error)) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </LanguageProvider>
  </StrictMode>,
);
