import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CategoriasProvider } from './context/CategoriasContext'
import './styles/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CategoriasProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CategoriasProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
