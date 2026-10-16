import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .mcp.json)`);
  return value;
}

// Host, port and database come from the service's DATABASE_URL,
// credentials are replaced with the read-only MCP user.
function databaseUrl(app: "auth" | "user"): string {
  const file = readFileSync(path.join(repoRoot, "apps", app, ".env"), "utf8");
  const serviceUrl = parseEnv(file).DATABASE_URL;
  if (!serviceUrl) throw new Error(`DATABASE_URL is missing in apps/${app}/.env`);

  const url = new URL(serviceUrl);
  url.username = requireEnv("MCP_DB_USER");
  url.password = requireEnv("MCP_DB_PASSWORD");
  return url.toString();
}

const pools = {
  auth: new Pool({
    connectionString: process.env.AUTH_DB_URL ?? databaseUrl("auth"),
    statement_timeout: 5000,
  }),
  user: new Pool({
    connectionString: process.env.USER_DB_URL ?? databaseUrl("user"),
    statement_timeout: 5000,
  }),
};

const server = new McpServer({ name: "glow-db", version: "0.1.0" });

server.registerTool(
  "check_user_consistency",
  {
    description:
      "Compare all users between auth_db and user_db. " +
      "Use it when a user cannot log in, when a user can log in but has no profile, " +
      "when profile data looks wrong, or to check that registration did not leave broken records. " +
      "Returns users that exist only in auth, users that exist only in user, " +
      "and users whose email or name differ between the two databases.",
    inputSchema: z.object({}),
  },
  async () => {
    const { rows: authUsers } = await pools.auth.query(`
      SELECT uuid, email, name
      FROM users
    `);
    const { rows: userUsers } = await pools.user.query(`
      SELECT uuid, email, name
      FROM users
    `);

    const result: {
      isConsistent: boolean;
      authOnly: { uuid: string; email: string; name: string }[];
      userOnly: { uuid: string; email: string; name: string }[];
      mismatched: {
        uuid: string;
        fields: { name: string; auth: unknown; user: unknown }[];
      }[];
    } = {
      isConsistent: true,
      authOnly: [],
      userOnly: [],
      mismatched: [],
    };

    const authUsersMap = new Map(authUsers.map((user) => [user.uuid, user]));
    const userUsersMap = new Map(userUsers.map((user) => [user.uuid, user]));

    for (const user of authUsers) {
      if (!userUsersMap.has(user.uuid)) {
        result.authOnly.push(user);
        result.isConsistent = false;
      }
    }

    for (const user of userUsers) {
      if (!authUsersMap.has(user.uuid)) {
        result.userOnly.push(user);
        result.isConsistent = false;
      } else {
        const authUser = authUsersMap.get(user.uuid);
        if (authUser?.email !== user.email || authUser?.name !== user.name) {
          result.isConsistent = false;
          result.mismatched.push({
            uuid: user.uuid,
            fields: [
              { name: "email", auth: authUser?.email, user: user.email },
              { name: "name", auth: authUser?.name, user: user.name },
            ],
          });
        }
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify({ result }) }],
    };
  },
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("glow-db MCP server running"); // stderr only, see below
}

main();
