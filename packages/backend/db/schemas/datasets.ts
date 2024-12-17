import {
    pgTable,
    varchar,
    boolean,
    serial,
} from "drizzle-orm/pg-core";

export const datasets = pgTable("datasets", {
    dataset_id: serial("dataset_id").primaryKey(),
    user_id: varchar("user_id"),
    title: varchar("title"),
    headers: varchar("headers"),
    content: varchar("content"),
    created_at: varchar("created_at"),
    edited_at: varchar("edited_at"),
    active: boolean("active").default(true),
});
