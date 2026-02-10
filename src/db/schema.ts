import { pgTable, bigserial, text, timestamp } from 'drizzle-orm/pg-core';

export const repositories = pgTable('repositories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ownerUsername: text('owner_username').notNull(),
  repoName: text('repo_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
