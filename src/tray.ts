import { env, envPathIfWindows } from "./env";

let systray: any;
if (env.RUN_MODE === "windows_exe") {
  try {
    const SysTray = await import("systray").then(
      (e) => (e.default as unknown as { default: typeof e.default }).default,
    );
    const open = await import("open").then((e) => e.default);

    systray = new SysTray({
      menu: {
        icon: /* base64 */ "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
        // you should using .png icon in macOS/Linux, but .ico format in windows
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
