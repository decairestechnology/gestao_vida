import { useState, type FormEvent } from 'react'
import { Sun, Moon, Trash2, Plus } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useTheme } from '../context/ThemeContext'
import { useCategorias } from '../context/CategoriasContext'

export function Configuracoes() {
  const { theme, toggleTheme } = useTheme()
  const { categoriasDespesa, categoriasReceita, personalizadas, carregando, adicionar, remover } = useCategorias()

  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await adicionar(nome.trim(), tipo)
      setNome('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar essa categoria.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Sistema" title="Configurações" subtitle="Preferências e categorias do seu jeito." />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle>Aparência</CardTitle>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Tema {theme === 'dark' ? 'escuro' : 'claro'}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Fica salvo na sua conta, acompanha em qualquer dispositivo.</div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-primary transition-colors flex-shrink-0"
            >
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </Card>

        <Card>
          <CardTitle>Nova categoria</CardTitle>
          <form onSubmit={onSubmit} className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <button type="button" onClick={() => setTipo('despesa')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${tipo === 'despesa' ? 'bg-[#FEF2F2] border-destructive text-destructive' : 'border-border text-muted-foreground'}`}>
                Despesa
              </button>
              <button type="button" onClick={() => setTipo('receita')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${tipo === 'receita' ? 'bg-[#ECFDF5] border-[#10B981] text-[#10B981]' : 'border-border text-muted-foreground'}`}>
                Receita
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da categoria (ex: Pet)"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button type="submit" disabled={salvando} className="flex items-center gap-1 px-3">
                <Plus size={14} /> {salvando ? '...' : 'Criar'}
              </Button>
            </div>
            {erro && <div className="text-xs text-destructive font-semibold">{erro}</div>}
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <Card>
          <CardTitle>Categorias de despesa</CardTitle>
          {carregando && <div className="text-sm text-muted-foreground py-2">Carregando...</div>}
          {categoriasDespesa.map((nomeCat) => {
            const custom = personalizadas.find((p) => p.nome === nomeCat && p.tipo === 'despesa')
            return (
              <div key={nomeCat} className="flex items-center justify-between py-1.5 border-b border-border last:border-none">
                <span className="text-[13px]">{nomeCat}</span>
                {custom ? (
                  <button onClick={() => remover(custom.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">padrão</span>
                )}
              </div>
            )
          })}
        </Card>

        <Card>
          <CardTitle>Categorias de receita</CardTitle>
          {carregando && <div className="text-sm text-muted-foreground py-2">Carregando...</div>}
          {categoriasReceita.map((nomeCat) => {
            const custom = personalizadas.find((p) => p.nome === nomeCat && p.tipo === 'receita')
            return (
              <div key={nomeCat} className="flex items-center justify-between py-1.5 border-b border-border last:border-none">
                <span className="text-[13px]">{nomeCat}</span>
                {custom ? (
                  <button onClick={() => remover(custom.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">padrão</span>
                )}
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
