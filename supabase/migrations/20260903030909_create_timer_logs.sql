create table public.timer_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  protocol_name text not null,
  day_number integer,
  step_number integer,
  step_name text not null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text
);

-- Enable RLS (Row Level Security) but allow anonymous inserts and reads for now since there's no auth system yet
alter table public.timer_logs enable row level security;

create policy "Allow anonymous select" on public.timer_logs for select using (true);
create policy "Allow anonymous insert" on public.timer_logs for insert with check (true);
create policy "Allow anonymous update" on public.timer_logs for update using (true);
