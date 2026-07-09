import { auth } from './firebase'

async function authHeaders() {
  const token = await auth.currentUser?.getIdToken()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: await authHeaders() })
  if (!res.ok) throw new Error(`GET ${path} falhou`)
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`POST ${path} falhou`)
  return res.json()
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`PATCH ${path} falhou`)
  return res.json()
}

export async function apiDelete(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, { method: 'DELETE', headers: await authHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`DELETE ${path} falhou`)
}
