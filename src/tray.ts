import { readFileSync } from "node:fs";
import { env, envPathIfWindows, logFilePath } from "./env";
import { hexToTerminal, Logger } from "./logger";
import iconPath from "../assets/tray-icon.ico" with { type: "file" };

function loadIcon(): string {
  try {
    return readFileSync(iconPath).toString("base64");
  } catch {
    return "";
  }
}

let systray: any;
if (env.RUN_MODE === "windows_exe") {
  const logger = new Logger(`${hexToTerminal("#400800")}[systray]${Logger.resetColor}`);
  try {
    const SysTray = await import("systray").then(
      (e) => (e.default as unknown as { default: typeof e.default }).default,
    );
    const open = await import("open").then((e) => e.default);

    systray = new SysTray({
      menu: {
        icon: loadIcon(),
        title: "FluxerRPC",
        tooltip: "FluxerRPC",
        items: [
          {
            title: "FluxerRPC",
            tooltip: "",
            checked: false,
            enabled: false,
          },
          {
            title: "Open config file",
            tooltip: "",
            checked: false,
            enabled: true,
          },
          {
            title: "Open logs",
            tooltip: "",
            checked: false,
            enabled: true,
          },
          {
            title: "GitHub",
            tooltip: "",
            checked: false,
            enabled: true,
          },
          {
            title: "Exit",
            tooltip: "",
            checked: false,
            enabled: true,
          },
        ],
      },
      debug: false,
      copyDir: false,
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

          case "Open logs":
            open(logFilePath);
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
    logger.info("tray ready!");
  } catch (e) {
    logger.error("Failed to initialize tray:", e);
  }
}

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
