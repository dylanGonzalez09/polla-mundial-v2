begin;

create or replace function public.effective_status(
  opens_at timestamptz,
  closes_at timestamptz,
  override public.phase_status default null
)
returns public.phase_status
language sql
stable
set search_path = public
as $$
  select case
    when override is not null then override
    when opens_at is null then 'locked'::public.phase_status
    when now() < opens_at then 'locked'::public.phase_status
    when closes_at is not null and now() >= closes_at then 'closed'::public.phase_status
    else 'open'::public.phase_status
  end;
$$;

create or replace function public.recompute_scores(target_match_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can recompute scores.';
  end if;

  update public.prediction_picks as picks
  set points = case
      when res.match_id is null then 0
      when picks.home_score is null or picks.away_score is null then 0
      when picks.home_score = res.home_score and picks.away_score = res.away_score then 3
      when sign(picks.home_score - picks.away_score) = sign(res.home_score - res.away_score) then 1
      else 0
    end,
    updated_at = timezone('utc', now())
  from public.official_results res
  where picks.match_id = target_match_id
    and res.match_id = target_match_id;

  update public.predictions as p
  set total_points = coalesce(score_totals.points, 0),
      updated_at = timezone('utc', now())
  from (
    select prediction_id, sum(points) as points
    from public.prediction_picks
    group by prediction_id
  ) as score_totals
  where p.id = score_totals.prediction_id;

  update public.predictions
  set total_points = 0,
      updated_at = timezone('utc', now())
  where id not in (select distinct prediction_id from public.prediction_picks);
end;
$$;

alter view public.ranking set (security_invoker = true);

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_my_admin_flag(text) from public, anon;
revoke execute on function public.get_peer_initial() from public, anon;
revoke execute on function public.get_peer_round_scores(public.round) from public, anon;
revoke execute on function public.recompute_scores(bigint) from public, anon;

grant execute on function public.sync_my_admin_flag(text) to authenticated;
grant execute on function public.get_peer_initial() to authenticated;
grant execute on function public.get_peer_round_scores(public.round) to authenticated;
grant execute on function public.recompute_scores(bigint) to authenticated;

commit;
