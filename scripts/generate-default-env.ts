import { envSchema, statusSchema } from "../src/env";

const schema = envSchema;

console.log("# read src/env.ts if you need more info\n");

const required: string[] = [];
const optional: string[] = [];

function format(value: unknown) {
  if (value === undefined || value === null) return JSON.stringify("XXX");
  if (typeof value === "boolean") return value ? "true" : " # empty = false";
  return JSON.stringify(value);
}

for (const [key, value] of Object.entries(schema)) {
  if (!value) continue;

  const parsed = value.safeParse(undefined);

  if (parsed.success) {
    const possibleValues = key.endsWith("_STATUS") ? statusSchema.options.join(", ") : "";
    optional.push(
      `${key}=${format(parsed.data)}${possibleValues ? ` # ${possibleValues}` : ""}`,
    );
  } else {
    required.push(`${key}=XXX`);
  }
}

if (required.length) {
  console.log("# required");
  console.log(required.join("\n"));
  console.log("");
}

if (optional.length) {
  console.log("# optional ('' means false)");
  console.log(optional.join("\n"));
}
