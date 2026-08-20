import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.tsx'

import { registerSW } from 'virtual:pwa-register'

// Register the PWA service worker with immediate update checks and periodic checks
registerSW({
  immediate: true,
  onRegistered(r) {
    r && setInterval(() => {
      r.update()
    }, 60 * 60 * 1000) // check for updates every hour
  }
})

// Automatically reload the page when a new version of the PWA is installed and takes control
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
