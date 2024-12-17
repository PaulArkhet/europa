import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./db/drizzle",
    schema: "./db/schemas/index.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DEV_CONNECTIONSTRING!,
    },
});
