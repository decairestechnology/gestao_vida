import type { VercelRequest } from '@vercel/node'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Credenciais de Service Account do Firebase (Project Settings → Service accounts → Generate new private key)
// Configura FIREBASE_SERVICE_ACCOUNT como env var na Vercel com o JSON inteiro em uma linha
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  })
}

/**
 * Extrai e valida o Firebase ID token do header Authorization.
 * Lança erro se não houver token válido — quem chamar deve responder 401.
 */
export async function requireUser(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('missing_token')
  }
  const token = authHeader.slice('Bearer '.length)
  const decoded = await getAuth().verifyIdToken(token)
  return decoded.uid
}
