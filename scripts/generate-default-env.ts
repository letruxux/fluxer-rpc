import { ENV_VAR_GROUPS, envSchema, statusSchema } from "../src/env-schema";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

function formatDefault(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value.join(", "));
  return JSON.stringify(value);
}

function makeComment(comment?: string) {
  return comment ? ` # ${comment}` : "";
}

export function genExampleEnv() {
  let env = "";

  const usedKeys = new Set<string>();

  function buildLine(key: string, value: any) {
    const parsed = value.safeParse(undefined);
    const { description } = value;

    if (parsed.success) {
      return `${key}=${formatDefault(parsed.data)}${makeComment(description)}`;
    }

    return `${key}=${makeComment(description)}`;
  }

  // gruppi
  for (const [groupName, keys] of Object.entries(ENV_VAR_GROUPS)) {
    const lines: string[] = [];

    for (const key of keys) {
      if (key === "RUN_MODE") continue;

      const value = envSchema[key as keyof typeof envSchema];
      if (!value) continue;

      usedKeys.add(key);
      lines.push(buildLine(key, value));
    }

    if (lines.length) {
      env += `# ${groupName}\n`;
      env += lines.join("\n");
      env += "\n\n";
    }
  }

  // fallback: env non nei gruppi
  const other: string[] = [];

  for (const [key, value] of Object.entries(envSchema)) {
    if (usedKeys.has(key)) continue;
    if (key === "RUN_MODE") continue;
    if (value.description?.endsWith("DEPRECATED")) continue;
    if (!value) continue;

    other.push(buildLine(key, value));
  }

  if (other.length) {
    env += "# other\n";
    env += other.join("\n");
    env += "\n";
  }

  return env.trim();
}

export function genComposeEnv() {
  const lines = genExampleEnv().split("\n");
  const composeLines = lines.map((line) => {
    if (line === "") return "";
    if (line.startsWith("#")) return `      ${line}`;
    // Docker compose si rompe i coglioni con i commenti inline — IMPORTANTE
    const withoutComment = line.replace(/\s+#\s.*$/, "");
    return `      - ${withoutComment}`;
  });
  return composeLines.join("\n");
}

if (process.argv.includes("--gen")) {
  console.log(genExampleEnv());
}

if (process.argv.includes("--write")) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");

  await Bun.write(join(root, ".env.example"), genExampleEnv() + "\n");
  console.log("Updated .env.example");

  const composePath = join(root, "docker-compose.yml");
  const compose = await Bun.file(composePath).text();
  const envRegex = /^    environment:\r?\n[\s\S]+$/m;
  const updated = compose.replace(envRegex, `    environment:\r\n${genComposeEnv()}\r\n`);
  await Bun.write(composePath, updated);
  console.log("Updated docker-compose.yml");
}
