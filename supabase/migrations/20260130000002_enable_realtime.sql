-- Enable realtime for likes, comments, and posts tables
-- This allows the frontend to subscribe to changes in these tables

-- Add tables to the realtime publication (ignore errors if already added)
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.likes';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Table likes already in publication';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.comments';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Table comments already in publication';
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.posts';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Table posts already in publication';
END $$;

-- Enable REPLICA IDENTITY FULL for better change tracking
-- This ensures all columns are available in the payload
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
