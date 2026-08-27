/**
 * Type definitions for @aleph-ai/tinyaleph/telemetry
 *
 * Declared against the runtime in telemetry/metrics.js. Prometheus/OTLP
 * compatible, browser-safe (no Node.js dependencies).
 */

declare module '@aleph-ai/tinyaleph/telemetry' {

  export const MetricType: {
    COUNTER: 'counter';
    GAUGE: 'gauge';
    HISTOGRAM: 'histogram';
    SUMMARY: 'summary';
  };

  export type MetricTypeName = 'counter' | 'gauge' | 'histogram' | 'summary';

  export interface MetricOptions {
    help?: string;
    labels?: string[];
    buckets?: number[];
    quantiles?: number[];
    maxAge?: number;
    [key: string]: unknown;
  }

  export class Metric {
    constructor(name: string, options?: MetricOptions);
    name: string;
    help: string;
    labels: string[];
    type: MetricTypeName;
    values: Map<string, unknown>;
    getLabelKey(labels?: Record<string, string | number>): string;
    formatLabels(labels?: Record<string, string | number>): string;
    toPrometheus(): string;
    toOTLP(): object;
    reset(): void;
  }

  export class Counter extends Metric {
    constructor(name: string, options?: MetricOptions);
    inc(value?: number, labels?: Record<string, string | number>): void;
    get(labels?: Record<string, string | number>): number;
    toPrometheus(): string;
    toOTLP(): object;
  }

  export class Gauge extends Metric {
    constructor(name: string, options?: MetricOptions);
    set(value: number, labels?: Record<string, string | number>): void;
    inc(value?: number, labels?: Record<string, string | number>): void;
    dec(value?: number, labels?: Record<string, string | number>): void;
    get(labels?: Record<string, string | number>): number;
    setToCurrentTime(labels?: Record<string, string | number>): void;
    toPrometheus(): string;
    toOTLP(): object;
  }

  export class Histogram extends Metric {
    constructor(name: string, options?: MetricOptions);
    buckets: number[];
    observe(value: number, labels?: Record<string, string | number>): void;
    time<T>(fn: () => T, labels?: Record<string, string | number>): T;
    timeAsync<T>(fn: () => Promise<T>, labels?: Record<string, string | number>): Promise<T>;
    toPrometheus(): string;
    toOTLP(): object;
  }

  export class Summary extends Metric {
    constructor(name: string, options?: MetricOptions);
    quantiles: number[];
    maxAge: number;
    observe(value: number, labels?: Record<string, string | number>): void;
    calculateQuantile(samples: Array<{ value: number; timestamp: number }>, q: number): number;
    toPrometheus(): string;
    toOTLP(): object;
  }

  export class MetricRegistry {
    constructor(options?: { prefix?: string; defaultLabels?: Record<string, string | number> });
    prefix: string;
    metrics: Map<string, Metric>;
    defaultLabels: Record<string, string | number>;
    on(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): boolean;
    getFullName(name: string): string;
    counter(name: string, options?: MetricOptions): Counter;
    gauge(name: string, options?: MetricOptions): Gauge;
    histogram(name: string, options?: MetricOptions): Histogram;
    summary(name: string, options?: MetricOptions): Summary;
    get(name: string): Metric | undefined;
    remove(name: string): void;
    clear(): void;
    toPrometheus(): string;
    toOTLP(): object;
    getMetricNames(): string[];
  }

  // ============================================
  // Default export (the `metrics` namespace object)
  // ============================================

  const metrics: {
    MetricType: typeof MetricType;
    Metric: typeof Metric;
    Counter: typeof Counter;
    Gauge: typeof Gauge;
    Histogram: typeof Histogram;
    Summary: typeof Summary;
    MetricRegistry: typeof MetricRegistry;
  };

  export default metrics;
}
