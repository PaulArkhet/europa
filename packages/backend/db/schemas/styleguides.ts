import {
    pgTable,
    varchar,
    text,
    boolean,
    timestamp,
    serial,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const styleguides = pgTable("styleguides", {
    styleguide_id: serial("styleguide_id").primaryKey(),
    filename: varchar("filename").notNull(),
    typography: text("typography"),
    colors: text("colors"),
    buttons: text("buttons"),
    radiobuttons: text("radiobuttons"),
    textfields: text("textfields"),
    toggle: text("toggle"),
    checkboxes: text("checkboxes"),
    internalnavigation: text("internalnavigation"),
    segmentedbutton: text("segmentedbutton"),
    card: text("card"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    edited_at: timestamp("edited_at").notNull().defaultNow(),
    active: boolean("active").default(true),
    user_id: varchar("user_id")
        .references(() => users.user_id, { onDelete: "cascade" })
        .notNull(),
});
