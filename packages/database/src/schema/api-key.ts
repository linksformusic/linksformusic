import { boolean, index, integer, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { linksformusicSchema } from "../pg-schema.js";

export const authApiKey = linksformusicSchema.table(
  "auth_api_key",
  {
    id: uuid("id").primaryKey(),
    configId: varchar("config_id", { length: 255 }).notNull().default("default"),
    name: varchar("name", { length: 255 }),
    start: varchar("start", { length: 32 }),
    prefix: varchar("prefix", { length: 64 }),
    key: varchar("key", { length: 255 }).notNull(),
    referenceId: uuid("reference_id").notNull(),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window"),
    rateLimitMax: integer("rate_limit_max"),
    requestCount: integer("request_count"),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("auth_api_key_config_id_idx").on(table.configId),
    index("auth_api_key_reference_id_idx").on(table.referenceId),
  ]
);
