begin;

alter view public.ranking reset (security_invoker);

commit;
