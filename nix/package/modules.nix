{
  stdenvNoCC,
  lib,
  fluxer-rpc,
  bun,
  writableTmpDirAsHomeHook,
}:
stdenvNoCC.mkDerivation {
  inherit (fluxer-rpc) version src;
  pname = "${fluxer-rpc.pname}-modules";

  impureEnvVars =
    lib.fetchers.proxyImpureEnvVars
    ++ [
      "GIT_PROXY_COMMAND"
      "SOCKS_SERVER"
    ];

  nativeBuildInputs = [
    bun
    writableTmpDirAsHomeHook
  ];

  dontConfigure = true;
  dontFixup = true;
    
  buildPhase = ''
    runHook preBuild

    export BUN_INSTALL_CACHE_DIR=$(mktemp -d)
    bun install --frozen-lockfile --no-progress
      
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    cp -R ./node_modules $out
    runHook postInstall
  '';

  outputHashAlgo = "sha256";
  outputHashMode = "recursive";
  outputHash = "sha256-vZdwdCOMbCQD8hR/6h1/CBLTJ2Wad/GGS5Yl7zsUKRU=";
}