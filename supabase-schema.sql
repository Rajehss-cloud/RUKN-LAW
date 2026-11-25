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

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (
    type in ('announcement', 'material', 'enrollment', 'profile', 'site_settings')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  permissions text[] not null default '{}'
    check (permissions <@ array['students', 'announcements', 'materials', 'settings']::text[])
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
alter table public.notifications enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.notify_announcement_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.notifications (title, message, type)
    values ('تم حذف إعلان', old.title, 'announcement');
  elsif tg_op = 'UPDATE' then
    insert into public.notifications (title, message, type)
    values (new.title, 'تم تحديث الإعلان: ' || new.message, 'announcement');
  else
    insert into public.notifications (title, message, type)
    values (new.title, new.message, 'announcement');
  end if;
  return null;
end;
$$;

create or replace function public.notify_material_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.notifications (title, message, type)
    values ('تم حذف مادة', old.title || ' — ' || old.subject, 'material');
  elsif tg_op = 'UPDATE' then
    insert into public.notifications (title, message, type)
    values ('تم تحديث مادة', new.title || ' — ' || new.subject, 'material');
  else
    insert into public.notifications (title, message, type)
    values ('مادة جديدة: ' || new.title, new.subject, 'material');
  end if;
  return null;
end;
$$;

create or replace function public.notify_enrollment_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  status_label text;
begin
  status_label := case new.enrollment_status
    when 'approved' then 'معتمد'
    when 'pending' then 'قيد المراجعة'
    when 'banned' then 'محظور'
    else 'غير مشترك'
  end;

  insert into public.notifications (user_id, title, message, type)
  values (
    new.id,
    'تحديث حالة الاشتراك',
    'تم تحديث حالة اشتراكك إلى: ' || status_label,
    'enrollment'
  );
  return null;
end;
$$;

create or replace function public.notify_profile_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (user_id, title, message, type)
  values (new.id, 'تحديث بيانات الحساب', 'تم تحديث بيانات حسابك.', 'profile');
  return null;
end;
$$;

create or replace function public.notify_site_settings_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notifications (title, message, type)
  values ('تحديث الموقع', 'تم تحديث إعدادات الموقع.', 'site_settings');
  return null;
end;
$$;

drop trigger if exists announcements_notification on public.announcements;
create trigger announcements_notification
after insert or update or delete on public.announcements
for each row execute function public.notify_announcement_change();

drop trigger if exists materials_notification on public.materials;
create trigger materials_notification
after insert or update or delete on public.materials
for each row execute function public.notify_material_change();

drop trigger if exists enrollment_notification on public.profiles;
create trigger enrollment_notification
after update of enrollment_status on public.profiles
for each row
when (old.enrollment_status is distinct from new.enrollment_status)
execute function public.notify_enrollment_change();

drop trigger if exists profile_notification on public.profiles;
create trigger profile_notification
after update of full_name, phone, gmail, avatar_url on public.profiles
for each row
when (
  old.full_name is distinct from new.full_name
  or old.phone is distinct from new.phone
  or old.gmail is distinct from new.gmail
  or old.avatar_url is distinct from new.avatar_url
)
execute function public.notify_profile_change();

drop trigger if exists site_settings_notification on public.site_settings;
create trigger site_settings_notification
after update on public.site_settings
for each row
when (
  old.facebook_url is distinct from new.facebook_url
  or old.instagram_url is distinct from new.instagram_url
  or old.tiktok_url is distinct from new.tiktok_url
  or old.whatsapp_url is distinct from new.whatsapp_url
  or old.hero_title_ar is distinct from new.hero_title_ar
  or old.hero_title_en is distinct from new.hero_title_en
)
execute function public.notify_site_settings_change();

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

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.has_admin_permission(p_permission text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles as profile
      join public.admin_permissions as permissions on permissions.user_id = profile.id
      where profile.id = auth.uid()
        and profile.role = 'admin'
        and p_permission = any(permissions.permissions)
    );
$$;

create or replace function public.set_admin_access(p_user_id uuid, p_permissions text[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_super_admin() then
    raise exception 'غير مصرح لك بإدارة المسؤولين';
  end if;

  if p_permissions is null
    or not (p_permissions <@ array['students', 'announcements', 'materials', 'settings']::text[])
  then
    raise exception 'قائمة صلاحيات المسؤول غير صالحة';
  end if;

  update public.profiles
  set role = 'admin'
  where id = p_user_id
    and role in ('student', 'admin');

  if not found then
    raise exception 'الحساب المطلوب غير موجود أو لا يمكن تعديله';
  end if;

  insert into public.admin_permissions (user_id, permissions)
  values (p_user_id, p_permissions)
  on conflict (user_id) do update
  set permissions = excluded.permissions;
end;
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
  if not public.has_admin_permission('students') then
    raise exception 'غير مصرح لك بتنفيذ هذا الإجراء';
  end if;

  if p_status not in ('pending', 'approved', 'banned') then
    raise exception 'حالة الاشتراك غير صالحة';
  end if;

  update public.profiles
  set enrollment_status = p_status
  where id = p_student_id
    and role = 'student';

  if not found then
    raise exception 'الحساب المطلوب غير موجود';
  end if;
end;
$$;

revoke all on function public.request_course_access() from public;
revoke all on function public.set_student_status(uuid, text) from public;
revoke all on function public.set_admin_access(uuid, text[]) from public;
grant execute on function public.request_course_access() to authenticated;
grant execute on function public.set_student_status(uuid, text) to authenticated;
grant execute on function public.set_admin_access(uuid, text[]) to authenticated;

drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
drop policy if exists "Profiles are viewable by owner, super admin, or student manager" on public.profiles;
create policy "Profiles are viewable by owner, super admin, or student manager"
on public.profiles for select
using (
  id = auth.uid()
  or public.is_super_admin()
  or (role = 'student' and public.has_admin_permission('students'))
);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Super admins can manage profiles" on public.profiles;
create policy "Super admins can manage profiles"
on public.profiles for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Users can read their admin permissions" on public.admin_permissions;
create policy "Users can read their admin permissions"
on public.admin_permissions for select
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

revoke all on public.admin_permissions from anon, authenticated;
grant select on public.admin_permissions to authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, gmail, avatar_url)
on public.profiles to authenticated;

drop policy if exists "Approved users may read materials" on public.materials;
create policy "Approved users may read materials"
on public.materials for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
      and enrollment_status = 'approved'
  )
  or public.has_admin_permission('materials')
);

drop policy if exists "Admins manage materials" on public.materials;
create policy "Admins manage materials"
on public.materials for all
using (public.has_admin_permission('materials'))
with check (public.has_admin_permission('materials'));

drop policy if exists "Announcements are public" on public.announcements;
create policy "Announcements are public"
on public.announcements for select
using (true);

drop policy if exists "Users may read public or personal notifications" on public.notifications;
create policy "Users may read public or personal notifications"
on public.notifications for select
to authenticated
using (user_id is null or user_id = auth.uid());

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
on public.announcements for all
using (public.has_admin_permission('announcements'))
with check (public.has_admin_permission('announcements'));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

drop policy if exists "Site settings are public" on public.site_settings;
create policy "Site settings are public"
on public.site_settings for select
using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
on public.site_settings for all
using (public.has_admin_permission('settings'))
with check (public.has_admin_permission('settings'));

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public avatars are readable" on storage.objects;
create policy "Public avatars are readable"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users upload their own avatars" on storage.objects;
create policy "Users upload their own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users update their own avatars" on storage.objects;
create policy "Users update their own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users delete their own avatars" on storage.objects;
create policy "Users delete their own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['announcements', 'profiles', 'materials', 'notifications']::text[]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;