-- ─────────────────────────────────────────────────────────────
-- Migration: Churches + role-based access (super_admin / admin / igreja)
-- Rodar no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────

-- 1. Tabela de igrejas
create table if not exists churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  email text unique not null,
  created_at timestamptz default now()
);

-- 2. Adiciona role_type e church_id em team
alter table team
  add column if not exists role_type text not null default 'admin'
    check (role_type in ('super_admin','admin','igreja'));

alter table team
  add column if not exists church_id uuid references churches(id) on delete set null;

-- 3. Atribuição em registrations e prayer_requests
alter table registrations
  add column if not exists assigned_church_id uuid references churches(id) on delete set null;

alter table prayer_requests
  add column if not exists assigned_church_id uuid references churches(id) on delete set null;

-- Índices para performance nos filtros por igreja
create index if not exists idx_registrations_assigned_church
  on registrations(assigned_church_id);
create index if not exists idx_prayer_requests_assigned_church
  on prayer_requests(assigned_church_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Helpers para ler role e church_id do usuário logado
--    SECURITY DEFINER para bypassar RLS no lookup.
-- ─────────────────────────────────────────────────────────────

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role_type from team where email = (select auth.email()) limit 1),
    case when (select auth.email()) = 'contato@salveprajesus.org' then 'super_admin' else null end
  );
$$;

create or replace function public.current_user_church_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select church_id from team where email = (select auth.email()) limit 1;
$$;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.current_user_church_id() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS — substitui "admin all" por policies granulares
-- ─────────────────────────────────────────────────────────────

alter table churches enable row level security;

-- churches: super_admin gerencia; admin/igreja só leem
drop policy if exists "churches read" on churches;
drop policy if exists "churches write super_admin" on churches;

create policy "churches read" on churches for select
  using (current_user_role() in ('super_admin','admin','igreja'));

create policy "churches write super_admin" on churches for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

-- registrations
drop policy if exists "admin all registrations" on registrations;
drop policy if exists "read registrations by role" on registrations;
drop policy if exists "update registrations by role" on registrations;
drop policy if exists "delete registrations admin only" on registrations;

create policy "read registrations by role" on registrations for select
  using (
    current_user_role() in ('super_admin','admin')
    or (current_user_role() = 'igreja' and assigned_church_id = current_user_church_id())
  );

create policy "update registrations by role" on registrations for update
  using (
    current_user_role() in ('super_admin','admin')
    or (current_user_role() = 'igreja' and assigned_church_id = current_user_church_id())
  )
  with check (
    current_user_role() in ('super_admin','admin')
    or (current_user_role() = 'igreja' and assigned_church_id = current_user_church_id())
  );

create policy "delete registrations admin only" on registrations for delete
  using (current_user_role() in ('super_admin','admin'));

-- "public insert registrations" existente permanece (anon pode se cadastrar)

-- prayer_requests
drop policy if exists "admin all prayers" on prayer_requests;
drop policy if exists "read prayers by role" on prayer_requests;
drop policy if exists "update prayers by role" on prayer_requests;
drop policy if exists "delete prayers admin only" on prayer_requests;

create policy "read prayers by role" on prayer_requests for select
  using (
    current_user_role() in ('super_admin','admin')
    or (current_user_role() = 'igreja' and assigned_church_id = current_user_church_id())
  );

create policy "update prayers by role" on prayer_requests for update
  using (
    current_user_role() in ('super_admin','admin')
    or (current_user_role() = 'igreja' and assigned_church_id = current_user_church_id())
  );

create policy "delete prayers admin only" on prayer_requests for delete
  using (current_user_role() in ('super_admin','admin'));

-- team: super_admin gerencia; usuário vê a própria linha
drop policy if exists "admin write team" on team;
drop policy if exists "public read team" on team;
drop policy if exists "team read own or admin" on team;
drop policy if exists "team write super_admin" on team;

create policy "team read own or admin" on team for select
  using (
    email = (select auth.email())
    or current_user_role() in ('super_admin','admin')
  );

create policy "team write super_admin" on team for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

-- settings, banners, lives, events: mantêm política authenticated
-- (igreja não acessa essas abas na UI, então não precisa granular)
