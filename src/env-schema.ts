import z from "zod";

export const statusSchema = z.enum(["online", "idle", "dnd", "invisible"]);

export const ENV_VAR_GROUPS: Record<string, string[]> = {
  required: ["TOKEN", "DISCORD_ID"],

  "last.fm (only used when offline on discord) *": [
    "CHECK_LASTFM_WHEN_ONLINE",
    "LASTFM_USER",
    "LASTFM_KEY",
    "LASTFM_UPDATE_INTERVAL_SECONDS",
  ],

  "default status": [
    "ENABLE_DEFAULT_STATUS",
    "DEFAULT_STATUS_TEXT",
    "DEFAULT_STATUS_EMOJI",
  ],

  music: ["MUSIC_TEXT", "MUSIC_EMOJI", "MUSIC_APPS", "SHOW_MUSIC_TIME"],

  coding: ["CODING_TEXT", "CODING_EMOJI", "CODING_APPS"],

  playing: ["PLAYING_TEXT", "PLAYING_EMOJI"],

  "priorities (lower is more important)": [
    "MUSIC_PRIORITY",
    "CODING_PRIORITY",
    "PLAYING_PRIORITY",
  ],

  [`statuses (allowed: ${statusSchema.options.join(", ")})`]: [
    "MIRROR_STATUS_FROM_DISCORD",
    "ONLINE_STATUS",
    "ACTIVITY_STATUS",
    "MUSIC_STATUS",
    "OFFLINE_MUSIC_STATUS",
    "OFFLINE_ACTIVITY_STATUS",
  ],

  settings: ["SHOW_ACTIVITY_TIME", "TIMER_UPDATE_INTERVAL_SECONDS", "ROUND_TO_5_SECONDS"],
};

export const envSchema = {
  TOKEN: z.string(),
  DISCORD_ID: z.string(),

  CHECK_LASTFM_WHEN_ONLINE: z
    .stringbool()
    .optional()
    .default(false)
    .describe(
      "* this makes it so that it fetches last.fm even if online (might want to use this if your player doesn't have rich presence)",
    ),

  LASTFM_USER: z.string().optional(),

  LASTFM_KEY: z.string().optional(),

  RUN_MODE: z
    .enum(["windows_exe", "docker", "bun"])
    .optional()
    .default("bun")
    .describe("runtime environment (do not override this)"),

  ENABLE_DEFAULT_STATUS: z
    .stringbool()
    .optional()
    .default(true)
    .describe("if false, disables the default status"),

  DEFAULT_STATUS_TEXT: z.string().optional().default("hiii"),
  DEFAULT_STATUS_EMOJI: z.emoji().optional().default("🐬"),

  MUSIC_TEXT: z.string().optional().default("{{artist}} - {{song}}"),
  MUSIC_EMOJI: z.emoji().optional().default("🎧"),
  MUSIC_APPS: z
    .string()
    .optional()
    .default("feishin,meld,metrolist")
    .transform((str) => str.split(",").map((e) => e.trim().toLowerCase()))
    .describe("other apps to count as music status (other than spotify)"),
  MUSIC_PRIORITY: z.coerce.number().optional().default(0),

  CODING_TEXT: z.string().optional().default("Coding!"),
  CODING_EMOJI: z.emoji().optional().default("💻"),
  CODING_APPS: z
    .string()
    .optional()
    .default("visual studio code,intellij idea,intellij idea community")
    .transform((str) => str.split(",").map((e) => e.trim().toLowerCase()))
    .describe("apps to count as coding status"),
  CODING_PRIORITY: z.coerce.number().optional().default(2),

  PLAYING_TEXT: z.string().optional().default("{{action}} {{name}}"),
  PLAYING_EMOJI: z.emoji().optional().default("🎮"),
  PLAYING_PRIORITY: z.coerce.number().optional().default(1),

  SHOW_MUSIC_TIME: z.stringbool().optional().default(false),
  SHOW_ACTIVITY_TIME: z
    .stringbool()
    .optional()
    .default(true)
    .describe('"activity" means coding OR playing OR literally anything else'),

  ONLINE_STATUS: statusSchema
    .optional()
    .default("online")
    .describe("shown when online and idle"),

  ACTIVITY_STATUS: statusSchema
    .optional()
    .default("online")
    .describe("shown when online and playing"),

  MUSIC_STATUS: statusSchema
    .optional()
    .default("online")
    .describe("shown when listening to spotify/feishin"),

  OFFLINE_MUSIC_STATUS: statusSchema
    .optional()
    .default("idle")
    .describe("shown when offline but listening to last.fm"),

  OFFLINE_ACTIVITY_STATUS: statusSchema
    .optional()
    .default("invisible")
    .describe("shown when offline and not listening to last.fm"),

  MIRROR_STATUS_FROM_DISCORD: z
    .stringbool()
    .optional()
    .default(false)
    .describe(
      "if enabled, mirrors discord status (online, offline, idle, dnd) except for when offline listening from last.fm. the following settings will be ignored if this is enabled!",
    ),

  TIMER_UPDATE_INTERVAL_SECONDS: z.coerce
    .number()
    .min(5)
    .optional()
    .default(30)
    .describe("how often timers update"),

  LASTFM_UPDATE_INTERVAL_SECONDS: z.coerce
    .number()
    .optional()
    .default(30)
    .describe("how often last.fm updates"),

  ROUND_TO_5_SECONDS: z
    .stringbool()
    .optional()
    .default(true)
    .describe("rounds timers to fancy multiple of 5 numbers"),
};
