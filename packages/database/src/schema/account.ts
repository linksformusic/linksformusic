import { index, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { linksformusicSchema } from "../pg-schema.js";

export const authAccount = linksformusicSchema.table(
  "auth_account",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: varchar("password", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("auth_account_user_id_idx").on(table.userId)]
);
