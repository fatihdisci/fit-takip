import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __gymflowSql__: ReturnType<typeof postgres> | undefined;
}

export function getSql() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.__gymflowSql__) {
    global.__gymflowSql__ = postgres(connectionString, {
      prepare: false,
      max: 1
    });
  }

  return global.__gymflowSql__;
}

