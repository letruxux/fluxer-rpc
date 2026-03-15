import ky from "ky";
import { Client, type GatewayPresenceUpdateData } from "fluxer-selfbot";
import { type RawUserPresenceResponse } from "./types";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.BUN_SSL_NO_VERIFY = "1";

const token = process.env.TOKEN;
if (!token) throw new Error("No token");
const dsId = process.env.DISCORD_ID;
if (!dsId) throw new Error("No DISCORD_ID");
const lastfmUser = process.env.LASTFM_USER;
if (!lastfmUser) throw new Error("No LASTFM_USER");
const lastfmKey = process.env.LASTFM_KEY;
if (!lastfmKey) throw new Error("No LASTFM_KEY");

const client = new Client({ intents: 0 });

async function getDiscordPresence() {
  const presence = await ky
    .get(`http://discord-presence-api.johnrich.dev/user/${dsId}`)
    .json<RawUserPresenceResponse>();

  const miscOther = presence.activities.filter(
    (e) => !["Spotify", "Feishin"].includes(e.name),
  );

  const _spotify = presence.activities.find((e) => e.name === "Spotify");
  const _feishin = presence.activities.find((e) => e.name === "Feishin");

  let spotifyInfo = null;
  if (_spotify) {
    spotifyInfo = {
      songName: _spotify.details,
      artistName: _spotify.state,
      start: _spotify.timestamps.start,
      end: _spotify.timestamps.end,
    };
  } else if (_feishin) {
    spotifyInfo = {
      songName: _feishin.details,
      artistName: _feishin.state,
      start: _feishin.timestamps.start,
      end: _feishin.timestamps.end,
    };
  }

  return {
    isOnline: presence.status !== "offline",
    other: miscOther,
    spotifyInfo,
  };
}

function timePassedToString(ms: number) {
  return `${Math.floor(ms / 1000 / 60)}:${(Math.floor(ms / 1000) % 60)
    .toString()
    .padStart(2, "0")}`;
}

async function getLastFmNowPlaying() {
  try {
    const data = await ky
      .get("https://ws.audioscrobbler.com/2.0/", {
        searchParams: {
          method: "user.getrecenttracks",
          user: lastfmUser,
          api_key: lastfmKey,
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

function setPresence(load: GatewayPresenceUpdateData) {
  console.log("SET PRESENCE TO", load);
  client.user?.setPresence(load);
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
      if (discord.spotifyInfo) {
        const start = new Date(discord.spotifyInfo.start);
        const end = new Date(discord.spotifyInfo.end);
        const currentTimePassed = end.getTime() - start.getTime();
        const endTimePassed = end.getTime() - new Date().getTime();
        const timePassed = currentTimePassed - endTimePassed;
        const stimePassedStr = timePassedToString(timePassed);
        const timePassedStr = timePassedToString(currentTimePassed);
        setPresence({
          status: "online",
          custom_status: {
            text: `${discord.spotifyInfo.artistName} - ${discord.spotifyInfo.songName} (${stimePassedStr}/${timePassedStr})`,
            emoji_name: "🎧",
          },
        });
        return;
      }

      /* discord game */
      if (discord.other.length > 0 && discord.other[0]) {
        const other = discord.other[0];
        const startTime = new Date(other.timestamps.start);
        const now = new Date();
        const timePassed = now.getTime() - startTime.getTime();

        setPresence({
          status: "online",
          custom_status: {
            text: `Playing ${other.name} (${timePassedToString(timePassed)})`,
            emoji_name: "🎮",
          },
        });
        return;
      }

      /* default */
      setPresence({
        status: "online",
        custom_status: { text: "hiii", emoji_name: "🐬" },
      });
      return;
    }

    /* offline... lets test lastfm */
    if (lastfmInfo) {
      setPresence({
        status: "online",
        custom_status: {
          text: `${lastfmInfo.artistName} - ${lastfmInfo.songName}`,
          emoji_name: "🎵",
        },
      });
      return;
    }

    /* okaty bye */
    setPresence({ status: "invisible", custom_status: null });
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

client.login(token!);
