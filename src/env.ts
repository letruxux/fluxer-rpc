import { createEnv } from "@t3-oss/env-core";
import { envSchema } from "./env-schema";
import { join } from "node:path";
import { config, parse } from "dotenv";
import { genExampleEnv } from "../scripts/generate-default-env";
import open from "open";
import { existsSync } from "node:fs";

declare const IS_WINDOWS: true | undefined;
process.env.RUN_MODE = IS_WINDOWS ? "windows_exe" : process.env.RUN_MODE;

export const envPathIfWindows = join(
  process.env.LOCALAPPDATA ?? "",
  "fluxer-rpc",
  ".env",
);

if (process.env.RUN_MODE === "windows_exe") {
  if (existsSync(envPathIfWindows)) {
    config({ path: envPathIfWindows, quiet: true });
  } else {
    /* create with default values */
    const defaultEnv = genExampleEnv();
    await Bun.file(envPathIfWindows).write(defaultEnv);
    open(envPathIfWindows);
    process.exit(0);
  }
}

export const env = createEnv({
  server: envSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
