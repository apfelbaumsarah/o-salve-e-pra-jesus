-- ================================================================
-- O SALVE É PRA JESUS — Setup do Banco Supabase
-- Cole todo este conteúdo no SQL Editor do Supabase e clique Run
-- ================================================================

-- 1. TABELAS

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text,
  city text,
  neighborhood text,
  accepted_jesus boolean not null default false,
  wants_updates boolean not null default false,
  prayer_request text,
  prayer_done boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text not null,
  subtitle text,
  "order" integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists lives (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  title text not null,
  date timestamptz not null,
  is_main boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  location text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  request text not null,
  prayer_done boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists settings (
  id integer primary key default 1,
  site_name text default 'O SALVE É PRA JESUS',
  logo_url text,
  donation_image_url text,
  google_fonts_url text,
  font_family text default 'Bebas Neue',
  instagram_url text,
  youtube_url text,
  constraint single_row check (id = 1)
);
insert into settings (id) values (1) on conflict do nothing;

create table if not exists team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  photo_url text,
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists deletion_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  source_table text not null,
  target_id text,
  total_items integer not null default 1,
  created_at timestamptz default now()
);

-- 2. SEGURANÇA (RLS)

alter table registrations enable row level security;
alter table banners enable row level security;
alter table lives enable row level security;
alter table events enable row level security;
alter table prayer_requests enable row level security;
alter table settings enable row level security;
alter table team enable row level security;
alter table deletion_audit_logs enable row level security;

drop policy if exists "public insert registrations" on registrations;
drop policy if exists "admin all registrations" on registrations;
create policy "public insert registrations" on registrations for insert with check (true);
create policy "admin all registrations" on registrations for all using (auth.role() = 'authenticated');

drop policy if exists "public insert prayers" on prayer_requests;
drop policy if exists "admin all prayers" on prayer_requests;
create policy "public insert prayers" on prayer_requests for insert with check (true);
create policy "admin all prayers" on prayer_requests for all using (auth.role() = 'authenticated');

drop policy if exists "public read banners" on banners;
drop policy if exists "admin write banners" on banners;
create policy "public read banners" on banners for select using (true);
create policy "admin write banners" on banners for all using (auth.role() = 'authenticated');

drop policy if exists "public read lives" on lives;
drop policy if exists "admin write lives" on lives;
create policy "public read lives" on lives for select using (true);
create policy "admin write lives" on lives for all using (auth.role() = 'authenticated');

drop policy if exists "public read events" on events;
drop policy if exists "admin write events" on events;
create policy "public read events" on events for select using (true);
create policy "admin write events" on events for all using (auth.role() = 'authenticated');

drop policy if exists "public read settings" on settings;
drop policy if exists "admin write settings" on settings;
create policy "public read settings" on settings for select using (true);
create policy "admin write settings" on settings for all using (auth.role() = 'authenticated');

drop policy if exists "public read team" on team;
drop policy if exists "admin write team" on team;
create policy "public read team" on team for select using (true);
create policy "admin write team" on team for all using (auth.role() = 'authenticated');

drop policy if exists "admin read deletion logs" on deletion_audit_logs;
drop policy if exists "admin insert deletion logs" on deletion_audit_logs;
create policy "admin read deletion logs" on deletion_audit_logs for select using (auth.role() = 'authenticated');
create policy "admin insert deletion logs" on deletion_audit_logs for insert with check (auth.role() = 'authenticated');

-- 3. BUCKET DE IMAGENS

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "public read uploads" on storage.objects;
drop policy if exists "auth write uploads" on storage.objects;
create policy "public read uploads" on storage.objects for select using (bucket_id = 'uploads');
create policy "auth write uploads" on storage.objects for all using (bucket_id = 'uploads' and auth.role() = 'authenticated');

select 'Setup concluido com sucesso!' as resultado;
