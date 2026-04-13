# Finance snapshots (Supabase)

Эта миграция нужна для страницы **«Финансы»** (`/finance`), чтобы сохранять данные в Supabase (а не только локально в браузере).

## SQL

Запустите в Supabase SQL Editor:

```sql
create table if not exists public.finance_snapshots (
  branch_id text not null,
  period text not null, -- формат: YYYY-MM
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (branch_id, period)
);

create index if not exists finance_snapshots_updated_at_idx
  on public.finance_snapshots (updated_at desc);
```

## Примечания

- Сохранение выполняется сервером с `service_role` ключом (см. `NUXT_SUPABASE_SERVICE_ROLE_KEY`), поэтому RLS не обязателен.
- Если таблицы нет, страница покажет предупреждение и продолжит хранить данные локально.

