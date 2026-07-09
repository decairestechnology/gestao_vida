import { auth } from './firebase'

async function authHeaders() {
  const token = await auth.currentUser?.getIdToken()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function parseErrorOrThrow(res: Response, path: string) {
  if (res.ok) return
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error ?? JSON.stringify(body)
  } catch {
    detail = await res.text().catch(() => '')
  }
  throw new Error(`${path} (${res.status}): ${detail || 'erro desconhecido'}`)
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: await authHeaders() })
  await parseErrorOrThrow(res, `GET ${path}`)
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body) })
  await parseErrorOrThrow(res, `POST ${path}`)
  return res.json()
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'PATCH', headers: await authHeaders(), body: JSON.stringify(body) })
  await parseErrorOrThrow(res, `PATCH ${path}`)
  return res.json()
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'PUT', headers: await authHeaders(), body: JSON.stringify(body) })
  await parseErrorOrThrow(res, `PUT ${path}`)
  return res.json()
}

export async function apiDelete(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, { method: 'DELETE', headers: await authHeaders(), body: JSON.stringify(body) })
  await parseErrorOrThrow(res, `DELETE ${path}`)
}
