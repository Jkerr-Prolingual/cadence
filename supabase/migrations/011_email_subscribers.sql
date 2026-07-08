-- Email subscriber list for new title notifications.

CREATE TABLE email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  CONSTRAINT email_subscribers_email_unique UNIQUE (email)
);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Only admins can read the subscriber list.
CREATE POLICY "Admins can manage subscribers"
  ON email_subscribers
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone (including anonymous/unauthenticated) can insert.
CREATE POLICY "Anyone can subscribe"
  ON email_subscribers
  FOR INSERT
  WITH CHECK (true);
