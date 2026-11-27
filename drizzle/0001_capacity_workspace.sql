CREATE TABLE IF NOT EXISTS capacity_companies (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 name_key TEXT NOT NULL UNIQUE,
 notes TEXT NOT NULL DEFAULT '',
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS capacity_sites (
 id TEXT PRIMARY KEY NOT NULL,
 company_id TEXT NOT NULL REFERENCES capacity_companies(id),
 name TEXT NOT NULL,
 metadata_json TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 UNIQUE(id, company_id)
);
CREATE INDEX IF NOT EXISTS capacity_sites_company ON capacity_sites(company_id, created_at);
CREATE TABLE IF NOT EXISTS capacity_datasets (
 id TEXT PRIMARY KEY NOT NULL,
 company_id TEXT NOT NULL,
 site_id TEXT NOT NULL,
 label TEXT NOT NULL,
 source TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 start_utc TEXT NOT NULL,
 interval_hours REAL NOT NULL,
 row_count INTEGER NOT NULL,
 synthetic INTEGER NOT NULL DEFAULT 0,
 assumed_dates INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL,
 FOREIGN KEY(site_id, company_id) REFERENCES capacity_sites(id, company_id),
 UNIQUE(company_id, site_id, fingerprint)
);
CREATE TABLE IF NOT EXISTS capacity_dataset_chunks (
 dataset_id TEXT NOT NULL REFERENCES capacity_datasets(id),
 chunk_index INTEGER NOT NULL,
 values_json TEXT NOT NULL,
 PRIMARY KEY(dataset_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS capacity_datasets_company ON capacity_datasets(company_id, created_at);
CREATE TABLE IF NOT EXISTS capacity_runs (
 id TEXT PRIMARY KEY NOT NULL,
 company_id TEXT NOT NULL,
 site_id TEXT NOT NULL,
 dataset_id TEXT NOT NULL REFERENCES capacity_datasets(id),
 title TEXT NOT NULL,
 notes TEXT NOT NULL DEFAULT '',
 model_version TEXT NOT NULL,
 input_hash TEXT NOT NULL,
 inputs_json TEXT NOT NULL,
 report_json TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 FOREIGN KEY(site_id, company_id) REFERENCES capacity_sites(id, company_id)
);
CREATE INDEX IF NOT EXISTS capacity_runs_company ON capacity_runs(company_id, created_at DESC);
