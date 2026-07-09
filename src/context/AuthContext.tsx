import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  loginEmail: (email: string, senha: string) => Promise<void>
  cadastrarEmail: (email: string, senha: string) => Promise<void>
  loginGoogle: () => Promise<void>
  logout: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    loginEmail: async (email, senha) => {
      await signInWithEmailAndPassword(auth, email, senha)
    },
    cadastrarEmail: async (email, senha) => {
      await createUserWithEmailAndPassword(auth, email, senha)
    },
    loginGoogle: async () => {
      await signInWithPopup(auth, googleProvider)
    },
    logout: async () => {
      await signOut(auth)
    },
    getToken: async () => {
      if (!auth.currentUser) return null
      return auth.currentUser.getIdToken()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
