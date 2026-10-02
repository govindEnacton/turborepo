import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "user",
  "admin",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  
  email: text("email").notNull(),

  role: userRole("role")
    .notNull()
    .default("user"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});
