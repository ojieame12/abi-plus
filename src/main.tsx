import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RiskComponentsShowcase from './views/RiskComponentsShowcase.tsx'
import WidgetCatalog from './views/WidgetCatalog.tsx'

// Simple routing for dev - supports both hash and path
const getPage = () => {
  const hash = window.location.hash.slice(1)
  const path = window.location.pathname

  if (hash === 'risk-showcase' || path === '/risk-showcase' || hash === 'showcase' || path === '/showcase') {
    return <RiskComponentsShowcase />
  }
  if (hash === 'catalog' || path === '/catalog') {
    return <WidgetCatalog />
  }
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {getPage()}
  </StrictMode>,
)
