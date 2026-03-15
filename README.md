# discord + last.fm to fluxer RPC

| ![](/assets/music.webp) | ![](/assets/vsc.webp) | ![](/assets/game.webp) |
| ----------------------- | --------------------- | ---------------------- |

## setup

setup environment variables: read [.env.example](./.env.example)

> [!IMPORTANT]  
> this project uses [lanyard](https://github.com/Phineas/lanyard), join their server to use it!

> [!NOTE]  
> here's how to get your fluxer token: [read](https://gist.github.com/letruxux/f1a730c7f69bd1ca532e1b33de8f9633)

## run

with docker: `docker run -d --env-file .env ghcr.io/letruxux/fluxer-rpc:latest`

with [bun](https://bun.sh): `bun i`, `bun start`
