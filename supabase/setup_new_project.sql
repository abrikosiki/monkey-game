-- Настройка НОВОГО проекта Supabase для Monkey Game.
-- Выполнить целиком в SQL Editor (Run). Безопасно запускать повторно — ничего не удаляет.

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text,
  age integer,
  gender text,
  level integer not null default 0,
  character_type text not null default 'boy',
  outfit text not null default 'brown',
  char_img text,
  coins integer not null default 0,
  inventory jsonb not null default '[]'::jsonb,
  customization jsonb not null default '{}'::jsonb,
  shop_purchases jsonb not null default '[]'::jsonb,
  chest_artifacts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists children_code_idx on public.children (code);

-- Сервер работает через service key (он обходит RLS), а с публичным anon-ключом
-- таблицу снаружи нельзя прочитать или изменить.
alter table public.children enable row level security;

-- Публичное хранилище картинок для генератора уроков.
insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do nothing;

-- В новых проектах Supabase у ролей API нет прав на новые таблицы по умолчанию.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.children to service_role;
