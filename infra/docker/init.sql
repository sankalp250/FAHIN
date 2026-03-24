-- FAHIN PostgreSQL init — run AFTER migrations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- for text search

-- Seed a demo city admin user
INSERT INTO users (id, role, city, city_sector, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'city_admin', 'Gurugram', 'Sector-45', true)
ON CONFLICT DO NOTHING;
