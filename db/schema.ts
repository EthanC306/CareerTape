import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

export const employerProgress = sqliteTable(
  "employer_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    employerId: text("employer_id").notNull(),
    starred: integer("starred", { mode: "boolean" }).notNull().default(false),
    stage: text("stage").notNull().default("planned"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_employer_progress_user_employer").on(
      table.userId,
      table.employerId,
    ),
    index("idx_employer_progress_user_stage").on(table.userId, table.stage),
  ],
)

export const conversations = sqliteTable(
  "conversations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    employerId: text("employer_id").notNull(),
    recruiterName: text("recruiter_name").notNull().default(""),
    note: text("note").notNull(),
    interest: text("interest").notNull().default("promising"),
    followUpStatus: text("follow_up_status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_conversations_user_created").on(table.userId, table.createdAt),
    index("idx_conversations_user_employer").on(table.userId, table.employerId),
  ],
)
