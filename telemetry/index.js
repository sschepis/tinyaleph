/**
 * Telemetry module for TinyAleph
 *
 * Provides Prometheus/OpenTelemetry-compatible metric types:
 * - Counter: Monotonically increasing value
 * - Gauge: Value that can go up and down
 * - Histogram: Distribution of values in buckets
 * - Summary: Quantile distribution
 *
 * Browser-compatible: No Node.js dependencies.
 *
 * @example
 * import {  MetricRegistry, Counter, Gauge  } from '@aleph-ai/tinyaleph/telemetry';
 *
 * const registry = new MetricRegistry({ prefix: 'myapp_' });
 * const requests = registry.counter('requests_total', { help: 'Total requests' });
 * requests.inc(1, { method: 'GET', status: '200' });
 *
 * console.log(registry.toPrometheus());
 *
 * @module @aleph-ai/tinyaleph/telemetry
 */

// Re-export all from metrics
export * from './metrics.js';

// Import and re-export default
import metrics from './metrics.js';
export default metrics;

// Named exports for convenience
export {
    MetricType,
    Metric,
    Counter,
    Gauge,
    Histogram,
    Summary,
    MetricRegistry
} from './metrics.js';