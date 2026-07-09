import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CategoriasProvider } from './context/CategoriasContext'
import { MarcaProvider } from './context/MarcaContext'
import { PrivacidadeProvider } from './context/PrivacidadeContext'
import './styles/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CategoriasProvider>
          <MarcaProvider>
            <PrivacidadeProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </PrivacidadeProvider>
          </MarcaProvider>
        </CategoriasProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
