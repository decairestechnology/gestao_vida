import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { apiGet, apiPost } from '../lib/api'

export interface Marca {
  nome: string
  subtitulo: string
  logoUrl: string | null
  logoTamanho: number
}

const MARCA_PADRAO: Marca = { nome: 'DeCaires', subtitulo: 'Gestão Pessoal', logoUrl: null, logoTamanho: 72 }

interface MarcaContextValue {
  marca: Marca
  carregando: boolean
  atualizar: (nova: Marca) => Promise<void>
}

const MarcaContext = createContext<MarcaContextValue | undefined>(undefined)

export function MarcaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [marca, setMarca] = useState<Marca>(MARCA_PADRAO)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!user) return
    apiGet<{ marca: Marca }>('/api/config')
      .then((res) => setMarca(res.marca))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [user])

  async function atualizar(nova: Marca) {
    setMarca(nova)
    await apiPost('/api/config', { recurso: 'marca', ...nova })
  }

  return <MarcaContext.Provider value={{ marca, carregando, atualizar }}>{children}</MarcaContext.Provider>
}

export function useMarca() {
  const ctx = useContext(MarcaContext)
  if (!ctx) throw new Error('useMarca precisa estar dentro de MarcaProvider')
  return ctx
}
