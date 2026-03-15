import ky from "ky";
import {
  Client,
  type GatewayPresenceUpdateData,
} from "fluxer-selfbot"; /* i dont trust this lib at all */
import { listenToLanyard, getDiscordPresence, setOnPresenceUpdate } from "./lanyard";
import { env, envPathIfWindows } from "./env";
import {
  append,
  useTemplate,
  parenthesize,
  timePassedToString,
  calculateTimer,
} from "./utils";
import type { System } from "typescript";
import open from "open";

let systray: any;
if (env.RUN_MODE === "windows_exe") {
  try {
    const SysTray = await import("systray").then(
      (e) => (e.default as unknown as { default: typeof e.default }).default,
    );

    systray = new SysTray({
      menu: {
        icon: /* base64 */ "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
        // you should using .png icon in macOS/Linux, but .ico format in windows
        title: "FluxerRPC",
        tooltip: "",
        items: [
          {
            title: "Open config file",
            tooltip: "bb",
            // checked is implement by plain text in linux
            checked: false,
            enabled: true,
          },
          {
            title: "GitHub",
            tooltip: "bb",
            checked: false,
            enabled: true,
          },
          {
            title: "Exit",
            tooltip: "bb",
            checked: false,
            enabled: true,
          },
        ],
      },
      debug: false,
      copyDir: false, // copy go tray binary to outside directory, useful for packing tool like pkg.
    });

    systray.onClick(
      ({
        item,
      }: {
        type: "clicked";
        item: { title: string; tooltip: string; checked: boolean; enabled: boolean };
        seq_id: number;
      }) => {
        switch (item.title) {
          case "Open config file":
            open(envPathIfWindows);
            break;

          case "Exit":
            process.exit(0);

          case "GitHub":
            open("https://github.com/letruxux/fluxer-rpc");
            break;

          default:
            break;
        }
      },
    );
  } catch (e) {
    console.error("Failed to initialize tray:", e);
  }
}

const client = new Client({ intents: 0 });
let lastTextContent: string | undefined;
let lastTimerData: number | undefined;

process.on("exit", () => {
  if (systray) {
    systray.kill();
  }
});

process.on("SIGINT", () => {
  if (systray) {
    systray.kill();
  }
  process.exit(0);
});

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

function setPresence(load: GatewayPresenceUpdateData) {
  if (!client.user) {
    console.log("user still loading...");
    return;
  }

  const text = load.custom_status?.text ?? "";
  const { textWithNoTimer, timer } = calculateTimer(text);

  const contentChanged = textWithNoTimer !== lastTextContent;
  const timerChanged = timer !== undefined && timer !== lastTimerData;

  if (!contentChanged && !timerChanged) {
    console.log("same presence");
    return;
  }

  if (process.argv.includes("--dry")) {
    console.log("set presence to:", load);
    lastTextContent = textWithNoTimer;
    if (timer !== undefined) lastTimerData = timer;
    return;
  }

  client.user.setPresence(load).then(() => {
    console.log("set presence to:", load);
    lastTextContent = textWithNoTimer;
    if (timer !== undefined) lastTimerData = timer;
  });
}

async function update() {
  try {
    if (!client.user) return;

    const [discord, lastfmInfo] = await Promise.all([
      Promise.resolve(getDiscordPresence()),
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
        const startTime = other.timestamps?.start
          ? new Date(other.timestamps.start)
          : null;
        const now = new Date();
        const timePassed = startTime ? now.getTime() - startTime.getTime() : 0;
        const timePassedStr =
          env.SHOW_ACTIVITY_TIME &&
          startTime &&
          parenthesize(timePassedToString(timePassed));

        const text =
          other.name === "Visual Studio Code"
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
  listenToLanyard(env.DISCORD_ID);
  setOnPresenceUpdate(update);
});

client.login(env.TOKEN);
