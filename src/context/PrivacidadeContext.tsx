import { createContext, useContext, useState, type ReactNode } from 'react'

interface PrivacidadeContextValue {
  valoresOcultos: boolean
  alternar: () => void
}

const PrivacidadeContext = createContext<PrivacidadeContextValue | undefined>(undefined)

export function PrivacidadeProvider({ children }: { children: ReactNode }) {
  const [valoresOcultos, setValoresOcultos] = useState(() => localStorage.getItem('vida-valores-ocultos') === '1')

  function alternar() {
    setValoresOcultos((v) => {
      const novo = !v
      localStorage.setItem('vida-valores-ocultos', novo ? '1' : '0')
      return novo
    })
  }

  return <PrivacidadeContext.Provider value={{ valoresOcultos, alternar }}>{children}</PrivacidadeContext.Provider>
}

export function usePrivacidade() {
  const ctx = useContext(PrivacidadeContext)
  if (!ctx) throw new Error('usePrivacidade precisa estar dentro de PrivacidadeProvider')
  return ctx
}
