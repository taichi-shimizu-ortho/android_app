create policy "Allow anonymous delete on timer_logs" on public.timer_logs for delete using (true);
create policy "Allow anonymous delete on experiment_logs" on public.experiment_logs for delete using (true);
create policy "Allow anonymous update on experiment_logs" on public.experiment_logs for update using (true);
