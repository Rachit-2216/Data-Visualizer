declare module '@duckdb/duckdb-wasm/dist/duckdb-browser.mjs' {
  export function getJsDelivrBundles(): unknown;
  export function selectBundle(bundles: unknown): Promise<{
    mainWorker?: string;
    mainModule: string;
    pthreadWorker?: string;
  }>;

  export class ConsoleLogger {}

  export class AsyncDuckDB {
    constructor(logger: ConsoleLogger, worker: Worker);
    instantiate(mainModule: string, pthreadWorker?: string): Promise<void>;
    connect(): Promise<{
      query(sql: string): Promise<{ toArray(): Array<Record<string, unknown>> }>;
      close(): Promise<void>;
    }>;
    registerFileBuffer(name: string, buffer: Uint8Array): Promise<void>;
    terminate(): Promise<void>;
  }
}
