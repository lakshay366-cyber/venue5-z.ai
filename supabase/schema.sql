-- Supabase Schema for VenueVault
-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com)

-- VENUES TABLE
CREATE TABLE IF NOT EXISTS venues (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  price_per   TEXT NOT NULL DEFAULT 'day',
  event_types TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  images      TEXT[] NOT NULL DEFAULT '{}',
  rating      REAL NOT NULL DEFAULT 4.0,
  capacity    INTEGER NOT NULL DEFAULT 100,
  amenities   TEXT[] NOT NULL DEFAULT '{}',
  featured    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id            TEXT PRIMARY KEY,
  venue_id      TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  venue_name    TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  event_date    TEXT NOT NULL,
  event_type    TEXT NOT NULL DEFAULT 'Wedding',
  guests        INTEGER NOT NULL DEFAULT 50,
  status        TEXT NOT NULL DEFAULT 'pending',
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  venue_id   TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  rating     INTEGER NOT NULL DEFAULT 5,
  text       TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(featured);
CREATE INDEX IF NOT EXISTS idx_bookings_venue ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_venue ON reviews(venue_id);

-- ROW LEVEL SECURITY
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public venues read" ON venues FOR SELECT USING (true);
CREATE POLICY "Admin venues all" ON venues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public bookings read" ON bookings FOR SELECT USING (true);
CREATE POLICY "Admin bookings all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public reviews read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Admin reviews all" ON reviews FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE venues;
