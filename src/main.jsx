import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ✅ 关键：引入 Provider
import { EnergyProvider } from './contexts/EnergyContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ 关键：像三明治一样包裹住 App */}
    <EnergyProvider>
      <App />
    </EnergyProvider>
  </React.StrictMode>,
)