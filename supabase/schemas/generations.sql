-- Create generations table to store image generation results for each user
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  prompt text not null,
  guidance numeric(3,1) not null check (guidance >= 0 and guidance <= 20),
  steps integer not null check (steps >= 1 and steps <= 100),
  steps_completed integer not null default 0,
  aspect_ratio text not null,
  output_format text not null,
  batch_size integer not null check (batch_size >= 1 and batch_size <= 10),
  images jsonb not null default '[]'::jsonb,
  image_urls text[],
  is_loading boolean not null default true,
  error text,
  width integer default 1024,
  height integer default 1024,
  prompt_embed_scale numeric(6,3),
  pooled_prompt_embed_scale numeric(6,3),
  reference_scale numeric(6,3),
  cfg numeric(3,1) default 1,
  seed integer default -1,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

comment on table public.generations is 'Stores image generation results and parameters for each user';

-- Enable Row Level Security
alter table public.generations enable row level security;

-- Create RLS policies
-- Users can only see their own generations
create policy "Users can view their own generations" on public.generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own generations
create policy "Users can insert their own generations" on public.generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own generations
create policy "Users can update their own generations" on public.generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own generations
create policy "Users can delete their own generations" on public.generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index generations_user_id_idx on public.generations (user_id);
create index generations_created_at_idx on public.generations (created_at desc);
create index generations_is_loading_idx on public.generations (is_loading) where is_loading = true;

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger generations_updated_at
  before update on public.generations
  for each row
  execute function public.handle_updated_at();
