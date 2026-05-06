self: {
  config,
  lib,
  pkgs,
  ...
}: let
  inherit (lib)
    mkEnableOption
    mkOption
    mkPackageOption
    optionalAttrs
    types;
  inherit (pkgs.stdenvNoCC.hostPlatform) system;

  cfg = config.services.fluxer-rpc;
in {
  options.services.fluxer-rpc = with types; {
    enable = mkEnableOption "";

    envFile = mkOption {
      type = either str path;
      default = null;
      description = ''
        Path to an environment file containing the required
        variables.
      '';
    };

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${system}.fluxer-rpc;
      description = "The fluxer-rpc package to use";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.user.services.fluxer-rpc = {
      Unit = {
        Description = "Fluxer RPC";

        Wants = ["network-online.target"];
        After = ["network-online.target"];
      };

      Install.WantedBy = ["default.target"];

      Service = {
        ExecStart = "${cfg.package}/bin/fluxer-rpc";

        Restart = "on-failure";
        RestartSec = 2;

        EnvironmentFile = cfg.envFile;
      };
    };
  };
}