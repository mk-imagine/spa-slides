/// <reference types="vite/client" />

declare module 'virtual:bibliography' {
  const entries: Record<string, { inline: string; html: string }>;
  export default entries;
}

interface Window {
  /** Test instrumentation read by tests/spike.mjs. */
  __spikeMetrics?: { simTicks: number; pointerLog: Array<{ x: number; y: number; naiveX: number; naiveY: number }> };
}
