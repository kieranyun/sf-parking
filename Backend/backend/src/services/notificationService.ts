import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { pool } from '../db/connection';
import { QUERIES } from '../db/queries';

const expo = new Expo();

// In-memory store for pending sweep warning timeouts, keyed by deviceId
const pendingSweepWarnings: Map<string, NodeJS.Timeout> = new Map();

/**
 * Sends a visible push notification to all phones registered for a given Traccar device.
 * Multiple phones can be registered to the same car (e.g. family members).
 */
export async function sendPushToDevice(deviceId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  const tokens = await getTokensForDevice(deviceId);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title,
    body,
    ...(data ? { data } : {}),
  }));

  await sendMessages(deviceId, messages);
}

/**
 * Sends a data-only (silent) push notification — no visible alert.
 * Used to update app state in the background (e.g. parked location, restrictions).
 */
export async function sendDataPushToDevice(deviceId: string, data: Record<string, any>): Promise<void> {
  const tokens = await getTokensForDevice(deviceId);
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    data,
    // No title/body/sound — this is a silent data-only push
    // On iOS, data-only pushes with _contentAvailable wake the app in background
    _contentAvailable: true,
  } as ExpoPushMessage));

  await sendMessages(deviceId, messages);
}

/**
 * Schedules a visible push notification to warn about upcoming street sweeping.
 * Fires `leadTimeMs` before the sweep starts. Cancels any existing warning for this device.
 */
export function scheduleSweepWarning(
  deviceId: string,
  sweepTime: Date,
  streetInfo: { street: string; blockside: string; fromHour: number },
  leadTimeMs: number = 2 * 60 * 60 * 1000 // default 2 hours before
): void {
  // Cancel any existing warning for this device
  cancelSweepWarning(deviceId);

  const now = Date.now();
  const fireAt = sweepTime.getTime() - leadTimeMs;
  const delayMs = fireAt - now;

  if (delayMs <= 0) {
    // Sweep is less than leadTime away — send immediately
    console.log(`Sweep warning for device ${deviceId}: sweep is imminent, sending now`);
    const timeStr = `${streetInfo.fromHour}:00`;
    sendPushToDevice(
      deviceId,
      'Move your car!',
      `Street cleaning on ${streetInfo.street} (${streetInfo.blockside}) starts at ${timeStr}`
    );
    return;
  }

  console.log(`Scheduling sweep warning for device ${deviceId} in ${Math.round(delayMs / 60000)} minutes (sweep at ${sweepTime.toISOString()})`);

  const timeout = setTimeout(() => {
    const timeStr = `${streetInfo.fromHour}:00`;
    sendPushToDevice(
      deviceId,
      'Move your car!',
      `Street cleaning on ${streetInfo.street} (${streetInfo.blockside}) starts at ${timeStr}`
    );
    pendingSweepWarnings.delete(deviceId);
  }, delayMs);

  pendingSweepWarnings.set(deviceId, timeout);
}

/**
 * Cancels any pending sweep warning for a device (e.g. when the car moves).
 */
export function cancelSweepWarning(deviceId: string): void {
  const existing = pendingSweepWarnings.get(deviceId);
  if (existing) {
    clearTimeout(existing);
    pendingSweepWarnings.delete(deviceId);
    console.log(`Cancelled sweep warning for device ${deviceId}`);
  }
}

// ---- Internal helpers ----

async function getTokensForDevice(deviceId: string): Promise<string[]> {
  const result = await pool.query(QUERIES.getTokensForDevice, [deviceId]);
  const tokens: string[] = result.rows
    .map((row: any) => row.push_token)
    .filter((token: string) => Expo.isExpoPushToken(token));

  if (tokens.length === 0) {
    console.log(`No valid push tokens for device ${deviceId}, skipping`);
  }
  return tokens;
}

async function sendMessages(deviceId: string, messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log(`Push sent for device ${deviceId}:`, receipts);
    } catch (error) {
      console.error(`Error sending push for device ${deviceId}:`, error);
    }
  }
}
