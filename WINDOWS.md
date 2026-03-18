# wow windows support!

## build exe

must have [bun](https://bun.sh) installed

```sh
bun i
bun exe
# fluxer-rpc.exe, move it to shell:startup
```

## config

config path:

```sh
%LOCALAPPDATA%/fluxer-rpc/.env
```

change variables there, then the exe will run in the tray (no icon yet)

## notes

- offline obviously won't work since this only runs if your pc is on
- not making this easier to run since i don't think its that used anyway
