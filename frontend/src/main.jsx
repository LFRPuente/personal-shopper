import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const isFirefox =
  typeof navigator !== 'undefined' &&
  /firefox/i.test(navigator.userAgent || '');

if (typeof document !== 'undefined' && isFirefox) {
  const rootElement = document.documentElement;
  rootElement.classList.add('browser-firefox', 'ff-loading');
  window.setTimeout(() => {
    rootElement.classList.remove('ff-loading');
  }, 3000);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
