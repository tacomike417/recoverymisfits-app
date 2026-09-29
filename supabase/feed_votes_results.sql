-- FEED PREVIEW RESULTS (Recovery Misfits project)
select choice, count(*) from public.feed_votes group by choice order by 2 desc;
select created_at, choice, coalesce(name,'(no name)') as name, note from public.feed_votes order by created_at desc;
