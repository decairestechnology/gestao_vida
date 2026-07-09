import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { apiGet, apiPost, apiDelete } from '../lib/api'
import { CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from '../data/categorias'

export interface CategoriaPersonalizada {
  id: string
  nome: string
  tipo: 'despesa' | 'receita'
}

interface CategoriasContextValue {
  categoriasDespesa: string[]
  categoriasReceita: string[]
  personalizadas: CategoriaPersonalizada[]
  carregando: boolean
  adicionar: (nome: string, tipo: 'despesa' | 'receita') => Promise<void>
  remover: (id: string) => Promise<void>
}

const CategoriasContext = createContext<CategoriasContextValue | undefined>(undefined)

export function CategoriasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [personalizadas, setPersonalizadas] = useState<CategoriaPersonalizada[]>([])
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    if (!user) return
    setCarregando(true)
    try {
      const res = await apiGet<{ categorias: CategoriaPersonalizada[] }>('/api/config')
      setPersonalizadas(res.categorias)
    } catch {
      setPersonalizadas([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function adicionar(nome: string, tipo: 'despesa' | 'receita') {
    await apiPost('/api/config', { recurso: 'categoria', nome, tipo })
    await carregar()
  }

  async function remover(id: string) {
    await apiDelete('/api/config', { id })
    await carregar()
  }

  const categoriasDespesa = [
    ...CATEGORIAS_DESPESA,
    ...personalizadas.filter((c) => c.tipo === 'despesa').map((c) => c.nome),
  ]
  const categoriasReceita = [
    ...CATEGORIAS_RECEITA,
    ...personalizadas.filter((c) => c.tipo === 'receita').map((c) => c.nome),
  ]

  return (
    <CategoriasContext.Provider value={{ categoriasDespesa, categoriasReceita, personalizadas, carregando, adicionar, remover }}>
      {children}
    </CategoriasContext.Provider>
  )
}

export function useCategorias() {
  const ctx = useContext(CategoriasContext)
  if (!ctx) throw new Error('useCategorias precisa estar dentro de CategoriasProvider')
  return ctx
}
