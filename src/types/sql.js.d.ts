declare module 'sql.js' {
  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface Database {
    run(sql: string, params?: (string | number | null)[]): void;
    exec(sql: string, params?: (string | number | null)[]): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  export type { Database, QueryExecResult, SqlJsStatic };

  export default function initSqlJs(): Promise<SqlJsStatic>;
}
