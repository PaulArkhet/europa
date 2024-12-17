import { pgTable, varchar, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    user_id: varchar("user_id").primaryKey(),
    email: varchar("email"),
    username: varchar("username"),
    password: varchar("password"),
    created_at: varchar("created_at"),
    active: boolean("active").default(true),
    email_verified: boolean("email_verified").default(false),
});
