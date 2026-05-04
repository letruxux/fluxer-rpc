{
  stdenvNoCC,
  lib,
  bun,
  callPackage,
}: let
  inherit (stdenvNoCC.hostPlatform) system;
in stdenvNoCC.mkDerivation (final: {
  pname = "fluxer-rpc";
  version = "0.1.0";

  src = ./../..;

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
