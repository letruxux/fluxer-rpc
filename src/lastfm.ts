import ky from "ky";
import { env } from "./env";
import { Logger, hexToTerminal } from "./logger";

const logger = new Logger(`${hexToTerminal("#d51007")}[last.fm]${Logger.resetColor}`);

export async function getLastFmNowPlaying() {
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

    return {
      songName: track.name,
      artistName: track.artist["#text"],
      url: track.url,
    };
  } catch (e) {
    logger.error("lastfm error:", e);
    return null;
  }
}
