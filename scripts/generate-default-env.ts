import { envSchema, statusSchema } from "../src/env-schema";

export function genExampleEnv() {
  let env = "";
  const required: string[] = [];
  const optional: string[] = [];

  function format(value: unknown) {
    if (value === undefined || value === null) return JSON.stringify("XXX");
    if (typeof value === "boolean") return value ? "true" : " # empty = false";
    return JSON.stringify(value);
  }

  for (const [key, value] of Object.entries(envSchema)) {
    if (key === "RUN_MODE") continue;
    if (!value) continue;

    const parsed = value.safeParse(undefined);

    if (parsed.success) {
      const possibleValues = key.endsWith("_STATUS")
        ? statusSchema.options.join(", ")
        : "";
      optional.push(
        `${key}=${format(parsed.data)}${possibleValues ? ` # ${possibleValues}` : ""}`,
      );
    } else {
      required.push(`${key}=XXX`);
    }
  }

  if (required.length) {
    env += "# required\n";
    env += required.join("\n");
    env += "\n\n";
  }

  if (optional.length) {
    env += "# optional ('' means false)\n";
    env += optional.join("\n");
  }

  return env;
}

if (process.argv.includes("--gen")) {
  console.log("# read src/env.ts if you need more info\n");
  console.log(genExampleEnv());
}
