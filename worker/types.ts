// Minimal structural types for the bits of the Cloudflare runtime we use.
// We deliberately avoid importing @cloudflare/workers-types globally because it
// redefines DOM globals (Request/Response/fetch) and clashes with the shared
// tsconfig's DOM lib used by the React frontend.

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<unknown>;
}

export interface Env {
  /** Static assets binding (the built Vite SPA in ./dist/client). */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  /** D1 database binding (see wrangler.jsonc). */
  DB: D1Database;
  /** OpenAI API key. Cloudflare env var / secret, or .dev.vars locally. */
  OPENAI_API_KEY: string;
  /** Optional model override. Defaults to gpt-4o-mini. */
  OPENAI_MODEL?: string;
}
