-- Read-only user for the glow-db MCP server.
-- Run in each database (auth_db and user_db) as the user that runs Prisma migrations (dev).
-- Safe to run more than once.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mcp_reader') THEN
    CREATE ROLE mcp_reader LOGIN PASSWORD 'mcp_reader';
  END IF;
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO mcp_reader', current_database());
END $$;

GRANT USAGE ON SCHEMA public TO mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_reader;

-- Tables created later by migrations become readable too.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_reader;
