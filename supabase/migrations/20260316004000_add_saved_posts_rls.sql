ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved posts" ON saved_posts;
CREATE POLICY "Users can view own saved posts" ON saved_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save own posts" ON saved_posts;
CREATE POLICY "Users can save own posts" ON saved_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own saved posts" ON saved_posts;
CREATE POLICY "Users can remove own saved posts" ON saved_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);