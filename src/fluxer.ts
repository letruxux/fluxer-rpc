import ky from "ky";
import { env } from "./env";
import { hexToTerminal, Logger } from "./logger";
import { presencePayloadToString } from "./presence";

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

const headers = {
  Authorization: env.TOKEN,
  "Content-Type": "application/json",
  Origin: "https://web.fluxer.app",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) fluxer_app/0.0.8 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36",
};

const SETTINGS_ENDPOINT = "users/@me/settings";

const rest = ky.create({
  prefixUrl: "https://web.fluxer.app/api/v1",
  headers,
});

const logger = new Logger(`${hexToTerminal("#413cdd")}[fluxer api]${Logger.resetColor}`);

export async function sendPresenceUpdate(load: GatewayPresenceUpdateData) {
  try {
    if ((load.status as any) === "offline") {
      load.status = "invisible";
    }
    const res = await rest.patch(SETTINGS_ENDPOINT, {
      json: load,
      throwHttpErrors: false,
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error("http error sending presence update:", text);
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
