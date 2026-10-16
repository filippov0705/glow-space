# glow-db MCP server

An MCP server that gives Claude Code read-only access to the `auth_db` and `user_db` databases, so it can check data across services while debugging.

## Tools

| Tool | What it does |
|---|---|
| `check_user_consistency` | Compares all users in `auth_db` and `user_db`. Returns users that exist in only one database, and users whose `email` or `name` differ between the two. |

## Setup

1. Start the databases with `docker compose up -d` and make sure `apps/auth/.env` and `apps/user/.env` exist.
2. Install dependencies: `cd tools/mcp-db && npm install`.
3. Create the read-only user in both databases. You only need to do this once per database volume:
   ```
   docker compose exec -T postgres-auth psql -U dev -d auth_db -f - < tools/mcp-db/setup-readonly.sql
   docker compose exec -T postgres-user psql -U dev -d user_db -f - < tools/mcp-db/setup-readonly.sql
   ```
4. Restart Claude Code in the repo root and approve the `glow-db` server. `/mcp` shows its status.

The server is registered in `.mcp.json` at the repo root. It takes the host, port and database from `DATABASE_URL` in `apps/auth/.env` and `apps/user/.env`. It replaces the credentials with `MCP_DB_USER` and `MCP_DB_PASSWORD` from `.mcp.json`, so there is no second copy of the addresses to keep in sync. If `MCP_DB_USER` or `MCP_DB_PASSWORD` is missing, the server refuses to start. To point it at a different database, set `AUTH_DB_URL` or `USER_DB_URL`. Either one overrides that database's URL completely, credentials included.

## Why a separate read-only user

The services connect as `dev`, which owns the databases. If the MCP server used the same account, a wrong query from the model could change or delete data.

`mcp_reader` is a separate account that only has `SELECT`. Postgres rejects any write from it, whatever the tool code does. `setup-readonly.sql` also sets default privileges, so tables added by future migrations are readable without granting them again.

`mcp_reader` / `mcp_reader` are local development credentials, the same kind as `dev` / `dev` in `docker-compose.yml`. Don't reuse them anywhere else.
