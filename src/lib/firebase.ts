import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Todas as chaves aqui são públicas por natureza (config do client SDK do Firebase,
// não são segredo — a segurança real vem das regras de acesso, não de esconder isso).
// Preenche via variáveis VITE_FIREBASE_* no .env (ver .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
