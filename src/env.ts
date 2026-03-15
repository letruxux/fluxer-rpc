import { createEnv, type StandardSchemaDictionary } from "@t3-oss/env-core";
import z from "zod";

export const statusSchema = z.enum(["online", "idle", "dnd", "invisible"]);

export const envSchema = {
  TOKEN: z.string(),
  DISCORD_ID: z.string(),

  CHECK_LASTFM_WHEN_ONLINE: z.boolean().optional().default(false),
  LASTFM_USER: z.string().optional(),
  LASTFM_KEY: z
    .string()
    .optional() /* if not provided it just will use spotify/feishin from discord and not lastfm (offline fallback) */,

  DEFAULT_STATUS_TEXT: z.string().optional().default("hiii"),
  DEFAULT_STATUS_EMOJI: z.emoji().optional().default("🐬"),

  MUSIC_TEXT: z.string().optional().default("{{artist}} - {{song}}"),
  MUSIC_EMOJI: z.emoji().optional().default("🎧"),

  CODING_TEXT: z.string().optional().default("Coding!"),
  CODING_EMOJI: z.emoji().optional().default("💻"),

  PLAYING_TEXT: z.string().optional().default("Playing {{name}}"),
  PLAYING_EMOJI: z.emoji().optional().default("🎮"),

  SHOW_MUSIC_TIME: z.coerce.boolean().optional().default(true),
  SHOW_ACTIVITY_TIME: z.coerce.boolean().optional().default(true),

  ONLINE_STATUS: statusSchema
    .optional()
    .default("online") /* online but not doing anything */,
  ACTIVITY_STATUS: statusSchema
    .optional()
    .default("online") /* shows when online and playing */,
  MUSIC_STATUS: statusSchema
    .optional()
    .default("online") /* shows when online and listening to spotify/feishin */,
  OFFLINE_MUSIC_STATUS: statusSchema
    .optional()
    .default("idle") /* this shows when listening to last.fm and NOT online */,
  OFFLINE_ACTIVITY_STATUS: statusSchema
    .optional()
    .default("invisible") /* this shows when offline AND not listening to last.fm */,
};

export const env = createEnv({
  server: envSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
