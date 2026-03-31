-- FOIAflow Database Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tmepkdippikertlftctl/sql/new

-- ── Requests ─────────────────────────────────────────────────────────
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text not null default '',
  description text not null,
  generated_letter text,
  appeal_letter text,
  agency_id text,
  agency_name text,
  status text not null default 'draft',
  quality_score int,
  filed_at timestamptz,
  due_date timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Documents ────────────────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size int not null,
  storage_path text not null,
  analysis_status text not null default 'pending',
  analysis_result jsonb,
  redaction_count int,
  page_count int,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Activities ───────────────────────────────────────────────────────
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  action text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────
alter table requests enable row level security;
alter table documents enable row level security;
alter table activities enable row level security;

-- Users can only see/modify their own data
create policy "Users can view own requests" on requests for select using (auth.uid() = user_id);
create policy "Users can insert own requests" on requests for insert with check (auth.uid() = user_id);
create policy "Users can update own requests" on requests for update using (auth.uid() = user_id);
create policy "Users can delete own requests" on requests for delete using (auth.uid() = user_id);

create policy "Users can view own documents" on documents for select using (auth.uid() = user_id);
create policy "Users can insert own documents" on documents for insert with check (auth.uid() = user_id);
create policy "Users can update own documents" on documents for update using (auth.uid() = user_id);
create policy "Users can delete own documents" on documents for delete using (auth.uid() = user_id);

create policy "Users can view own activities" on activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on activities for insert with check (auth.uid() = user_id);

-- ── Storage bucket for documents ─────────────────────────────────────
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Users can upload documents" on storage.objects for insert with check (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can view own documents" on storage.objects for select using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete own documents" on storage.objects for delete using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ── Indexes ──────────────────────────────────────────────────────────
create index if not exists idx_requests_user_id on requests(user_id);
create index if not exists idx_requests_status on requests(status);
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_documents_request_id on documents(request_id);
create index if not exists idx_activities_user_id on activities(user_id);

-- ── Updated_at trigger ───────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger requests_updated_at before update on requests
  for each row execute function update_updated_at();
create trigger documents_updated_at before update on documents
  for each row execute function update_updated_at();
