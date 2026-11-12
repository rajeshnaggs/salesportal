// lib/db.ts
import sql from 'mssql';

const dbConfig: sql.config = {
  user: process.env.SAP_DB_USER,
  password: process.env.SAP_DB_PASSWORD,
  server: process.env.SAP_DB_SERVER || 'localhost',
  database: process.env.SAP_DB_NAME,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // Set to true if your SQL Server enforces SSL
    trustServerCertificate: true,
  },
};

// Reuse connection pool across Next.js hot reloads in development
const globalForSql = globalThis as unknown as {
  sqlPool?: Promise<sql.ConnectionPool>;
};

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (!globalForSql.sqlPool) {
    globalForSql.sqlPool = new sql.ConnectionPool(dbConfig)
      .connect()
      .catch((err) => {
        globalForSql.sqlPool = undefined;
        throw err;
      });
  }
  return globalForSql.sqlPool;
}

export { sql };
