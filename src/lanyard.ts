import { env } from "./env";
import { hexToTerminal, Logger } from "./logger";

export interface LanyardSpotify {
  track_id: string;
  timestamps: {
    start: number;
    end: number;
  };
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
  details?: string;
  state?: string;
}

export interface LanyardActivity {
  name: string;
  type: number;
  typeName: string;
  details?: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    large_text?: string;
    large_image?: string;
  };
  artist: string;
  song: string;
  album: string;
  albumArt: string;
}

export interface LanyardPresence {
  active_on_discord_mobile: boolean;
  active_on_discord_desktop: boolean;
  listening_to_spotify: boolean;
  spotify: LanyardSpotify | null;
  discord_user: {
    username: string;
    public_flags: number;
    id: string;
    discriminator: string;
    avatar: string;
  };
  discord_status: string;
  activities: LanyardActivity[];
  kv: Record<string, string>;
}

export interface DiscordPresence {
  isOnline: boolean;
  other: LanyardActivity[];
  spotifyInfo: {
    songName: string;
    artistName: string;
    start: number | undefined;
    end: number | undefined;
  } | null;
  status: "online" | "idle" | "dnd" | "invisible";
  count: number;
}

enum LanyardOpcode {
  Event = 0,
  Hello = 1,
  Initialize = 2,
  Heartbeat = 3,
}

interface LanyardMessage {
  op: LanyardOpcode;
  t?: string;
  d?: any;
  seq?: number;
}

const logger = new Logger(`${hexToTerminal("#faf")}[lanyard]${Logger.resetColor}`);

let ws: WebSocket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let currentPresence: LanyardPresence | null = null;
let onPresenceUpdate: (() => void) | null = null;

export function onLanyardUpdate(callback: () => void) {
  onPresenceUpdate = callback;
}

function getActivityTypeName(type: number): string {
  switch (type) {
    case 0:
      return "Playing";
    case 1:
      return "Streaming";
    case 2:
      return "Listening to";
    case 3:
      return "Watching";
    case 4:
      return "Custom";
    case 5:
      return "Competing";
    default:
      return "Unknown";
  }
}

function normalizeActivity(activity: LanyardActivity): LanyardActivity {
  return {
    ...activity,
    typeName: getActivityTypeName(activity.type),
    artist: "",
    song: "",
    album: "",
    albumArt: "",
  };
}

export function listenToLanyard(discordId: string) {
  ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.onopen = () => {
    logger.info("connected to lanyard!!");
  };

  ws.onmessage = (event) => {
    const message: LanyardMessage = JSON.parse(event.data);

    switch (message.op) {
      case LanyardOpcode.Hello: {
        const heartbeatIntervalMs = message.d.heartbeat_interval;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          ws?.send(JSON.stringify({ op: LanyardOpcode.Heartbeat }));
        }, heartbeatIntervalMs);
        ws?.send(
          JSON.stringify({
            op: LanyardOpcode.Initialize,
            d: { subscribe_to_id: discordId },
          }),
        );
        break;
      }

      case LanyardOpcode.Event:
        if (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE") {
          currentPresence = message.d;
          onPresenceUpdate?.();
        }
        break;
    }
  };

  ws.onclose = (e) => {
    logger.info("reconnecting to lanyard...", e.code);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    setTimeout(() => listenToLanyard(discordId), 5000);
  };

  ws.onerror = (e) => {
    logger.error("lanyard socket error:", e);
  };
}

export function getDiscordPresence(): DiscordPresence | null {
  if (!currentPresence) {
    return null;
  }

  const discordStatus = currentPresence.discord_status;
  const activities = currentPresence.activities || [];
  const spotify = currentPresence.spotify;

  const miscOther = activities.filter(
    (e) => !["spotify", ...env.MUSIC_APPS].includes(e.name.toLowerCase()),
  );

  let spotifyInfo = null;
  if (spotify) {
    spotifyInfo = {
      songName: spotify.song,
      artistName: spotify.artist,
      start: spotify.timestamps.start,
      end: spotify.timestamps.end,
    };
  }

  const customMusicActivity = activities.find((e) =>
    env.MUSIC_APPS.includes(e.name.toLowerCase()),
  );

  if (customMusicActivity) {
    spotifyInfo = {
      songName: customMusicActivity.details ?? "?",
      artistName: customMusicActivity.state ?? "?",
      start: customMusicActivity.timestamps?.start,
      end: customMusicActivity.timestamps?.end,
    };
  }

  return {
    status: discordStatus as DiscordPresence["status"],
    isOnline: discordStatus !== "offline",
    other: miscOther.map(normalizeActivity),
    spotifyInfo,
    count: miscOther.length + (spotifyInfo ? 1 : 0),
  };
}
