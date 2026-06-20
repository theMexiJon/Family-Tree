-- 002: life event photos + email notification subscriptions

-- ============================================================
-- life_event_photos
-- Multiple photos per person per event occurrence (birthday 2026, anniversary 2025, etc.)
-- ============================================================
CREATE TABLE life_event_photos (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calendar_id     uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  person_id       uuid REFERENCES people(id) ON DELETE CASCADE,
  relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'memorial', 'custom')),
  event_year      int NOT NULL CHECK (event_year > 1000 AND event_year < 2200),
  photo_url       text NOT NULL,
  caption         text,
  uploaded_by     text NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT must_have_subject CHECK (
    (person_id IS NOT NULL) OR (relationship_id IS NOT NULL)
  )
);

CREATE INDEX life_event_photos_person_idx        ON life_event_photos (person_id);
CREATE INDEX life_event_photos_relationship_idx  ON life_event_photos (relationship_id);
CREATE INDEX life_event_photos_calendar_idx      ON life_event_photos (calendar_id);

ALTER TABLE life_event_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read life_event_photos"
  ON life_event_photos FOR SELECT USING (true);

-- ============================================================
-- notification_subscribers
-- Email addresses that want reminders before events in a calendar
-- ============================================================
CREATE TABLE notification_subscribers (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  email       text NOT NULL,
  days_before int NOT NULL DEFAULT 7 CHECK (days_before > 0 AND days_before <= 30),
  token       text NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (calendar_id, email)
);

ALTER TABLE notification_subscribers ENABLE ROW LEVEL SECURITY;
-- No public read policy — only accessible via service role in the cron route

-- ============================================================
-- notification_sends
-- Tracks which events have already been emailed to each subscriber this year,
-- preventing duplicate reminders.
-- ============================================================
CREATE TABLE notification_sends (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscriber_id uuid NOT NULL REFERENCES notification_subscribers(id) ON DELETE CASCADE,
  event_key     text NOT NULL,
  sent_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (subscriber_id, event_key)
);

ALTER TABLE notification_sends ENABLE ROW LEVEL SECURITY;
-- Only accessible via service role
