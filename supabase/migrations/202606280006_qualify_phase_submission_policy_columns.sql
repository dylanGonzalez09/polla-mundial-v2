begin;

drop policy if exists "prediction_phase_submissions_insert_self"
on public.prediction_phase_submissions;

create policy "prediction_phase_submissions_insert_self"
on public.prediction_phase_submissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.predictions as p
    where p.id = prediction_phase_submissions.prediction_id
      and p.user_id = auth.uid()
      and p.is_confirmed
  )
  and exists (
    select 1
    from public.match_phase as mp
    where mp.round = prediction_phase_submissions.round
      and public.effective_status(mp.opens_at, mp.closes_at, mp.manual_override) = 'open'
  )
  and not exists (
    select 1
    from public.prediction_picks as pick
    join public.tournament_matches as tm on tm.id = pick.match_id
    where pick.prediction_id = prediction_phase_submissions.prediction_id
      and tm.round = prediction_phase_submissions.round
      and (pick.home_score is null or pick.away_score is null)
  )
);

commit;
