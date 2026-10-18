import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import './index.css'
import { App } from './ui/App'

// Tesseract-Dateien älterer Versionen aus dem Zwischenspeicher entfernen (ca. 17 MB).
if ('caches' in window) {
  void caches
    .keys()
    .then((keys) => keys.filter((k) => k.startsWith('tesseract') && k !== __TESSERACT_CACHE__).forEach((k) => caches.delete(k)))
    .catch(() => {})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
