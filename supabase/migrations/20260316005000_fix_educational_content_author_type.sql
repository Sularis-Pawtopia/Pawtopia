ALTER TABLE educational_content
  DROP CONSTRAINT IF EXISTS educational_content_author_type_check;

ALTER TABLE educational_content
  ADD CONSTRAINT educational_content_author_type_check
  CHECK (author_type IN ('ngo', 'dvmf', 'admin'));