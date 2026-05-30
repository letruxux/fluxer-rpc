import { createEnv } from "@t3-oss/env-core";
import { envSchema } from "./env-schema";
import { join } from "node:path";
import { config } from "dotenv";
import { genExampleEnv } from "../scripts/generate-default-env";
import open from "open";
import { existsSync, appendFileSync, mkdirSync } from "node:fs";
import { hexToTerminal, Logger } from "./logger";
import Bun from "bun";

export const logger = new Logger(`${hexToTerminal("#ff0")}[env]${Logger.resetColor}`);

export const logFilePath = join(
  process.env.LOCALAPPDATA ?? "",
  "fluxer-rpc",
  "fluxer.log",
);

declare const IS_WINDOWS: true | undefined;
if (typeof IS_WINDOWS !== "undefined")
  process.env.RUN_MODE = IS_WINDOWS ? "windows_exe" : process.env.RUN_MODE;

export const envPathIfWindows = join(
  process.env.LOCALAPPDATA ?? "",
  "fluxer-rpc",
  ".env",
);

if (process.env.RUN_MODE === "windows_exe") {
  Logger.globalLogFile = logFilePath;

  if (existsSync(envPathIfWindows)) {
    config({ path: envPathIfWindows, quiet: true });
  } else {
    /* create with default values */
    const defaultEnv = genExampleEnv();
    await Bun.file(envPathIfWindows).write(
      `# ---- This file was generated automatically, please fill the required fields and try running the app again.\n# ---- Check out https://github.com/letruxux/fluxer-rpc?tab=readme-ov-file#setup for more context\n\n#\n\n` +
        defaultEnv,
    );
    open(envPathIfWindows);
    process.exit(0);
  }
}

function checkDeprecatedVars() {
  if (env.MUSIC_APPS !== undefined) {
    logger.warn(
      "MUSIC_APPS is deprecated, it now automatically detects all music apps. It has no effect and should be removed.",
    );
  }

  if (env.ROUND_TO_5_SECONDS !== undefined) {
    logger.warn(
      "ROUND_TO_5_SECONDS is deprecated. It still works, but ROUND_TO_SECONDS should be used instead to avoid changes in future updates.",
    );
  }
}

const runtimeEnv = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [
    k,
    typeof v === "string" ? v.replace(/^"|"$/g, "") : v,
  ]),
);

function showWindowsError(msg: string) {
  const psMsg = msg.replace(/'/g, "''");
  Bun.spawnSync([
    "powershell",
    "-NoProfile",
    "-Command",
    `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${psMsg}\n\nClick OK to open the configuration file.', 'Fluxer RPC - Configuration Error', 'OK', 'Error')`,
  ]);
  Bun.spawnSync(["cmd", "/c", "start", envPathIfWindows]);
}

export const env = createEnv({
  server: envSchema,
  runtimeEnv,
  emptyStringAsUndefined: true,
  onValidationError: (errors) => {
    const msg = `Invalid config:\n${errors.map((e) => e.path?.join(".") + " " + e.message).join("\n")}`;
    logger.error(msg);
    if (process.env.RUN_MODE === "windows_exe") {
      const dir = join(process.env.LOCALAPPDATA ?? "", "fluxer-rpc");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      appendFileSync(logFilePath, `[${new Date().toISOString()}] [env] ERR ${msg}\n`);
      showWindowsError(msg);
    }
    process.exit(1);
  },
});

export function isLastFmEnabled() {
  return env.LASTFM_USER && env.LASTFM_KEY;
}

checkDeprecatedVars();
