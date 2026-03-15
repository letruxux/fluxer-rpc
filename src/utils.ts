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
  const totalSeconds = Math.floor(ms / 1000);

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

  return `${positiveOrZero(minutes)}:${positiveOrZero(seconds).toString().padStart(2, "0")}`;
}

export function calculateTimer(str: string) {
  /* regex ?? i hate this but i dont want to track it separately */
  const timerMatch = str.match(/\((\d+):(\d{2})\/\d+:\d{2}\)/);
  const timer = timerMatch
    ? Math.floor(
        (+(timerMatch[1] ?? 0) * 60 + +(timerMatch[2] ?? 0)) /
          env.TIMER_UPDATE_INTERVAL_SECONDS,
      ) * env.TIMER_UPDATE_INTERVAL_SECONDS
    : undefined;

  return {
    timer,
    textWithNoTimer: str.replace(/\(\d+:\d{2}\/\d+:\d{2}\)/, "").trim(),
  };
}
