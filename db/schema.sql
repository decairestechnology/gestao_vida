-- Schema do sistema "Vida" — Neon Postgres
-- Rodar isso no SQL editor do console Neon (ou via `psql $DATABASE_URL -f db/schema.sql`)
-- user_id sempre referencia o uid do Firebase Auth (texto, não FK — auth é externo ao banco)

create table if not exists contas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  nome text not null,
  tipo text not null check (tipo in ('corrente', 'cartao', 'dinheiro', 'poupanca')),
  saldo numeric(12,2) not null default 0,
  limite numeric(12,2),
  fechamento_dia int,
  created_at timestamptz not null default now()
);

create table if not exists transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  conta_id uuid references contas(id) on delete set null,
  titulo text not null,
  categoria text not null,
  descricao text,
  valor numeric(12,2) not null, -- negativo = despesa, positivo = receita
  data date not null default current_date,
  recorrente boolean not null default false,
  recorrencia_regra text, -- ex: 'monthly:5' (todo dia 5)
  recorrencia_intervalo_dias int not null default 30,
  proxima_gerada boolean not null default false,
  origem text not null default 'manual' check (origem in ('manual', 'ia', 'recorrencia')),
  created_at timestamptz not null default now()
);

-- Se a tabela já existia antes dessas colunas, roda essas linhas também (seguras, "if not exists"):
alter table transacoes add column if not exists descricao text;
alter table transacoes add column if not exists recorrencia_intervalo_dias int not null default 30;
alter table transacoes add column if not exists proxima_gerada boolean not null default false;
alter table transacoes drop constraint if exists transacoes_origem_check;
alter table transacoes add constraint transacoes_origem_check check (origem in ('manual', 'ia', 'recorrencia'));

create table if not exists orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  categoria text not null,
  limite numeric(12,2) not null,
  mes_referencia date not null, -- primeiro dia do mês
  unique (user_id, categoria, mes_referencia)
);

create table if not exists tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  titulo text not null,
  status text not null default 'pendente' check (status in ('pendente', 'concluida')),
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  tag text,
  vencimento date,
  recorrente boolean not null default false,
  recorrencia_regra text,
  recorrencia_intervalo_dias int not null default 30,
  proxima_gerada boolean not null default false,
  parent_id uuid references tarefas(id) on delete cascade, -- subtarefas
  created_at timestamptz not null default now()
);

-- Se a tabela já existia antes dessas colunas:
alter table tarefas add column if not exists recorrencia_intervalo_dias int not null default 30;
alter table tarefas add column if not exists proxima_gerada boolean not null default false;

create table if not exists habitos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  nome text not null,
  frequencia text not null default 'diario', -- 'diario' ou ex: '4x_semana'
  tag text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists habito_checks (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references habitos(id) on delete cascade,
  data date not null default current_date,
  unique (habito_id, data)
);

create table if not exists notas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  titulo text not null,
  corpo text not null,
  tag text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  nome text not null,
  valor_atual numeric(12,2) not null default 0,
  valor_alvo numeric(12,2) not null,
  prazo date,
  ativo_vinculado_id uuid, -- referencia solta pra investimentos_ativos, ver abaixo
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists investimentos_ativos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  nome text not null,
  classe text not null check (classe in ('renda_fixa', 'acoes_fiis', 'fundos', 'reserva_cripto')),
  valor_atual numeric(12,2) not null default 0,
  rentabilidade_12m numeric(6,2),
  meta_id uuid references metas(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists investimentos_aportes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  ativo_id uuid references investimentos_ativos(id) on delete cascade,
  valor numeric(12,2) not null,
  data date not null default current_date
);

-- índices básicos por usuário, já que toda query filtra por user_id
create index if not exists idx_transacoes_user on transacoes(user_id, data desc);
create index if not exists idx_tarefas_user on tarefas(user_id, status);
create index if not exists idx_habitos_user on habitos(user_id);
create index if not exists idx_notas_user on notas(user_id);
create index if not exists idx_metas_user on metas(user_id);
create index if not exists idx_ativos_user on investimentos_ativos(user_id);
