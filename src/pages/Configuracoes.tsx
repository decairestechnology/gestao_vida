import { useEffect, useState, type FormEvent } from 'react'
import { Sun, Moon, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useTheme } from '../context/ThemeContext'
import { useCategorias } from '../context/CategoriasContext'
import { useMarca } from '../context/MarcaContext'
import { usePrivacidade } from '../context/PrivacidadeContext'

export function Configuracoes() {
  const { theme, toggleTheme } = useTheme()
  const { categoriasDespesa, categoriasReceita, personalizadas, carregando, adicionar, remover } = useCategorias()
  const { marca, atualizar: atualizarMarca } = useMarca()
  const { valoresOcultos, alternar: alternarPrivacidade } = usePrivacidade()

  const [formMarca, setFormMarca] = useState(marca)
  const [salvandoMarca, setSalvandoMarca] = useState(false)

  useEffect(() => setFormMarca(marca), [marca])

  async function salvarMarca(e: FormEvent) {
    e.preventDefault()
    setSalvandoMarca(true)
    try {
      await atualizarMarca(formMarca)
    } finally {
      setSalvandoMarca(false)
    }
  }

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
          <CardTitle>Privacidade</CardTitle>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Valores {valoresOcultos ? 'ocultos' : 'visíveis'}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Esconde os números de dinheiro na tela — útil se alguém estiver por perto.</div>
            </div>
            <button
              onClick={alternarPrivacidade}
              className="w-10 h-10 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-primary transition-colors flex-shrink-0"
            >
              {valoresOcultos ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle>Marca do sistema</CardTitle>
        <form onSubmit={salvarMarca} className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Nome</label>
            <input
              value={formMarca.nome}
              onChange={(e) => setFormMarca({ ...formMarca, nome: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Subtítulo</label>
            <input
              value={formMarca.subtitulo}
              onChange={(e) => setFormMarca({ ...formMarca, subtitulo: e.target.value })}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2">
            <Button type="submit" disabled={salvandoMarca}>{salvandoMarca ? 'Salvando...' : 'Salvar marca'}</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-4">
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
