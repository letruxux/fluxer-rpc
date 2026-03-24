import { env } from "./env";

export function append(...args: (string | false | undefined | null)[]) {
  return args.filter((e) => e).join(" ");
}

export function parenthesize(str: string) {
  return str ? `(${str})` : null;
}

export function useTemplate(template: string, data: Record<string, string>) {
  return template.replaceAll(/{{(\w+)}}/g, (_, key) => data[key] ?? "");
}

function positiveOrZero(num: number) {
  return num > 0 ? num : 0;
}

export function timePassedToString(ms: number) {
  let totalSeconds = Math.floor(ms / 1000);

  const roundSeconds = env.ROUND_TO_5_SECONDS === true ? 5 : env.ROUND_TO_SECONDS;

  if (roundSeconds && roundSeconds > 0)
    totalSeconds = Math.floor(totalSeconds / roundSeconds) * roundSeconds;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${positiveOrZero(minutes).toString().padStart(2, "0")}:${positiveOrZero(
      seconds,
    )
      .toString()
      .padStart(2, "0")}`;
  }

  return `${positiveOrZero(minutes)}:${positiveOrZero(seconds)
    .toString()
    .padStart(2, "0")}`;
}

export function calculateTimer(str: string) {
  const timerMatch = str.match(/\((\d+):(\d{2})\/\d+:\d{2}\)/);
  const timer = timerMatch
    ? Math.floor(+(timerMatch[1] ?? 0) * 60 + +(timerMatch[2] ?? 0)) * 1000
    : undefined;

  return {
    timer,
    textWithNoTimer: str.replace(/\(\d+:\d{2}\/\d+:\d{2}\)/, "").trim(),
  };
}
