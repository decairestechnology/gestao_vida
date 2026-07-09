import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export function Login() {
  const { loginEmail, cadastrarEmail, loginGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    try {
      if (modo === 'entrar') await loginEmail(email, senha)
      else await cadastrarEmail(email, senha)
      navigate('/')
    } catch (err) {
      setErro('Não foi possível entrar. Confere e-mail e senha.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-7 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-[10px] object-contain" />
          <div>
            <div className="font-bold text-sm">Vida</div>
            <div className="text-[10.5px] text-muted-foreground font-semibold">DeCaires Ecosystem</div>
          </div>
        </div>

        <h1 className="text-lg font-bold mb-1">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="text-sm text-muted-foreground mb-5">Acesso pessoal ao seu sistema de controle.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            placeholder="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {erro && <div className="text-xs text-destructive font-semibold">{erro}</div>}
          <Button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <button
          onClick={loginGoogle}
          className="w-full mt-3 border border-border rounded-lg py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
        >
          Entrar com Google
        </button>

        <button
          onClick={() => setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')}
          className="w-full mt-4 text-xs text-muted-foreground font-semibold"
        >
          {modo === 'entrar' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
