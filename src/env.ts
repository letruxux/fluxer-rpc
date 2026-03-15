import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const env = createEnv({
  server: {
    TOKEN: z.string(),
    DISCORD_ID: z.string(),
    LASTFM_USER: z.string().optional(),
    LASTFM_KEY: z.string().optional(),

    DEFAULT_STATUS_EMOJI: z.string().optional().default("🐬"),
    DEFAULT_STATUS_TEXT: z.string().optional().default("hiii"),

    SHOW_SPOTIFY_TIME: z.boolean().optional().default(true),
    SHOW_ACTIVITY_TIME: z.boolean().optional().default(true),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
