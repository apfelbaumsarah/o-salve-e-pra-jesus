-- Cadastro de coleta separado dos voluntários
create table if not exists public.collection_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  whatsapp text not null,
  city text,
  pickup_region text,
  how_to_help text[] not null default array[]::text[],
  talents text[] not null default array[]::text[],
  notes text,
  status text not null default 'novo',
  volunteer_status text not null default 'disponivel'
    check (volunteer_status in ('disponivel', 'escalado', 'inativo')),
  admin_notes text
);

create index if not exists idx_collection_signups_created_at
  on public.collection_signups(created_at desc);

alter table public.collection_signups enable row level security;

drop policy if exists "public insert collection_signups" on public.collection_signups;
drop policy if exists "read collection_signups by role" on public.collection_signups;
drop policy if exists "update collection_signups by role" on public.collection_signups;
drop policy if exists "delete collection_signups admin only" on public.collection_signups;

create policy "public insert collection_signups" on public.collection_signups
  for insert
  to anon, authenticated
  with check (true);

create policy "read collection_signups by role" on public.collection_signups
  for select
  using (public.current_user_role() in ('super_admin', 'admin'));

create policy "update collection_signups by role" on public.collection_signups
  for update
  using (public.current_user_role() in ('super_admin', 'admin'))
  with check (public.current_user_role() in ('super_admin', 'admin'));

create policy "delete collection_signups admin only" on public.collection_signups
  for delete
  using (public.current_user_role() in ('super_admin', 'admin'));
