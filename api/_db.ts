import { neon } from '@neondatabase/serverless'

// DATABASE_URL vem do painel do Neon: Connection Details → Connection string (pooled)
// Configura essa env var na Vercel (Project Settings → Environment Variables)
export const sql = neon(process.env.DATABASE_URL!)
