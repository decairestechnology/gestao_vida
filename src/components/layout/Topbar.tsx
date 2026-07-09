import { useState, type KeyboardEvent } from 'react'
import { Sparkles, Sun, Moon, LogOut, Loader2 } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { logout, getToken } = useAuth()
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function enviarCaptura(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !texto.trim()) return
    setEnviando(true)
    setFeedback(null)
    try {
      const token = await getToken()
      const resp = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ texto }),
      })
      if (!resp.ok) throw new Error()
      const { classificado } = await resp.json()
      setFeedback(`classificado como ${classificado.tipo}`)
      setTexto('')
    } catch {
      setFeedback('não consegui classificar, tenta de novo')
    } finally {
      setEnviando(false)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  return (
    <header className="flex items-center gap-3 px-7 py-4 border-b border-border bg-card">
      <div className="flex-1 flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 py-2.5">
        {enviando ? (
          <Loader2 size={16} className="text-primary flex-shrink-0 animate-spin" />
        ) : (
          <Sparkles size={16} className="text-primary flex-shrink-0" />
        )}
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={enviarCaptura}
          disabled={enviando}
          placeholder="Digite algo e aperte Enter: 'gastei 42 no mercado' ou 'lembrar dentista quinta'..."
          className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-muted-foreground"
        />
        <span className="text-[10.5px] font-bold text-secondary bg-[#F5F3FF] rounded px-2 py-1 flex-shrink-0">
          {feedback ?? 'IA classifica'}
        </span>
      </div>

      <button
        onClick={toggleTheme}
        title="Alternar tema"
        className="w-[34px] h-[34px] rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-primary transition-colors flex-shrink-0"
      >
        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <button
        onClick={logout}
        title="Sair"
        className="w-[34px] h-[34px] rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-destructive transition-colors flex-shrink-0"
      >
        <LogOut size={15} />
      </button>

      <div
        className="w-[34px] h-[34px] rounded-full flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)' }}
      />
    </header>
  )
}
