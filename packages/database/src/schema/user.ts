import { boolean, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { linksformusicSchema } from "../pg-schema.js";

export const authUser = linksformusicSchema.table("auth_user", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image", { length: 2048 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
