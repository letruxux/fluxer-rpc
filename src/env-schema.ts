import z from "zod";

export const statusSchema = z.enum(["online", "idle", "dnd", "invisible"]);

export const multipleActivityStyles = z.object({
  plusCount: z.string().describe("(+1)"),
  plusEmoji: z.string().describe("(+🎧)"),
  emoji: z.string().describe("(🎧)"),
  none: z.string().describe(""),
});

const multipleActivityHelpString = `allowed: ${Object.keys(multipleActivityStyles.shape)
  .map((e) => `"${e}"`)
  .join(", ")}
#  plusEmoji - 🎮 Playing GAME (15:00) (+🎧)
#  emoji - 🎮 Playing GAME (15:00) (🎧)
#  plusCount - 🎮 Playing GAME (15:00) (+1)
`;

type MultipleActivityStyles = z.infer<typeof multipleActivityStyles>;
export type MultipleActivityType = keyof MultipleActivityStyles;

export const snowflakeSchema = z.string().regex(/^\d{17,20}$/);

export const fluxerEmojiSchema = z.union([z.emoji(), snowflakeSchema]);

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

  music: ["MUSIC_TEXT", "MUSIC_EMOJI", "SHOW_MUSIC_TIME"],

  coding: ["CODING_TEXT", "CODING_EMOJI", "CODING_APPS"],

  playing: ["PLAYING_TEXT", "PLAYING_EMOJI"],

  "priorities (lower is more important)": [
    "MUSIC_PRIORITY",
    "CODING_PRIORITY",
    "PLAYING_PRIORITY",
  ],

  "multiple activities": ["SHOW_MULTIPLE_ACTIVITIES", "MULTIPLE_ACTIVITIES_STYLE"],

  [`statuses (allowed: ${statusSchema.options.join(", ")})`]: [
    "MIRROR_STATUS_FROM_DISCORD",
    "ONLINE_STATUS",
    "ACTIVITY_STATUS",
    "MUSIC_STATUS",
    "OFFLINE_MUSIC_STATUS",
    "OFFLINE_ACTIVITY_STATUS",
  ],

  settings: ["SHOW_ACTIVITY_TIME", "TIMER_UPDATE_INTERVAL_SECONDS", "ROUND_TO_SECONDS"],
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
  DEFAULT_STATUS_EMOJI: fluxerEmojiSchema.optional().default("🐬"),

  MUSIC_TEXT: z.string().optional().default("{{artist}} - {{song}}"),
  MUSIC_EMOJI: fluxerEmojiSchema.optional().default("🎧"),
  MUSIC_APPS: z
    .string()
    .optional()
    .describe(
      "other apps to count as music status (other than spotify) - UNUSED - DEPRECATED",
    ),
  MUSIC_PRIORITY: z.coerce.number().optional().default(0),

  CODING_TEXT: z.string().optional().default("Coding!"),
  CODING_EMOJI: fluxerEmojiSchema.optional().default("💻"),
  CODING_APPS: z
    .string()
    .optional()
    .default("visual studio code,intellij idea,intellij idea community,vscodium,zed")
    .transform((str) => str.split(",").map((e) => e.trim().toLowerCase()))
    .describe("apps to count as coding status"),
  CODING_PRIORITY: z.coerce.number().optional().default(2),

  PLAYING_TEXT: z.string().optional().default("{{action}} {{name}}"),
  PLAYING_EMOJI: fluxerEmojiSchema.optional().default("🎮"),
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
    .describe(
      "rounds timers to fancy multiple of 5 numbers - DEPRECATED",
    ) /* deprecated but still works */,

  ROUND_TO_SECONDS: z.coerce
    .number()
    .optional()
    .default(5)
    .describe("rounds timers to multiple of ... - set to 0 to disable"),

  SHOW_MULTIPLE_ACTIVITIES: z
    .stringbool()
    .optional()
    .default(true)
    .describe(
      "if enabled, shows multiple activities in the status (and follows MULTIPLE_ACTIVITIES_STYLE)",
    ),

  MULTIPLE_ACTIVITIES_STYLE: z
    .enum(["plusCount", "plusEmoji", "emoji", "none"])
    .optional()
    .default("plusCount")
    .describe(multipleActivityHelpString),

  WATCHING_EMOJI: fluxerEmojiSchema.optional().default("📺"),
} as const;
