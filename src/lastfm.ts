import ky from "ky";
import { env } from "./env";
import { Logger, hexToTerminal } from "./logger";

const logger = new Logger(`${hexToTerminal("#d51007")}[last.fm]${Logger.resetColor}`);

let lastFmNowPlaying: {
  songName: string;
  artistName: string;
  url: string;
} | null = null;

export function getLastFmNowPlaying() {
  return lastFmNowPlaying;
}

const listeners: (() => void)[] = [];

export async function updateLastFmNowPlaying() {
  if (!env.LASTFM_USER || !env.LASTFM_KEY) return null;
  try {
    const data = await ky
      .get("https://ws.audioscrobbler.com/2.0/", {
        searchParams: {
          method: "user.getrecenttracks",
          user: env.LASTFM_USER,
          api_key: env.LASTFM_KEY,
          limit: "1",
          format: "json",
        },
      })
      .json<any>();

    const track = data.recenttracks?.track?.[0];
    if (!track || !track["@attr"]?.nowplaying) return null;

    const result: typeof lastFmNowPlaying = {
      songName: track.name,
      artistName: track.artist["#text"],
      url: track.url,
    };

    lastFmNowPlaying = result;
    listeners.forEach((e) => e());
    return result;
  } catch (e) {
    logger.error("lastfm error:", e);
    /* i dont think i should set it to null here because its probably just lastfm being shit as always */
    return null;
  }
}

export function onLastFmUpdate(callback: () => void) {
  listeners.push(callback);
}
