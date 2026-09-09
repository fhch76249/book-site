create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  image_url text,
  link_url text,
  active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ads add column if not exists title text;
alter table public.ads add column if not exists content text;
alter table public.ads add column if not exists image_url text;
alter table public.ads add column if not exists link_url text;
alter table public.ads add column if not exists active boolean;
alter table public.ads add column if not exists start_at timestamptz;
alter table public.ads add column if not exists end_at timestamptz;
alter table public.ads add column if not exists created_at timestamptz default now();
update public.ads set active=true where active is null;
alter table public.ads alter column active set default true;
alter table public.ads alter column active set not null;

alter table public.ads enable row level security;

drop policy if exists "Public can read active ads" on public.ads;
create policy "Public can read active ads" on public.ads
for select to anon, authenticated
using (active = true and (start_at is null or start_at <= now()) and (end_at is null or end_at >= now()));

drop policy if exists "Admin can insert ads" on public.ads;
create policy "Admin can insert ads" on public.ads
for insert to authenticated
with check (auth.uid() = '71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);

drop policy if exists "Admin can update ads" on public.ads;
create policy "Admin can update ads" on public.ads
for update to authenticated
using (auth.uid() = '71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid)
with check (auth.uid() = '71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);

drop policy if exists "Admin can delete ads" on public.ads;
create policy "Admin can delete ads" on public.ads
for delete to authenticated
using (auth.uid() = '71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);
