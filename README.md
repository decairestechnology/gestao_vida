# Vida — DeCaires Ecosystem

Sistema pessoal de controle (financeiro, investimentos, tarefas, hábitos, notas, metas, relatórios), seguindo o guia de marca e a stack padrão da DeCaires: React + Vite + TypeScript + Tailwind, Neon (Postgres), Firebase Auth, API da Claude pra captura por texto.  

## 1. Criar os serviços (uma vez só)

**Neon** — [neon.tech](https://neon.tech) → criar projeto → copiar a *Connection string (pooled)* → depois rodar o schema:
```bash
psql "SUA_CONNECTION_STRING" -f db/schema.sql
```
(ou colar o conteúdo de `db/schema.sql` direto no SQL editor do console Neon)

**Firebase** — [console.firebase.google.com](https://console.firebase.google.com) → criar projeto → Authentication → ativar métodos "E-mail/senha" e "Google" → Project Settings → pegar as chaves do client SDK (`apiKey`, `authDomain`, `projectId`, `appId`) → Service accounts → Generate new private key (baixa um JSON, isso é secreto)

**Anthropic** — [console.anthropic.com](https://console.anthropic.com) → API Keys → criar uma chave

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```
Preenche `.env.local` com as chaves dos 3 serviços acima (detalhes de onde pegar cada uma estão nos comentários do próprio arquivo).

## 3. Rodar localmente

```bash
npm install
npm run dev
```
Abre em `http://localhost:5173`. As funções em `/api` (capture, transações) só funcionam de verdade rodando via `vercel dev` (ver abaixo) ou já em produção — o `npm run dev` sozinho só sobe o front-end.

Pra testar as funções `/api` localmente:
```bash
npm i -g vercel
vercel dev
```

## 4. Deploy (Vercel)

O guia da DeCaires usa Vercel como hospedagem padrão do ecossistema.

```bash
npm i -g vercel
vercel login
vercel
```
Segue o passo a passo do CLI (ele detecta Vite automaticamente). Depois, no painel da Vercel do projeto:

**Settings → Environment Variables** → adiciona as mesmas variáveis do `.env.local`:
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (o JSON inteiro do service account, em uma linha só)
- `DATABASE_URL` (connection string do Neon)
- `ANTHROPIC_API_KEY`

Depois de configurar, `vercel --prod` publica em produção.

**Importante no Firebase:** depois do primeiro deploy, volta no console do Firebase → Authentication → Settings → Authorized domains → adiciona o domínio que a Vercel te deu (ex: `vida-app.vercel.app`), senão o login trava por CORS/domínio não autorizado.

## O que já está pronto

- 8 módulos navegáveis, tema claro/escuro persistido
- Login com e-mail/senha e Google (Firebase Auth), rotas protegidas
- Schema completo do banco em `db/schema.sql`
- Endpoint `/api/capture` — recebe texto livre, classifica com a API da Claude (transação/tarefa/nota) e já grava no Neon
- Endpoint `/api/transacoes` como modelo de CRUD (GET lista, POST cria) — os outros módulos ainda usam dados mockados em `src/data/mockData.ts` e precisam do mesmo tratamento

## O que falta pra ficar 100% real

1. **Replicar o CRUD** de `api/transacoes.ts` pra tarefas, hábitos, notas, metas e investimentos (mesmo padrão: GET lista, POST cria — depois adicionar PATCH/DELETE)
2. **Trocar os dados mockados** das páginas (`src/data/mockData.ts`) por chamadas reais a esses endpoints (`fetch` com o token do Firebase, igual já faz o Topbar em `enviarCaptura`)
3. **Formulários de criação/edição** — os botões "+ Novo X" ainda não abrem modal nenhum (o guia de marca já define o padrão de modal reaproveitável na seção 5, é só implementar)
4. **Confirmação de exclusão inline** — quando entrar exclusão, seguir o padrão do guia (nunca `window.confirm`, sempre barra inline vermelha)
5. **Recorrências automáticas** — hoje o campo existe no banco (`recorrente`, `recorrencia_regra`) mas nada gera a próxima ocorrência sozinho; precisa de um cron (Vercel Cron Jobs resolve isso)

## Estrutura

```
api/            funções serverless (Vercel) — capture.ts (IA), transacoes.ts (CRUD modelo), _db.ts, _auth.ts
db/             schema.sql — schema completo do Neon
src/
  components/
    layout/     Sidebar, Topbar, Layout, PageHeader
    ui/         Card, Badge, Button, ProgressBar
    ProtectedRoute.tsx
  context/      ThemeContext, AuthContext
  data/         mockData.ts (dados de exemplo — ainda usado nas telas além de Financeiro/captura)
  lib/          firebase.ts (init do client SDK)
  pages/        as 8 telas do sistema + Login
  styles/       theme.css (tokens de cor do guia de marca)
```
