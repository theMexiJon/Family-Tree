-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- calendars
-- ============================================================
CREATE TABLE calendars (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  owner_token   text NOT NULL,
  name          text NOT NULL,
  hemisphere    text NOT NULL CHECK (hemisphere IN ('north', 'south')),
  timezone      text NOT NULL,
  show_memorial boolean DEFAULT false NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- people
-- ============================================================
CREATE TABLE people (
  id             uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calendar_id    uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  maiden_name    text,
  birth_month    int  CHECK (birth_month BETWEEN 1 AND 12),
  birth_day      int  CHECK (birth_day BETWEEN 1 AND 31),
  birth_year     int  CHECK (birth_year > 1000 AND birth_year < 2200),
  is_deceased    boolean DEFAULT false NOT NULL,
  death_month    int  CHECK (death_month BETWEEN 1 AND 12),
  death_day      int  CHECK (death_day BETWEEN 1 AND 31),
  death_year     int  CHECK (death_year > 1000 AND death_year < 2200),
  photo_url      text,
  bio            text,
  branch         text,
  added_by       text NOT NULL,
  contributor_id text,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX people_calendar_idx ON people (calendar_id);

-- ============================================================
-- relationships
-- ============================================================
CREATE TABLE relationships (
  id             uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calendar_id    uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('partner', 'parent_child')),
  person_a_id    uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person_b_id    uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  wedding_month  int  CHECK (wedding_month BETWEEN 1 AND 12),
  wedding_day    int  CHECK (wedding_day BETWEEN 1 AND 31),
  wedding_year   int,
  status         text CHECK (status IN ('married', 'partners', 'divorced')),
  note           text,
  added_by       text NOT NULL,
  contributor_id text,
  created_at     timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT no_self_loop CHECK (person_a_id <> person_b_id)
);

-- Prevent duplicate parent→child edges (directed)
CREATE UNIQUE INDEX uniq_parent_child
  ON relationships (person_a_id, person_b_id)
  WHERE type = 'parent_child';

-- Prevent duplicate partner edges (undirected: A–B same as B–A)
CREATE UNIQUE INDEX uniq_partner
  ON relationships (
    LEAST(person_a_id::text, person_b_id::text),
    GREATEST(person_a_id::text, person_b_id::text)
  )
  WHERE type = 'partner';

CREATE INDEX relationships_calendar_idx ON relationships (calendar_id);

-- ============================================================
-- Row Level Security
-- All writes go through server actions using the service role key.
-- Public reads are open so the anon key can fetch tree/calendar data.
-- ============================================================
ALTER TABLE calendars    ENABLE ROW LEVEL SECURITY;
ALTER TABLE people       ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read calendars"
  ON calendars FOR SELECT USING (true);

CREATE POLICY "public read people"
  ON people FOR SELECT USING (true);

CREATE POLICY "public read relationships"
  ON relationships FOR SELECT USING (true);
