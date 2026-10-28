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

function headers(origin: string) {
  return {
    Authorization: env.TOKEN,
    "Content-Type": "application/json",
    Origin: origin,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.235 Safari/537.36",
  };
}

const SETTINGS_ENDPOINT = "users/@me/settings";

async function getInstanceUrls(instanceUrl: string) {
  const startTime = Date.now();
  logger.dim(`Fetching instance configuration... (${new URL(instanceUrl).hostname})`);

  const resp = await fetch(instanceUrl + "/.well-known/fluxer", {
    redirect: "follow",
  }).catch(() => null);
  if (!resp || !resp.ok) {
    logger.error(`Couldn't fetch this instance's configuration. ${resp?.status ?? ""}`);
    process.exit(1);
  }

  const json = (await resp.json()) as any;
  const apiUrl = json?.endpoints?.api_client ?? null;
  const appUrl = json?.endpoints?.webapp ?? null;
  if (!apiUrl || typeof apiUrl !== "string") {
    logger.error("Couldn't find this instance's API url.");
    process.exit(1);
  }

  logger.dim(`Instance API: ${apiUrl} (${Math.floor(Date.now() - startTime)}ms)`);
  return { apiUrl, appUrl };
}

const logger = new Logger(`${hexToTerminal("#413cdd")}[fluxer api]${Logger.resetColor}`);

const instanceUrls = await getInstanceUrls(env.INSTANCE_URL);

const rest = ky.create({
  prefix: instanceUrls.apiUrl + "/v1",
  headers: headers(instanceUrls.appUrl),
});

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
  const res = await rest.get(SETTINGS_ENDPOINT, { throwHttpErrors: false });

  if (!res.ok) {
    logger.error("invalid token! (or can't connect to fluxer)");
    logger.error(`${res.status} ${res.statusText} - ${await res.text()}`);
    process.exit(1);
  }
}
