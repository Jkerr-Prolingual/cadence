-- Contact form messages from the landing page.

CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can read messages.
CREATE POLICY "Admins can manage messages"
  ON contact_messages
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone (including anonymous/unauthenticated) can submit.
CREATE POLICY "Anyone can submit a message"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);
