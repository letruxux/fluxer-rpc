# Fluxer RPC

[![support](https://badges.fluxer.ltrx.lol/badge/1476277757476868234?style=for-the-badge)](https://fluxer.gg/Roi7rTTU)
![docker pulls](https://ghcr-badge.elias.eu.org/shield/letruxux/fluxer-rpc?style=for-the-badge)

| ![](/assets/music.webp) | ![](/assets/vsc.webp) | ![](/assets/game.webp) |
| ----------------------- | --------------------- | ---------------------- |

## Info

Mirror your discord rich presences to [Fluxer](https://fluxer.app)!

- Custom status for music & programming apps
- Priorities - choose what matters more
- Offline\* last.fm - show what you're listening to even when offline!

\* can be configured to also work when online

## Setup

> [!IMPORTANT]  
> This project uses [Lanyard](https://github.com/Phineas/lanyard), join their server to use it!

> [!TIP]  
> It's highly recommended to review and tweak the entire config before running, so that your presence works how you want it to!

> [!NOTE]  
> How to get your Fluxer token: [read](https://gist.github.com/letruxux/f1a730c7f69bd1ca532e1b33de8f9633)

Get the [.env.example](./.env.example) file and edit it to your likings, then move it to `.env`.

Run with Docker: `docker run -d --env-file .env ghcr.io/letruxux/fluxer-rpc:latest`

Run with [bun](https://bun.sh): `bun i`, `bun start`

### Standalone on windows (not recommended)

Experimental windows exe: see [WINDOWS.md](./WINDOWS.md)

### Using Flakes

If you're on NixOS with Flakes enabled, you can add this repository to your inputs and use the included Home Manager module
for configuration & autostart:

```nix
{
   inputs = {
      nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

      home-manager = {
         url = "github:nix-community/home-manager";
         inputs.nixpkgs.follows = "nixpkgs";
      };
      
      fluxer-rpc = {
         url = "github:letruxux/fluxer-rpc";
         # optionally override the nixpkgs revision that is used, so it is the same as your own (might break)
         inputs.nixpkgs.follows = "nixpkgs";
      };
   };

   outputs = {
      self,
      nixpkgs,
      ...
   } @ inputs: {
      nixosConfigurations = {
         hostname = nixpkgs.lib.nixosSystem {
            system = "x86_64-linux";
            modules = [
               inputs.home-manager.nixosModules.default
               {
                  home-manager = {
                     users."username".imports = [
                        (
                           {...}: {
                              imports = [
                                 # add the Home Manager module
                                 inputs.fluxer-rpc.hmModules.default
                              ];
                              
                              services.fluxer-rpc = {
                                 enable = true;
                                 
                                 # this variable points to a file with all your environment variables
                                 # it can be a path in your Flake, in your current system, or one managed by
                                 # a secrets provisioning module like sops-nix
                                 envFile = ./.env;
                              };
                           }
                        )
                     ];
                  };
               }
            ];
         };
      };
   };
}
```

## Custom emojis

To use custom emojis, you need to find their IDs. (and need Plutonium obviously)

<details>
<summary>How to find the ID of an emoji</summary>

1. Type the emoji normally

   ![img](/assets/emoji/1.png)

2. Add a backslash (`\`) at the start of the emoji

   ![img](/assets/emoji/2.png)

3. Copy the ID (the long number)

   ![img](/assets/emoji/3.png)

When you have the ID, you can use it in the config the same as you would use a normal emoji.

</details>

## Help!!! Bug!!!

Try redeploying the app, i might have fixed it already. If not, just open an issue!
