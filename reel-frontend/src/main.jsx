import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminPanel from './AdminPanel.jsx'
import PartnerPanel from './PartnerPanel.jsx'

const path = window.location.pathname

let RouteComponent = App
if (path.startsWith('/admin')) {
  RouteComponent = AdminPanel
} else if (path.startsWith('/partner')) {
  RouteComponent = PartnerPanel
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouteComponent />
  </StrictMode>,
)