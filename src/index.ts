import ky from "ky";
import {
  Client,
  type GatewayPresenceUpdateData,
} from "fluxer-selfbot"; /* i dont trust this lib at all */
import { type RawUserPresenceResponse } from "./types";
import { env } from "./env";

/* been getting weird ssl https errors so this will do */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.BUN_SSL_NO_VERIFY = "1";

const client = new Client({ intents: 0 });

async function getDiscordPresence() {
  const presence = await ky
    .get(`http://discord-presence-api.johnrich.dev/user/${env.DISCORD_ID}`)
    .json<RawUserPresenceResponse>();

  const miscOther = presence.activities.filter(
    (e) => !["Spotify", "Feishin"].includes(e.name),
  );

  const _spotify = presence.activities.find((e) => e.name === "Spotify");
  const _feishin = presence.activities.find((e) => e.name === "Feishin");
  const music = _spotify || _feishin;

  let spotifyInfo = null;
  if (music) {
    spotifyInfo = {
      songName: music.details,
      artistName: music.state,
      start: music.timestamps.start,
      end: music.timestamps.end,
    };
  }

  return {
    isOnline: presence.status !== "offline",
    other: miscOther,
    spotifyInfo,
  };
}

function timePassedToString(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function getLastFmNowPlaying() {
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
    if (!track) return null;
    const nowPlaying = !!track["@attr"]?.nowplaying;
    if (!nowPlaying) return null;

    return {
      songName: track.name,
      artistName: track.artist["#text"],
      url: track.url,
    };
  } catch (e) {
    console.error("lastfm error:", e);
    return null;
  }
}

let lastPresence: object | undefined;

function setPresence(load: GatewayPresenceUpdateData) {
  if (!client.user) {
    console.log("user still loading...");
    return;
  }
  if (JSON.stringify(lastPresence) === JSON.stringify(load)) {
    console.log("same presence");
    return;
  }
  client.user.setPresence(load).then(() => {
    console.log("set presence to:", load);
    lastPresence = load;
  });
}

function append(...args: (string | false | undefined | null)[]) {
  return args.filter((e) => e).join(" ");
}

function parenthesize(str: string) {
  return str ? `(${str})` : null;
}

function useTemplate(template: string, data: Record<string, string>) {
  return template.replaceAll(/{{(\w+)}}/g, (_, key) => data[key] ?? "");
}

async function update() {
  try {
    if (!client.user) return;

    const [discord, lastfmInfo] = await Promise.all([
      getDiscordPresence().catch(() => null),
      getLastFmNowPlaying().catch(() => null),
    ]);

    if (discord && discord.isOnline) {
      /* discord music */
      const musicInfo = discord.spotifyInfo
        ? {
            song: discord.spotifyInfo.songName,
            artist: discord.spotifyInfo.artistName,
            start: discord.spotifyInfo.start,
            end: discord.spotifyInfo.end,
          }
        : env.CHECK_LASTFM_WHEN_ONLINE && lastfmInfo
          ? {
              song: lastfmInfo.songName,
              artist: lastfmInfo.artistName,
            }
          : null;

      if (musicInfo) {
        const timeString = (() => {
          if (!musicInfo.start || !musicInfo.end) return null;
          /* this sucks :p */
          const start = new Date(musicInfo.start);
          const end = new Date(musicInfo.end);
          const currentTimePassed = end.getTime() - start.getTime();
          const endTimePassed = end.getTime() - new Date().getTime();
          const timePassed = currentTimePassed - endTimePassed;
          const stimePassedStr = timePassedToString(timePassed);
          const timePassedStr = timePassedToString(currentTimePassed);

          return env.SHOW_MUSIC_TIME && `(${stimePassedStr}/${timePassedStr})`;
        })();

        setPresence({
          status: env.MUSIC_STATUS,
          custom_status: {
            text: append(
              useTemplate(env.MUSIC_TEXT, {
                artist: musicInfo.artist,
                song: musicInfo.song,
              }),
              timeString,
            ),
            emoji_name: env.MUSIC_EMOJI,
          },
        });
        return;
      }

      /* discord game */
      const otherOrdered = discord.other.sort((a, b) => {
        if (a.name === "Visual Studio Code") return -1;
        return 1;
      });

      if (otherOrdered.length > 0 && otherOrdered[0]) {
        const other = otherOrdered[0];
        const startTime = new Date(other.timestamps.start);
        const now = new Date();
        const timePassed = now.getTime() - startTime.getTime();
        const timePassedStr =
          env.SHOW_ACTIVITY_TIME && parenthesize(timePassedToString(timePassed));

        const text =
          other.name === "Visual Studio Code"
            ? append(env.CODING_TEXT, timePassedStr)
            : append(useTemplate(env.PLAYING_TEXT, { name: other.name }), timePassedStr);

        const emoji =
          other.name === "Visual Studio Code" ? env.CODING_EMOJI : env.PLAYING_EMOJI;

        setPresence({
          status: env.ACTIVITY_STATUS,
          custom_status: {
            text,
            emoji_name: emoji,
          },
        });
        return;
      }

      /* default */
      setPresence({
        status: env.ONLINE_STATUS,
        custom_status: {
          text: env.DEFAULT_STATUS_TEXT,
          emoji_name: env.DEFAULT_STATUS_EMOJI,
        },
      });
      return;
    }

    /* offline... lets test lastfm */
    if (lastfmInfo) {
      setPresence({
        status: env.OFFLINE_MUSIC_STATUS,
        custom_status: {
          text: useTemplate(env.MUSIC_TEXT, {
            artist: lastfmInfo.artistName,
            song: lastfmInfo.songName,
          }),
          emoji_name: env.MUSIC_EMOJI,
        },
      });
      return;
    }

    /* okaty bye */
    setPresence({ status: env.OFFLINE_ACTIVITY_STATUS, custom_status: null });
    console.log("OFFLINE");
  } catch (e) {
    console.error("update error:", e);
  }
}

client.on("ready", async () => {
  console.log("READY");
  while (true) {
    await update();
    await new Promise((res) => setTimeout(res, 30_000));
  }
});

client.login(env.TOKEN);
