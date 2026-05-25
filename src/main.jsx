import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/shadcn.css'
import './styles/app-buttons.css'
import './styles/ui-spacing.css'
import './index.css'
import App from './App.jsx'
import { fetchAppConfig } from '@/lib/api/appConfig.js'
import { applyRuntimeConfig } from '@/lib/api/config.js'

void fetchAppConfig().then(applyRuntimeConfig)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
