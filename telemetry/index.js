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
 * const { MetricRegistry, Counter, Gauge } = require('@aleph-ai/tinyaleph/telemetry');
 * 
 * const registry = new MetricRegistry({ prefix: 'myapp_' });
 * const requests = registry.counter('requests_total', { help: 'Total requests' });
 * requests.inc(1, { method: 'GET', status: '200' });
 * 
 * console.log(registry.toPrometheus());
 * 
 * @module @aleph-ai/tinyaleph/telemetry
 */

module.exports = require('./metrics');