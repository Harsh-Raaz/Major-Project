import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RootApp from './RootApp.jsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  </StrictMode>,
)
