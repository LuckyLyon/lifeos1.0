import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ✅ 1. 引入电源插座
import { EnergyProvider } from './contexts/EnergyContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ 2. 用电源包裹住整个 App */}
    <EnergyProvider>
      <App />
    </EnergyProvider>
  </React.StrictMode>,
)