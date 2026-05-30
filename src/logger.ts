/* grabbed from flux.fm */

import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

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
  static globalLogFile: string | null = null;

  constructor(prefix: string, baseColor?: Hex, baseBgColor?: Hex) {
    this.prefix = prefix;
    this.baseColor = baseColor ? hexToTerminal(baseColor) : "";
    this.baseBgColor = baseBgColor ? hexToTerminal(baseBgColor) : "";
  }

  private writeFile(...message: any[]): void {
    const file = Logger.globalLogFile;
    if (!file) return;
    try {
      const dir = dirname(file);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const prefix = this.prefix.replace(/\x1b\[[\d;]+m/g, "");
      const line = `[${new Date().toISOString()}] ${prefix} ${message.map((m) => (typeof m === "object" ? JSON.stringify(m, null, 2) : String(m))).join(" ")}\n`;
      appendFileSync(file, line);
    } catch {}
  }

  info(...message: any[]): void {
    console.log(
      `${this.prefix} INF${this.baseColor ?? Logger.resetColor}${this.baseBgColor ?? Logger.resetColor}`,
      ...message,
      Logger.resetColor,
    );
    this.writeFile("INF", ...message);
  }

  error(...message: any[]): void {
    console.error(
      `${this.prefix} \x1b[31mERR\x1b[0m${this.baseColor ?? Logger.resetColor}${this.baseBgColor ?? Logger.resetColor}`,
      ...message,
      Logger.resetColor,
    );
    this.writeFile("ERR", ...message);
  }

  warn(...message: any[]): void {
    console.warn(
      `${this.prefix} \x1b[33m!!!\x1b[0m${this.baseColor ?? Logger.resetColor}${this.baseBgColor ?? Logger.resetColor}`,
      ...message,
      Logger.resetColor,
    );
    this.writeFile("WRN", ...message);
  }

  dim(...message: any[]): void {
    console.log(
      `${this.prefix} ${this.dimColor}DIM${this.baseBgColor ?? Logger.resetColor}`,
      ...message,
      Logger.resetColor,
    );
    this.writeFile("DIM", ...message);
  }
}
