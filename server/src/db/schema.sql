CREATE TABLE IF NOT EXISTS fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  acreage REAL NOT NULL,
  soil_type TEXT NOT NULL,
  ph_level REAL NOT NULL DEFAULT 6.5,
  organic_matter_pct REAL NOT NULL DEFAULT 3.2,
  irrigation_type TEXT NOT NULL DEFAULT 'Center Pivot',
  latitude REAL,
  longitude REAL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  variety TEXT,
  botanical_family TEXT NOT NULL,
  season TEXT NOT NULL,
  days_to_maturity INTEGER NOT NULL,
  nitrogen_demand TEXT NOT NULL,
  root_depth TEXT NOT NULL,
  water_requirement TEXT NOT NULL,
  typical_yield_per_acre REAL NOT NULL,
  yield_unit TEXT NOT NULL,
  market_price_per_unit REAL NOT NULL,
  pests_diseases TEXT,
  companion_crops TEXT,
  incompatible_following TEXT
);

CREATE TABLE IF NOT EXISTS crop_rotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  crop_id INTEGER NOT NULL REFERENCES crops(id),
  year INTEGER NOT NULL,
  season TEXT NOT NULL,
  target_yield REAL,
  actual_yield REAL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Planned',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(field_id, year, season)
);

CREATE TABLE IF NOT EXISTS field_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id),
  operation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  completed_date TEXT,
  assigned_to TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Planned',
  weather_prerequisites TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operation_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id INTEGER NOT NULL REFERENCES field_operations(id) ON DELETE CASCADE,
  input_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  cost_per_unit REAL NOT NULL,
  total_cost REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS harvest_yields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  crop_id INTEGER NOT NULL REFERENCES crops(id),
  year INTEGER NOT NULL,
  season TEXT NOT NULL,
  harvest_date TEXT NOT NULL,
  total_yield REAL NOT NULL,
  yield_per_acre REAL NOT NULL,
  unit TEXT NOT NULL,
  moisture_pct REAL NOT NULL DEFAULT 15.0,
  quality_grade TEXT NOT NULL DEFAULT 'Grade 1',
  contract_buyer TEXT,
  sale_price_per_unit REAL NOT NULL,
  total_revenue REAL NOT NULL,
  total_input_cost REAL NOT NULL DEFAULT 0,
  net_profit REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  current_hours REAL NOT NULL DEFAULT 0,
  fuel_level_pct REAL NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'Active',
  location TEXT DEFAULT 'Main Machine Shed',
  last_service_date TEXT,
  next_service_hours REAL NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  interval_hours REAL NOT NULL,
  last_completed_hours REAL NOT NULL DEFAULT 0,
  last_completed_date TEXT,
  due_hours REAL NOT NULL,
  estimated_cost REAL NOT NULL DEFAULT 0,
  checklist TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES maintenance_tasks(id),
  service_date TEXT NOT NULL,
  hours_at_service REAL NOT NULL,
  performed_by TEXT NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  parts_replaced TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Farm Manager',
  farm_name TEXT NOT NULL DEFAULT 'Willow Creek Farm',
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
