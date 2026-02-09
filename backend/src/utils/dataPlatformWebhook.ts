/**
 * Data Lake Kafka Webhook client.
 * Sends data per backend/kafka.md spec:
 * POST with EventName, KafkaTopicName query params; body: { payload: [...] }
 */

// Match working Django flow: kakfa_example_flow.md uses data-platform-webhook
const DEFAULT_BASE_URL = 'https://data-platform-webhook.curefit.co/backend-datalake-kafka';
const BATCH_SIZE = 200;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS =
  Number(process.env.DATALAKE_WEBHOOK_TIMEOUT_MS) || 30_000;

export async function sendToDataPlatformWebhook(
  eventName: string,
  kafkaTopicName: string,
  records: Record<string, unknown>[],
): Promise<void> {
  if (!records.length) return;

  const baseUrl = process.env.DATALAKE_WEBHOOK_URL || DEFAULT_BASE_URL;
  const batches = chunk(records, BATCH_SIZE);

  for (const batch of batches) {
    await sendBatchWithRetry(baseUrl, eventName, kafkaTopicName, batch);
  }
}

async function sendBatchWithRetry(
  baseUrl: string,
  eventName: string,
  kafkaTopicName: string,
  batch: Record<string, unknown>[],
): Promise<void> {
  const url = new URL(baseUrl);
  url.searchParams.set('EventName', eventName);
  url.searchParams.set('KafkaTopicName', kafkaTopicName);

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: batch }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rawText = await res.text();
      const data = (() => {
        try {
          return rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
        } catch {
          return {};
        }
      })();

      // Example flow: success when 200 or 201 (datalake_client.py checks status only)
      if (res.status === 200 || res.status === 201) return;

      const detail = String(data.error || data.message || rawText || JSON.stringify(data));
      lastError = new Error(`Webhook returned ${res.status}: ${res.statusText}. ${detail}`);
      // eslint-disable-next-line no-console
      console.error('Data platform webhook error:', {
        status: res.status,
        url: url.toString(),
        responseBody: rawText || '(empty)',
        payloadSample: batch[0],
      });

      // Spec 7.2: Do not retry on 400 Bad Request
      if (res.status === 400) {
        throw lastError;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastError =
        err instanceof Error
          ? err.name === 'AbortError'
            ? new Error('Request timed out')
            : err
          : new Error(String(err));
    }

    if (attempt < MAX_RETRIES) {
      await sleep(500 * attempt);
    }
  }

  throw lastError || new Error('Failed to send to data platform webhook');
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
