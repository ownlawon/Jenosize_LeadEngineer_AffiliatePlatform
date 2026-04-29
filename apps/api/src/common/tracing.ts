/**
 * OpenTelemetry bootstrap. Imported FIRST in main.ts so the auto-instrumentations
 * patch http / express / nestjs / pg / ioredis / prisma BEFORE any other module
 * loads — that's how OTel sees those calls.
 *
 * Exporter is `ConsoleSpanExporter` (stdout) by default so traces are visible
 * in Railway logs without provisioning Honeycomb / Tempo / Datadog. Switch to
 * OTLP HTTP by setting `OTEL_EXPORTER_OTLP_ENDPOINT` — auto-instrumentations
 * pick that up via env.
 *
 * Disabled at runtime when `OTEL_DISABLED=1` (handy for unit tests where
 * tracing slows the suite for no benefit).
 */
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const disabled =
  process.env.OTEL_DISABLED === "1" || process.env.NODE_ENV === "test";

if (!disabled) {
  // Default to a sampled console exporter. In production you'd swap this for
  // OTLPTraceExporter pointed at your collector.
  const exporter: SpanExporter = new ConsoleSpanExporter();

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "jenosize-api",
      [ATTR_SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION ?? "0.1.0",
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
    instrumentations: [
      getNodeAutoInstrumentations({
        // /health is hit constantly by Railway's checker — don't trace it.
        "@opentelemetry/instrumentation-http": {
          ignoreIncomingRequestHook: (req) => req.url === "/health",
        },
        // We use Pino directly via nestjs-pino; auto-instrumenting it adds
        // span links per log line which doubles log volume.
        "@opentelemetry/instrumentation-pino": { enabled: false },
        // fs traces produce a torrent for any Node app — almost never useful.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  try {
    sdk.start();
    // eslint-disable-next-line no-console
    console.log("[otel] tracing enabled (console exporter)");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[otel] failed to start, continuing without tracing:", err);
  }

  process.on("SIGTERM", () => {
    void sdk.shutdown().catch(() => {});
  });
}
