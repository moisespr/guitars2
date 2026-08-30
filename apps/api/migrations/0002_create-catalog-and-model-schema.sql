CREATE TABLE catalogs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE body_archetypes (
  id uuid PRIMARY KEY
);

CREATE TABLE body_models (
  id uuid PRIMARY KEY,
  catalog_id uuid NOT NULL REFERENCES catalogs(id),
  name text NOT NULL,
  normalized_name text NOT NULL CHECK (normalized_name <> ''),
  body_archetype_id uuid REFERENCES body_archetypes(id),
  material text,
  finish text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (catalog_id, normalized_name)
);

CREATE TABLE neck_models (
  id uuid PRIMARY KEY,
  catalog_id uuid NOT NULL REFERENCES catalogs(id),
  name text NOT NULL,
  normalized_name text NOT NULL CHECK (normalized_name <> ''),
  profile text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (catalog_id, normalized_name)
);

CREATE TABLE bridge_models (
  id uuid PRIMARY KEY,
  catalog_id uuid NOT NULL REFERENCES catalogs(id),
  name text NOT NULL,
  normalized_name text NOT NULL CHECK (normalized_name <> ''),
  bridge_type text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (catalog_id, normalized_name)
);

CREATE TABLE guitar_models (
  id uuid PRIMARY KEY,
  catalog_id uuid NOT NULL REFERENCES catalogs(id),
  name text NOT NULL,
  normalized_name text NOT NULL CHECK (normalized_name <> ''),
  body_model_id uuid NOT NULL REFERENCES body_models(id),
  neck_model_id uuid NOT NULL REFERENCES neck_models(id),
  bridge_model_id uuid NOT NULL REFERENCES bridge_models(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (catalog_id, normalized_name)
);
