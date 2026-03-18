import { listenToLanyard, getDiscordPresence, setOnPresenceUpdate } from "./lanyard";
import { env } from "./env";
import { append, useTemplate, parenthesize, timePassedToString } from "./utils";
import "./tray";
import { checkToken, type GatewayPresenceUpdateData } from "./fluxer";
import { getLastFmNowPlaying } from "./lastfm";
import { logger, setPresence } from "./presence";

type PossibleStatus = {
  priority: number;
  presence: GatewayPresenceUpdateData;
};

async function update() {
  try {
    const [discord, lastfmInfo] = await Promise.all([
      Promise.resolve(getDiscordPresence()),
      getLastFmNowPlaying().catch(() => null),
    ]);

    const statuses: PossibleStatus[] = [];

    if (discord && discord.isOnline) {
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
          const start = new Date(musicInfo.start);
          const end = new Date(musicInfo.end);
          const currentTimePassed = end.getTime() - start.getTime();
          const endTimePassed = end.getTime() - new Date().getTime();
          const timePassed = currentTimePassed - endTimePassed;
          const stimePassedStr = timePassedToString(timePassed);
          const timePassedStr = timePassedToString(currentTimePassed);

          return env.SHOW_MUSIC_TIME && `(${stimePassedStr}/${timePassedStr})`;
        })();

        statuses.push({
          priority: env.MUSIC_PRIORITY,
          presence: {
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
          },
        });
      }

      for (const other of discord.other) {
        const isCoding = env.CODING_APPS.includes(other.name.toLowerCase());
        const startTime = other.timestamps?.start
          ? new Date(other.timestamps.start)
          : null;
        const now = new Date();
        const timePassed = startTime ? now.getTime() - startTime.getTime() : 0;
        const timePassedStr =
          env.SHOW_ACTIVITY_TIME &&
          startTime &&
          parenthesize(timePassedToString(timePassed));

        const text = isCoding
          ? append(env.CODING_TEXT, timePassedStr)
          : append(
              useTemplate(env.PLAYING_TEXT, {
                name: other.name,
                details: other.details || "",
                state: other.state || "",
                action: other.typeName,
              }),
              timePassedStr,
            );

        const emoji = isCoding ? env.CODING_EMOJI : env.PLAYING_EMOJI;
        const priority = isCoding ? env.CODING_PRIORITY : env.PLAYING_PRIORITY;

        statuses.push({
          priority,
          presence: {
            status: env.ACTIVITY_STATUS,
            custom_status: {
              text,
              emoji_name: emoji,
            },
          },
        });
      }

      statuses.push({
        priority: Infinity,
        presence: {
          status: env.ONLINE_STATUS,
          custom_status: env.ENABLE_DEFAULT_STATUS
            ? {
                text: env.DEFAULT_STATUS_TEXT,
                emoji_name: env.DEFAULT_STATUS_EMOJI,
              }
            : null,
        },
      });
    } else {
      if (lastfmInfo) {
        statuses.push({
          priority: env.MUSIC_PRIORITY,
          presence: {
            status: env.OFFLINE_MUSIC_STATUS,
            custom_status: {
              text: useTemplate(env.MUSIC_TEXT, {
                artist: lastfmInfo.artistName,
                song: lastfmInfo.songName,
              }),
              emoji_name: env.MUSIC_EMOJI,
            },
          },
        });
      }

      statuses.push({
        priority: Infinity,
        presence: { status: env.OFFLINE_ACTIVITY_STATUS, custom_status: null },
      });
    }

    statuses.sort((a, b) => a.priority - b.priority);
    const chosenOne = statuses[0];

    if (!chosenOne) {
      logger.dim("no status to show");
      return;
    }

    setPresence(chosenOne.presence);
    if (!discord?.isOnline && !lastfmInfo) {
      logger.dim("offline!");
    }
  } catch (e) {
    logger.error("update error:", e);
  }
}

function ready() {
  listenToLanyard(env.DISCORD_ID);
  setOnPresenceUpdate(update);

  setInterval(update, env.TIMER_UPDATE_INTERVAL_SECONDS * 1000);
}

checkToken().then(ready);
