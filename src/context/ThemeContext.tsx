import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { apiGet, apiPost } from '../lib/api'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('vida-theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('vida-theme', theme)
  }, [theme])

  // Assim que logar, busca a preferência salva no banco — assim o tema
  // acompanha o usuário entre dispositivos, não só o navegador local.
  useEffect(() => {
    if (!user) return
    apiGet<{ tema: Theme | null }>('/api/config')
      .then((res) => {
        if (res.tema && res.tema !== theme) setTheme(res.tema)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function toggleTheme() {
    setTheme((t) => {
      const novo = t === 'light' ? 'dark' : 'light'
      if (user) apiPost('/api/config', { recurso: 'tema', tema: novo }).catch(() => {})
      return novo
    })
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme precisa estar dentro de ThemeProvider')
  return ctx
}
