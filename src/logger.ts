/* grabbed from flux.fm */

export function hexToTerminal(_hex: string) {
  /* uh ok idk wat this is */
  let hex = _hex.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length !== 6) {
    throw new Error("invalid hex");
  }

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  return `\x1b[38;2;${r};${g};${b}m`;
}

export type Hex = `#${string}`; /* heh... pro code here */

export class Logger {
  private readonly prefix: string;
  private readonly baseColor: string | undefined;
  private readonly baseBgColor: string | undefined;
  private readonly dimColor = "\x1b[2m";
  static readonly resetColor = "\x1b[0m";

  constructor(prefix: string, baseColor?: Hex, baseBgColor?: Hex) {
    this.prefix = prefix;
    this.baseColor = baseColor ? hexToTerminal(baseColor) : "";
    this.baseBgColor = baseBgColor ? hexToTerminal(baseBgColor) : "";
  }

  info(...message: any[]): void {
    console.log(
      `${this.prefix} INF${this.baseColor ?? ""}${this.baseBgColor ?? ""}`,
      ...message,
      Logger.resetColor,
    );
  }

  error(...message: any[]): void {
    console.error(
      `${this.prefix} ERR${this.baseColor ?? ""}${this.baseBgColor ?? ""}`,
      ...message,
      Logger.resetColor,
    );
  }

  dim(...message: any[]): void {
    console.log(
      `${this.prefix} ${this.dimColor}DIM${this.baseBgColor ?? ""}`,
      ...message,
      Logger.resetColor,
    );
  }
}
