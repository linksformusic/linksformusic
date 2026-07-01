import { index, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { linksformusicSchema } from "../pg-schema.js";

export const authSession = linksformusicSchema.table(
  "auth_session",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: varchar("user_agent", { length: 1024 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("auth_session_user_id_idx").on(table.userId)]
);
