{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = {
    self,
    nixpkgs,
    ...
  } @ inputs: let
    inherit (self) outputs;
    inherit (nixpkgs) lib;
    
    targets = [
      "x86_64-linux"
      "aarch64-linux"
    ];

    forTargets = func:
      lib.genAttrs targets
      (system: func (import nixpkgs {inherit system;}));
  in {
    packages = forTargets (pkgs: rec {
      fluxer-rpc = pkgs.callPackage ./nix/package {};
      default = fluxer-rpc;
    });

    hmModules = rec {
      fluxer-rpc = import ./nix/hm.nix self;
      default = fluxer-rpc;
    };

    devShells = forTargets (pkgs: {
      default = pkgs.mkShellNoCC {
        NIX_CONFIG = "extra-experimental-features = nix-command flakes";
        nativeBuildInputs = with pkgs; [gitMinimal bun python3];

        shellHook = ''
          bun install --frozen-lockfile
        '';
      };
    });
  };
}
