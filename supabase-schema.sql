create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  gmail text,
  avatar_url text,
  role text not null default 'student' check (role in ('super_admin','admin','student')),
  enrollment_status text not null default 'none'
    check (enrollment_status in ('none','pending','approved','banned')),
  access_code text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  type text not null check (type in ('summary','exam')),
  pdf_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1,
  tiktok_url text default '',
  instagram_url text default '',
  facebook_url text default '',
  whatsapp_url text default '',
  hero_title_ar text default 'ركن المذاكرة',
  hero_title_en text default 'Study Corner'
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.announcements enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin','super_admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, gmail, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name','طالب قانون'),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url',''),
    case
      when lower(coalesce(new.email, '')) = 'sherifeltahawy86@gmail.com'
        then 'super_admin'
      else 'student'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, phone, gmail, avatar_url, role)
select
  auth_user.id,
  coalesce(auth_user.raw_user_meta_data->>'full_name', 'طالب قانون'),
  coalesce(auth_user.raw_user_meta_data->>'phone', ''),
  coalesce(auth_user.email, ''),
  coalesce(auth_user.raw_user_meta_data->>'avatar_url', ''),
  'super_admin'
from auth.users as auth_user
where lower(auth_user.email) = 'sherifeltahawy86@gmail.com'
on conflict (id) do update set role = excluded.role;

create or replace function public.request_course_access()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles
  set enrollment_status = 'pending',
      access_code = 'LAW-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10))
  where id = auth.uid()
    and enrollment_status = 'none';

  if not found then
    raise exception 'لا يمكن إرسال طلب اشتراك جديد لهذا الحساب';
  end if;
end;
$$;

create or replace function public.set_student_status(p_student_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك بتنفيذ هذا الإجراء';
  end if;

  if p_status not in ('pending', 'approved', 'banned') then
    raise exception 'حالة الاشتراك غير صالحة';
  end if;

  update public.profiles
  set enrollment_status = p_status
  where id = p_student_id;

  if not found then
    raise exception 'الحساب المطلوب غير موجود';
  end if;
end;
$$;

revoke all on function public.request_course_access() from public;
revoke all on function public.set_student_status(uuid, text) from public;
grant execute on function public.request_course_access() to authenticated;
grant execute on function public.set_student_status(uuid, text) to authenticated;

create policy "Profiles are viewable by owner or admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, gmail, avatar_url)
on public.profiles to authenticated;

create policy "Approved users may read materials"
on public.materials for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
      and enrollment_status = 'approved'
  )
  or public.is_admin()
);

create policy "Admins manage materials"
on public.materials for all
using (public.is_admin())
with check (public.is_admin());

create policy "Announcements are public"
on public.announcements for select
using (true);

create policy "Admins manage announcements"
on public.announcements for all
using (public.is_admin())
with check (public.is_admin());

create policy "Site settings are public"
on public.site_settings for select
using (true);

create policy "Admins manage site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Public avatars are readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users upload their own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users update their own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users delete their own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.materials;