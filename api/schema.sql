-- ═══════════════════════════════════════════════════════════════════════
-- JDAC Tracker — Cloudflare D1 (SQLite) schema
-- चलाना:  npx wrangler d1 execute jdac-tracker --remote --file=api/schema.sql
-- दोबारा चलाना safe है (IF NOT EXISTS).
--
-- पक्के नियम (database खुद लागू करता है):
--   • कोई DELETE नहीं — हर core table पर delete trigger ABORT करता है
--   • GPS point बदला नहीं जा सकता, client_id unique → कभी duplicate नहीं
--   • एक employee का एक दिन में एक ही session
--   • गलत lat/lng, end < start जैसे data reject
-- ═══════════════════════════════════════════════════════════════════════
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  legacy_id     INTEGER UNIQUE,                         -- पुराने JDAC tracker का people.id
  name          TEXT NOT NULL,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,    -- login ID, जैसे JDAC1013
  phone         TEXT UNIQUE,                            -- 10 अंक mobile (optional)
  pass_hash     TEXT NOT NULL,                          -- pbkdf2$iter$salt$hash
  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','hr','boss','developer')),
  team          TEXT NOT NULL DEFAULT 'Office'   CHECK (team IN ('Warehouse','Office')),
  designation   TEXT,
  department    TEXT,
  work_location TEXT,                                   -- Pune Camp / Goa / Pune HO …
  shift_start   TEXT NOT NULL DEFAULT '10:00',
  shift_end     TEXT NOT NULL DEFAULT '19:00',
  joining_date  TEXT,
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  live_track    INTEGER NOT NULL DEFAULT 0,             -- 1 = Office वाले की भी पूरे दिन GPS tracking
  device_id     TEXT,
  token_version INTEGER NOT NULL DEFAULT 0,             -- बढ़ाने पर सारे पुराने login बंद
  app_login_at  TEXT,                                   -- GPS वाले phone login का समय (24 घंटे बाद auto-logout)
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (phone IS NULL OR length(phone) = 10),
  CHECK (length(username) BETWEEN 3 AND 30)
);

CREATE TABLE IF NOT EXISTS day_sessions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id         INTEGER NOT NULL REFERENCES employees(id),
  date           TEXT NOT NULL,                         -- IST YYYY-MM-DD
  start_at       TEXT NOT NULL,
  start_lat      REAL, start_lng REAL,
  start_photo    TEXT,                                  -- photo key (Supabase / fallback)
  end_at         TEXT,
  end_lat        REAL, end_lng REAL,
  end_photo      TEXT,
  total_km       REAL NOT NULL DEFAULT 0,
  manual_km      REAL NOT NULL DEFAULT 0 CHECK (manual_km BETWEEN 0 AND 1000),
  manual_km_note TEXT,
  auto_closed    INTEGER NOT NULL DEFAULT 0,
  legacy_id      INTEGER UNIQUE,
  UNIQUE (emp_id, date),
  CHECK (end_at IS NULL OR end_at >= start_at)
);

CREATE TABLE IF NOT EXISTS location_pings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   TEXT NOT NULL UNIQUE,                     -- phone पर बना id → retry में duplicate नहीं
  emp_id      INTEGER NOT NULL REFERENCES employees(id),
  date        TEXT NOT NULL,
  lat         REAL NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng         REAL NOT NULL CHECK (lng BETWEEN -180 AND 180),
  accuracy    REAL,
  kind        TEXT NOT NULL DEFAULT 'duty' CHECK (kind IN ('duty','field')),
  recorded_at TEXT NOT NULL,                            -- phone का समय (offline में भी सही क्रम)
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (NOT (lat = 0 AND lng = 0))
);
CREATE INDEX IF NOT EXISTS pings_emp_date ON location_pings (emp_id, date, recorded_at);
CREATE INDEX IF NOT EXISTS pings_date ON location_pings (date);

-- हर employee की आखिरी location (live map तेज़ + सस्ता)
CREATE TABLE IF NOT EXISTS last_location (
  emp_id      INTEGER PRIMARY KEY REFERENCES employees(id),
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  accuracy    REAL,
  kind        TEXT,
  recorded_at TEXT NOT NULL,
  synced_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id      INTEGER NOT NULL REFERENCES employees(id),
  date        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'Full day' CHECK (kind IN ('Full day','Half day')),
  reason      TEXT NOT NULL CHECK (length(trim(reason)) >= 3),
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),
  decided_by  INTEGER REFERENCES employees(id),
  decided_at  TEXT,
  legacy_id   INTEGER UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS leave_one_active ON leave_requests (emp_id, date) WHERE status IN ('Pending','Approved');

-- HR की attendance correction (Present / Half Day / Absent / Leave / Week Off)
CREATE TABLE IF NOT EXISTS attendance_marks (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id  INTEGER NOT NULL REFERENCES employees(id),
  date    TEXT NOT NULL,
  status  TEXT NOT NULL CHECK (status IN ('Present','Half Day','Absent','Leave','Week Off')),
  reason  TEXT,
  set_by  INTEGER REFERENCES employees(id),
  set_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  legacy  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (emp_id, date)
);

-- Photo fallback: Supabase न मिले तो photo यहीं (कभी miss नहीं)
CREATE TABLE IF NOT EXISTS photos (
  key        TEXT PRIMARY KEY,
  mime       TEXT NOT NULL DEFAULT 'image/jpeg',
  data       BLOB NOT NULL,
  moved      INTEGER NOT NULL DEFAULT 0,               -- 1 = Supabase पर पहुँच गई
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- हर बदलाव का हिसाब: किसने, कब, पहले क्या, बाद में क्या
CREATE TABLE IF NOT EXISTS audit_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor    INTEGER,
  action   TEXT NOT NULL,
  tbl      TEXT NOT NULL,
  row_id   TEXT,
  old_data TEXT,
  new_data TEXT
);
CREATE INDEX IF NOT EXISTS audit_at ON audit_log (at);

-- Cron का नतीजा: किसका signal नहीं आ रहा (admin alert)
CREATE TABLE IF NOT EXISTS alerts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id     INTEGER NOT NULL REFERENCES employees(id),
  date       TEXT NOT NULL,
  kind       TEXT NOT NULL,                             -- no_signal / auto_logout
  detail     TEXT,
  opened_at  TEXT NOT NULL,
  closed_at  TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS alerts_open ON alerts (emp_id, kind) WHERE closed_at IS NULL;

-- ── कोई DELETE नहीं ──────────────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS no_delete_employees      BEFORE DELETE ON employees      BEGIN SELECT RAISE(ABORT, 'delete not allowed — deactivate instead'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_sessions       BEFORE DELETE ON day_sessions   BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_pings          BEFORE DELETE ON location_pings BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_leaves         BEFORE DELETE ON leave_requests BEGIN SELECT RAISE(ABORT, 'delete not allowed — cancel instead'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_marks          BEFORE DELETE ON attendance_marks BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END;
CREATE TRIGGER IF NOT EXISTS no_delete_audit          BEFORE DELETE ON audit_log      BEGIN SELECT RAISE(ABORT, 'audit log is permanent'); END;
CREATE TRIGGER IF NOT EXISTS no_update_audit          BEFORE UPDATE ON audit_log      BEGIN SELECT RAISE(ABORT, 'audit log is permanent'); END;
-- GPS point एक बार आया तो बदल नहीं सकता
CREATE TRIGGER IF NOT EXISTS no_update_pings          BEFORE UPDATE ON location_pings BEGIN SELECT RAISE(ABORT, 'GPS points are permanent'); END;
-- Session का employee/date कभी नहीं बदलता
CREATE TRIGGER IF NOT EXISTS session_identity_fixed   BEFORE UPDATE OF emp_id, date ON day_sessions
  WHEN NEW.emp_id <> OLD.emp_id OR NEW.date <> OLD.date
  BEGIN SELECT RAISE(ABORT, 'session employee/date cannot change'); END;

-- नया GPS point → last_location (सिर्फ़ तब जब वो पहले वाले से नया हो)
CREATE TRIGGER IF NOT EXISTS ping_last_location AFTER INSERT ON location_pings
BEGIN
  INSERT INTO last_location (emp_id, lat, lng, accuracy, kind, recorded_at, synced_at)
  VALUES (NEW.emp_id, NEW.lat, NEW.lng, NEW.accuracy, NEW.kind, NEW.recorded_at, NEW.created_at)
  ON CONFLICT (emp_id) DO UPDATE SET
    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy, kind = excluded.kind,
    recorded_at = excluded.recorded_at, synced_at = excluded.synced_at
  WHERE excluded.recorded_at > last_location.recorded_at;
END;

-- App settings (auto-generated token secret वगैरह). इसे कभी delete न करें — करने पर सबको फिर login करना होगा.
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- पुराने JDAC tracker के बाकी modules (tasks, invoices, salary, ad leads…) — सिर्फ देखने के लिए (Boss/Developer)
CREATE TABLE IF NOT EXISTS legacy_records (
  tbl       TEXT NOT NULL,
  legacy_id TEXT NOT NULL,
  data      TEXT NOT NULL,          -- JSON row
  PRIMARY KEY (tbl, legacy_id)
);

-- Server usage (रोज़ की requests) — free plan limit पर नज़र रखने के लिए
CREATE TABLE IF NOT EXISTS usage_daily (
  day      TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0
);

-- Desk-first system, daily bookings, payments, public forms
CREATE TABLE IF NOT EXISTS desks (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, name TEXT NOT NULL, icon TEXT, description TEXT, kind TEXT NOT NULL DEFAULT 'ready', module TEXT, fields TEXT, rolls_up TEXT, active INTEGER NOT NULL DEFAULT 1, legacy_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS desk_access (desk_id INTEGER NOT NULL, emp_id INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, changed_at TEXT, PRIMARY KEY (desk_id, emp_id));
CREATE TABLE IF NOT EXISTS desk_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, desk_id INTEGER NOT NULL, emp_id INTEGER, date TEXT NOT NULL, data TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT);
CREATE TABLE IF NOT EXISTS daily_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id INTEGER, date TEXT NOT NULL, booking_no TEXT NOT NULL UNIQUE COLLATE NOCASE, amount REAL NOT NULL CHECK (amount > 0), legacy_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT);
CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id TEXT NOT NULL, company TEXT, amount REAL NOT NULL CHECK (amount > 0), date TEXT NOT NULL, mode TEXT NOT NULL, reference TEXT, by_emp INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS public_forms (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, icon TEXT, fields TEXT NOT NULL, project_id TEXT, project_name TEXT, becomes TEXT NOT NULL DEFAULT 'entry', status TEXT NOT NULL DEFAULT 'live', created_by INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS form_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, form_id INTEGER NOT NULL, data TEXT NOT NULL, result TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoice_docno ON legacy_records (json_extract(data, '$.company'), json_extract(data, '$.kind'), json_extract(data, '$.docNo')) WHERE tbl = 'invoices';
