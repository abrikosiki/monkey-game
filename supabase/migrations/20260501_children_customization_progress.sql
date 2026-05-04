-- =============================================================================
-- Таблица children — полная схема под Monkey Game (регистрация + конец игры)
-- Выполнить целиком в SQL Editor Supabase.
--
-- ВНИМАНИЕ: строка ниже удаляет старую таблицу и все строки в ней.
-- Если в проде уже есть данные — НЕ используйте DROP; вместо этого добавьте
-- колонки через ALTER (см. комментарий в конце файла).
-- =============================================================================

drop table if exists public.children cascade;

create table public.children (
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

comment on table public.children is 'Профиль ребёнка: кастомизация, инвентарь, прогресс';
comment on column public.children.code is 'Публичный код (как в приложении)';
comment on column public.children.gender is 'male | female | neutral';
comment on column public.children.level is 'Старт 0; +1 за каждое завершение приключения';
comment on column public.children.customization is 'JSON снимка экрана кастомизации';
comment on column public.children.shop_purchases is 'Покупки в магазине (последний финиш)';
comment on column public.children.chest_artifacts is 'Находки из сундука (последний финиш)';

-- Тестовая строка. Повторный запуск всего файла пересоздаёт таблицу;
-- если выполняете только INSERT — не будет дубля по code.
insert into public.children (
  code,
  name,
  age,
  gender,
  level,
  character_type,
  outfit,
  char_img,
  coins,
  inventory,
  customization,
  shop_purchases,
  chest_artifacts
)
values (
  'MONKEY-1234',
  'Тест',
  7,
  'female',
  0,
  'girl',
  'blue',
  null,
  150,
  '["sword", "crown"]'::jsonb,
  '{}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- Если таблицу удалять нельзя, а колонок не хватает, выполните по одной:
-- -----------------------------------------------------------------------------
-- alter table public.children add column if not exists gender text;
-- alter table public.children add column if not exists level integer not null default 0;
-- alter table public.children add column if not exists char_img text;
-- alter table public.children add column if not exists customization jsonb not null default '{}'::jsonb;
-- alter table public.children add column if not exists shop_purchases jsonb not null default '[]'::jsonb;
-- alter table public.children add column if not exists chest_artifacts jsonb not null default '[]'::jsonb;
