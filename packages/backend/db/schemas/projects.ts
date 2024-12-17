import {
    pgTable,
    varchar,
    integer,
    boolean,
    serial,
    timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const projects = pgTable("projects", {
    project_id: serial("project_id").primaryKey(),
    user_id: varchar("user_id")
        .references(() => users.user_id, { onDelete: "cascade" })
        .notNull(),
    title: varchar("title"),
    img_src: varchar("img_src").default(""),
    wireframe: varchar("wireframe").default(""),
    created_at: timestamp("created_at").notNull().defaultNow(),
    edited_at: timestamp("edited_at").notNull().defaultNow(),
    iterations: integer("iterations").default(0),
    active: boolean("active").default(true),
});
