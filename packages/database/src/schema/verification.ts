import { timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { linksformusicSchema } from "../pg-schema.js";

export const authVerification = linksformusicSchema.table("auth_verification", {
  id: uuid("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 2048 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
