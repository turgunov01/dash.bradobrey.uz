# Finance snapshots (PostgreSQL)

Эта миграция нужна для страницы **«Финансы»** (`/finance`), чтобы backend API
сохранял данные в обычный PostgreSQL, а не только локально в браузере.

## SQL

Запустите в PostgreSQL миграциях backend:

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

- Сохранение выполняется backend API по маршруту `/api/finance`.
- Если backend вернет ошибку отсутствующей таблицы, страница покажет
  предупреждение и продолжит хранить данные локально.
