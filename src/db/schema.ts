import { pgTable, bigserial, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const repositories = pgTable('repositories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ownerUsername: text('owner_username').notNull(),
  repoName: text('repo_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueOwnerRepo: unique().on(table.ownerUsername, table.repoName),
}));

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const trustedUsers = pgTable('trusted_users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigserial('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  repoId: bigserial('repo_id', { mode: 'number' }).notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserRepo: unique().on(table.userId, table.repoId),
}));

export const bans = pgTable('bans', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: bigserial('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  repoId: bigserial('repo_id', { mode: 'number' }).references(() => repositories.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  uniqueUserRepo: unique().on(table.userId, table.repoId),
}));
