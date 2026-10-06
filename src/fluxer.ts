import ky from "ky";
import { env } from "./env";
import { hexToTerminal, Logger } from "./logger";
import { presencePayloadToString } from "./presence";
import { snowflakeSchema } from "./env-schema";

export type GatewayPresenceUpdateData = {
  since?: number | null;
  activities?: Array<{
    name: string;
    type: number;
    url?: string | null;
  }>;
  custom_status?: {
    text?: string | null;
    emoji_name?: string | null;
    emoji_id?: string | null;
  } | null;
  status: "online" | "idle" | "dnd" | "invisible";
  afk?: boolean;
};

interface FluxerError {
  code: string;
  message: string;
  errors: {
    path: string;
    message: string;
    code: string;
  }[];
}

const headers = {
  Authorization: env.TOKEN,
  "Content-Type": "application/json",
  Origin: "https://web.fluxer.app",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) fluxer_app/0.0.8 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
};

const SETTINGS_ENDPOINT = "users/@me/settings";

const rest = ky.create({
  prefix: "https://web.fluxer.app/api/v1",
  headers,
});

const logger = new Logger(`${hexToTerminal("#413cdd")}[fluxer api]${Logger.resetColor}`);

function isSnowflake(str: string) {
  return snowflakeSchema.safeParse(str).success;
}

export async function sendPresenceUpdate(load: GatewayPresenceUpdateData) {
  try {
    if ((load.status as any) === "offline") {
      load.status = "invisible";
    }

    if (load.custom_status && isSnowflake(load.custom_status.emoji_name ?? "")) {
      load.custom_status.emoji_id = load.custom_status.emoji_name;
      delete load.custom_status.emoji_name;
    }

    const res = await rest.patch(SETTINGS_ENDPOINT, {
      json: load,
      throwHttpErrors: false,
    });

    if (!res.ok) {
      const err = (await res.json()) as FluxerError;

      if (err.errors.find((e) => e.code === "PREMIUM_REQUIRED_FOR_CUSTOM_EMOJI")) {
        logger.error(
          "To use custom emojis you need a Fluxer account with Plutonium. Exiting...",
        );
        process.exit(1);
      }

      logger.error("http error sending presence update:", err);
    }

    logger.info("updated presence to", presencePayloadToString(load));
  } catch (e) {
    logger.error("error sending presence update:", e);
  }
}

export async function checkToken() {
  const res = await rest.get(SETTINGS_ENDPOINT);

  if (!res.ok) {
    logger.error("invalid token! (or can't connect to fluxer)");
    process.exit(1);
  }
}
