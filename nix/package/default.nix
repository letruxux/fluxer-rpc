{
  stdenvNoCC,
  lib,
  fetchFromGitHub,
  bun,
  callPackage,
}: let
  inherit (stdenvNoCC.hostPlatform) system;
in stdenvNoCC.mkDerivation (final: {
  pname = "fluxer-rpc";
  version = "0.1.0";

  src = fetchFromGitHub {
    owner = "letruxux";
    repo = "fluxer-rpc";
    tag = "v${final.version}";
    hash = "sha256-XyQrJNuWJT4O/oppJy2Oq0UACvMb1hkKB+naicCsAV0=";
  };

  nativeBuildInputs = [bun];

  node_modules = callPackage ./modules.nix {fluxer-rpc = final;};

  configurePhase = ''
    runHook preConfigure

    cp -R ${final.node_modules} ./node_modules
    patchShebangs ./node_modules

    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild

    bun build . \
      --compile \
      --target=bun-${system} \
      --minify \
      --outfile ${final.pname}
    
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    install -m 755 -D ${final.pname} $out/bin/${final.pname}
    runHook postInstall
  '';
})
