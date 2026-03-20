import { ENV_VAR_GROUPS, envSchema, statusSchema } from "../src/env-schema";

function formatDefault(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return JSON.stringify(value.join(", "));
  return JSON.stringify(value);
}

function makeComment(description?: string, possibleValues?: string) {
  const parts: string[] = [];

  if (description) parts.push(description);
  if (possibleValues) parts.push(`allowed: ${possibleValues}`);

  return parts.length ? ` # ${parts.join(" | ")}` : "";
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
  const composeLines = lines.map(line => {
    if (line === "") return "";
    if (line.startsWith("#")) return `      ${line}`;
    return `      - ${line}`;
  });
  composeLines.push("", "      - RUN_MODE=docker");
  return composeLines.join("\n");
}

if (process.argv.includes("--gen")) {
  console.log(genExampleEnv());
}

if (process.argv.includes("--write")) {
  const root = new URL("..", import.meta.url).pathname;

  await Bun.write(`${root}.env.example`, genExampleEnv() + "\n");
  console.log("Updated .env.example");

  const composePath = `${root}docker-compose.yml`;
  const compose = await Bun.file(composePath).text();
  const updated = compose.replace(
    /(    environment:\n)[\s\S]*/,
    `$1${genComposeEnv()}\n`
  );
  await Bun.write(composePath, updated);
  console.log("Updated docker-compose.yml");
}
