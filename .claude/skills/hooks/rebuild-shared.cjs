const { execFileSync } = require("node:child_process");
const path = require("node:path");

// 1. Read the JSON that Claude Code sends on stdin
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const file = JSON.parse(input).tool_input?.file_path;
  if (!file) process.exit(0);

  // 2. Only files inside packages/shared/src, everything else is skipped
  const root = process.env.CLAUDE_PROJECT_DIR;
  const sharedSrc = path.join(root, "packages", "shared", "src");
  if (!path.resolve(file).startsWith(sharedSrc + path.sep)) process.exit(0);

  // 3. Rebuild shared
  try {
    execFileSync("npm", ["run", "build"], {
      cwd: path.join(root, "packages", "shared"),
      stdio: "pipe",
      shell: process.platform === "win32",
    });
  } catch (e) {
    // 4. Build failed: show the errors to Claude and exit with 2
    process.stderr.write(
      `packages/shared build failed:\n${e.stdout}${e.stderr}`,
    );
    process.exit(2);
  }
});
