import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config();

const Pool = pg.Pool;
const isDev = process.env.NODE_ENV === "dev";

export const pool = new Pool({
    connectionString: isDev
        ? process.env.DEV_CONNECTIONSTRING
        : process.env.CONNECTIONSTRING,
});

export const db = drizzle(pool);
