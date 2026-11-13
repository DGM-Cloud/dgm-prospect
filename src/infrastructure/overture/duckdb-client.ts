import duckdb from "duckdb";

type DuckConnection = {
  all: (
    sql: string,
    ...args: Array<unknown | ((err: Error | null, rows: unknown[]) => void)>
  ) => void;
  run: (
    sql: string,
    ...args: Array<unknown | ((err: Error | null) => void)>
  ) => void;
  close: (callback?: (err: Error | null) => void) => void;
};

function promisifyAll(
  connection: DuckConnection,
  sql: string,
  params: unknown[] = [],
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    connection.all(sql, ...params, (err: Error | null, rows: unknown[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve((rows ?? []) as Record<string, unknown>[]);
    });
  });
}

function promisifyRun(
  connection: DuckConnection,
  sql: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.run(sql, (err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export async function withDuckDbConnection<T>(
  fn: (
    query: (
      sql: string,
      params?: unknown[],
    ) => Promise<Record<string, unknown>[]>,
  ) => Promise<T>,
): Promise<T> {
  const database = new duckdb.Database(":memory:");
  const connection = database.connect() as unknown as DuckConnection;

  try {
    await promisifyRun(connection, "INSTALL httpfs;");
    await promisifyRun(connection, "LOAD httpfs;");
    await promisifyRun(connection, "INSTALL spatial;");
    await promisifyRun(connection, "LOAD spatial;");
    // Official Overture docs: public Places GeoParquet lives on us-west-2 S3.
    await promisifyRun(connection, "SET s3_region='us-west-2';");

    return await fn((sql, params = []) =>
      promisifyAll(connection, sql, params),
    );
  } finally {
    await new Promise<void>((resolve) => {
      connection.close(() => resolve());
    });
    database.close();
  }
}
