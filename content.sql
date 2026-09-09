create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  title text,
  text text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.site_content add column if not exists title text;
alter table public.site_content add column if not exists text text;
alter table public.site_content add column if not exists image_url text;
alter table public.site_content add column if not exists active boolean;
alter table public.site_content add column if not exists created_at timestamptz default now();
update public.site_content set active=true where active is null;
alter table public.site_content alter column active set default true;
alter table public.site_content alter column active set not null;
alter table public.site_content enable row level security;
drop policy if exists "Public can read active site content" on public.site_content;
create policy "Public can read active site content" on public.site_content for select to anon, authenticated using (active=true);
drop policy if exists "Admin can read site content" on public.site_content;
create policy "Admin can read site content" on public.site_content for select to authenticated using (auth.uid()='71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);
drop policy if exists "Admin can insert site content" on public.site_content;
create policy "Admin can insert site content" on public.site_content for insert to authenticated with check (auth.uid()='71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);
drop policy if exists "Admin can update site content" on public.site_content;
create policy "Admin can update site content" on public.site_content for update to authenticated using (auth.uid()='71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid) with check (auth.uid()='71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);
drop policy if exists "Admin can delete site content" on public.site_content;
create policy "Admin can delete site content" on public.site_content for delete to authenticated using (auth.uid()='71ed2c13-04cc-41a3-8042-7b7a1791000a'::uuid);
