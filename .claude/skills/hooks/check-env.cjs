const fs = require("node:fs");
const path = require("node:path");

// 1. Read the JSON that Claude Code sends on stdin
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const file = JSON.parse(input).tool_input?.file_path;
  if (!file || !/\.tsx?$/.test(file)) process.exit(0);

  // 2. Find the app the file belongs to: apps/auth, apps/web...
  const root = process.env.CLAUDE_PROJECT_DIR;
  const [top, name] = path.relative(root, file).split(path.sep);
  if (top !== "apps") process.exit(0);
  const appDir = path.join(root, top, name);

  // 3. Collect env variable names used in the file
  const code = fs.readFileSync(file, "utf8");
  const patterns = [
    /process\.env\.([A-Z0-9_]+)/g, // process.env.MASTERS_URL
    /process\.env\[['"]([A-Z0-9_]+)['"]\]/g, // process.env['MASTERS_URL']
    /configService\.get(?:<[^>]+>)?\(\s*['"]([A-Z0-9_]+)['"]/g, // configService.get('MASTERS_URL')
  ];
  const used = new Set();
  for (const re of patterns) for (const m of code.matchAll(re)) used.add(m[1]);
  if (used.size === 0) process.exit(0);

  // 4. Compare with the names declared in .env.example
  const examplePath = path.join(appDir, ".env.example");
  const example = fs.existsSync(examplePath)
    ? fs.readFileSync(examplePath, "utf8")
    : "";
  const declared = new Set(
    example
      .split("\n")
      .map((line) => line.split("=")[0].trim())
      .filter(Boolean),
  );
  const missing = [...used].filter((v) => !declared.has(v));

  // 5. Something is missing: tell Claude and exit with 2
  if (missing.length > 0) {
    process.stderr.write(
      `These env variables are used in ${path.relative(root, file)} ` +
        `but missing from apps/${name}/.env.example: ${missing.join(", ")}. ` +
        `Add them to .env.example, and to .env if the value is local and not secret.`,
    );
    process.exit(2);
  }
});
