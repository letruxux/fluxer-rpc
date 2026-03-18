import { sendPresenceUpdate, type GatewayPresenceUpdateData } from "./fluxer";
import { hexToTerminal, Logger } from "./logger";
import { calculateTimer } from "./utils";

let lastTextContent: string | undefined;
let lastTimerData: number | undefined;

export const logger = new Logger(
  `${hexToTerminal("#0f0")}[presence]${Logger.resetColor}`,
);

function getStatusColor(status: string) {
  switch (status) {
    case "online":
      return hexToTerminal("#0f0");
    case "idle":
      return hexToTerminal("#ff0");
    case "dnd":
      return hexToTerminal("#f00");
    case "invisible":
      return hexToTerminal("#808080");
    default:
      return hexToTerminal("#fff");
  }
}

export function presencePayloadToString(data: GatewayPresenceUpdateData) {
  const statusColor = getStatusColor(data.status);
  const status = data.custom_status
    ? `${data.custom_status.emoji_name} ${data.custom_status.text}`
    : "<no status>";
  const statusDot = statusColor + "⏺" + Logger.resetColor;
  return `${statusDot} ${status}`;
}

export async function setPresence(load: GatewayPresenceUpdateData) {
  const text = load.custom_status?.text ?? "";
  const { textWithNoTimer, timer } = calculateTimer(text);

  const contentChanged = textWithNoTimer !== lastTextContent;
  const timerChanged = timer !== undefined && timer !== lastTimerData;

  if (!contentChanged && !timerChanged) {
    return;
  }

  if (process.argv.includes("--dry")) {
    logger.info("fake-set presence to:", presencePayloadToString(load));
    lastTextContent = textWithNoTimer;
    if (timer !== undefined) lastTimerData = timer;
    return;
  }

  await sendPresenceUpdate(load);

  lastTextContent = textWithNoTimer;
  if (timer !== undefined) lastTimerData = timer;
}
