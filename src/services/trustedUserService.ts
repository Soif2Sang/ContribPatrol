import { db, trustedUsers, users, repositories } from '../db/index.js';
import { eq, and } from 'drizzle-orm';

/**
 * Add a user to the trusted users list for a repository
 */
export async function addTrustedUser(username: string, repoId: number) {
  // Get or create the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  // Check if already trusted
  const existing = await db
    .select()
    .from(trustedUsers)
    .where(
      and(
        eq(trustedUsers.userId, user.id),
        eq(trustedUsers.repoId, repoId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Add to trusted users
  const [trusted] = await db
    .insert(trustedUsers)
    .values({
      userId: user.id,
      repoId: repoId,
    })
    .returning();

  console.log(`Added ${username} to trusted users for repo ${repoId}`);
  return trusted;
}

/**
 * Remove a user from the trusted users list for a repository
 */
export async function removeTrustedUser(username: string, repoId: number) {
  // Get the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  // Remove from trusted users
  await db
    .delete(trustedUsers)
    .where(
      and(
        eq(trustedUsers.userId, user.id),
        eq(trustedUsers.repoId, repoId)
      )
    );

  console.log(`Removed ${username} from trusted users for repo ${repoId}`);
}

/**
 * Check if a user is trusted for a repository
 */
export async function isTrustedUser(username: string, repoId: number): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return false;
  }

  const trusted = await db
    .select()
    .from(trustedUsers)
    .where(
      and(
        eq(trustedUsers.userId, user.id),
        eq(trustedUsers.repoId, repoId)
      )
    )
    .limit(1);

  return trusted.length > 0;
}

/**
 * Get all trusted users for a repository
 */
export async function getTrustedUsers(repoId: number) {
  const result = await db
    .select({
      id: trustedUsers.id,
      username: users.username,
      createdAt: trustedUsers.createdAt,
    })
    .from(trustedUsers)
    .innerJoin(users, eq(trustedUsers.userId, users.id))
    .where(eq(trustedUsers.repoId, repoId));

  return result;
}
