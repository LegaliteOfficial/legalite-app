-- Clio-aligned case schema (2026-05-23)
-- =====================================
-- Background: the cases table originated with a "matter_type" column and a
-- status enum of (Active, Pending, Closed). We're aligning terminology with
-- Clio (the closest competitor product), where every "matter" is a "case"
-- and an unfinished case is "Open", not "Active". This migration:
--   1. Renames matter_type -> case_type
--   2. Migrates status 'Active' -> 'Open' and updates the enum check
--   3. Adds workflow / origination / lifecycle columns the new cases list
--      view depends on (case_stage, originating_lawyer, closed_at,
--      pending_at, notification_count)
--
-- Backend + codegen need to follow up: the GraphQL Case type / CreateCaseInput
-- still use `matter_type`; hooks/use-cases.ts translates between the two
-- until the backend ships its matching rename.

begin;

-- 1) Rename matter_type -> case_type (only if the old column still exists).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'cases' and column_name = 'matter_type'
  ) then
    alter table public.cases rename column matter_type to case_type;
  end if;
end $$;

-- 2) Add the new workflow / lifecycle columns.
alter table public.cases
  add column if not exists case_stage         text,
  add column if not exists originating_lawyer text,
  add column if not exists closed_at          timestamptz,
  add column if not exists pending_at         timestamptz,
  add column if not exists notification_count integer not null default 0;

-- 3) Migrate existing status values: Active -> Open. Then replace the check
--    constraint to enforce the new enum. We don't use a Postgres enum type
--    here because case status values may grow (Archived, On hold) — a check
--    constraint is cheaper to evolve.
update public.cases set status = 'Open' where status = 'Active';

alter table public.cases
  drop constraint if exists cases_status_check;

alter table public.cases
  add constraint cases_status_check
  check (status in ('Open', 'Pending', 'Closed'));

-- 4) Helpful indexes for the new cases list view (status pills + sorting
--    by open/close date are the dominant queries).
create index if not exists cases_status_idx       on public.cases (status);
create index if not exists cases_case_stage_idx   on public.cases (case_stage);
create index if not exists cases_date_opened_idx  on public.cases (date_opened desc);
create index if not exists cases_closed_at_idx    on public.cases (closed_at desc) where closed_at is not null;

-- 5) Auto-stamp closed_at / pending_at when status transitions. Avoids
--    relying on the application to set these consistently.
create or replace function public.cases_stamp_status_timestamps()
returns trigger language plpgsql as $$
begin
  if new.status = 'Closed' and (old.status is null or old.status <> 'Closed') then
    new.closed_at := coalesce(new.closed_at, now());
  end if;
  if new.status = 'Pending' and (old.status is null or old.status <> 'Pending') then
    new.pending_at := coalesce(new.pending_at, now());
  end if;
  -- If a case is reopened, clear the matching timestamp so reporting on
  -- "currently closed since" stays accurate.
  if new.status = 'Open' then
    new.closed_at := null;
    new.pending_at := null;
  end if;
  return new;
end $$;

drop trigger if exists cases_stamp_status_timestamps on public.cases;
create trigger cases_stamp_status_timestamps
  before insert or update of status on public.cases
  for each row execute function public.cases_stamp_status_timestamps();

commit;
