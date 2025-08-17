-- Add a persistent "How did you hear about us?" request question if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM request_questions WHERE id = 'how_did_you_hear_about_us'
  ) THEN
    INSERT INTO request_questions (id, question_text, question_type, is_required, is_active, is_customisable, sort_order, created_at)
    VALUES (
      'how_did_you_hear_about_us',
      'How did you hear about us?',
      'checkboxes',
      TRUE,
      TRUE,
      FALSE,
      9999,
      now()
    );
  END IF;
END$$;

-- Optionally create demo items for question_demo_items for richer UI if the app ever queries them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM question_demo_items WHERE question_slug = 'how_did_you_hear_about_us') THEN
    INSERT INTO question_demo_items (id, question_slug, name, description, is_active, sort_order, created_at)
    VALUES
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Facebook', NULL, TRUE, 1, now()),
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Instagram', NULL, TRUE, 2, now()),
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Tiktok', NULL, TRUE, 3, now()),
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Google', NULL, TRUE, 4, now()),
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Friend/Family', NULL, TRUE, 5, now()),
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Other social media', NULL, TRUE, 6, now()),
      (gen_random_uuid()::text, 'how_did_you_hear_about_us', 'Other', NULL, TRUE, 7, now());
  END IF;
END$$;
