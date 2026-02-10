import { db, bans, users } from '../db/index.js';
import { eq, and, or, isNull, gt } from 'drizzle-orm';

/**
 * Ban a user from a repository
 */
export async function banUser(username: string, repoId: number, reason?: string) {
  // Get or create the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  // Check if already banned
  const existing = await db
    .select()
    .from(bans)
    .where(
      and(
        eq(bans.userId, user.id),
        eq(bans.repoId, repoId),
        or(
          isNull(bans.expiresAt),
          gt(bans.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Add ban
  const [ban] = await db
    .insert(bans)
    .values({
      userId: user.id,
      repoId: repoId,
      reason: reason || null,
      expiresAt: null, // Permanent ban
    })
    .returning();

  console.log(`Banned ${username} from repo ${repoId}${reason ? ` - Reason: ${reason}` : ''}`);
  return ban;
}

/**
 * Temporarily ban a user from a repository
 */
export async function tempBanUser(username: string, repoId: number, durationDays: number, reason?: string) {
  // Get or create the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Check if already banned
  const existing = await db
    .select()
    .from(bans)
    .where(
      and(
        eq(bans.userId, user.id),
        eq(bans.repoId, repoId),
        or(
          isNull(bans.expiresAt),
          gt(bans.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing ban
    const [updated] = await db
      .update(bans)
      .set({
        expiresAt,
        reason: reason || existing[0].reason,
      })
      .where(eq(bans.id, existing[0].id))
      .returning();

    console.log(`Updated temp ban for ${username} on repo ${repoId} until ${expiresAt.toISOString()}`);
    return updated;
  }

  // Add temp ban
  const [ban] = await db
    .insert(bans)
    .values({
      userId: user.id,
      repoId: repoId,
      reason: reason || null,
      expiresAt,
    })
    .returning();

  console.log(`Temp banned ${username} from repo ${repoId} until ${expiresAt.toISOString()}${reason ? ` - Reason: ${reason}` : ''}`);
  return ban;
}

/**
 * Unban a user from a repository
 */
export async function unbanUser(username: string, repoId: number) {
  // Get the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    throw new Error(`User ${username} not found`);
  }

  // Remove ban
  await db
    .delete(bans)
    .where(
      and(
        eq(bans.userId, user.id),
        eq(bans.repoId, repoId)
      )
    );

  console.log(`Unbanned ${username} from repo ${repoId}`);
}

/**
 * Check if a user is currently banned from a repository
 */
export async function isBanned(username: string, repoId: number): Promise<boolean> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return false;
  }

  const banned = await db
    .select()
    .from(bans)
    .where(
      and(
        eq(bans.userId, user.id),
        eq(bans.repoId, repoId),
        or(
          isNull(bans.expiresAt),
          gt(bans.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  return banned.length > 0;
}

/**
 * Get all active bans for a repository
 */
export async function getActiveBans(repoId: number) {
  const result = await db
    .select({
      id: bans.id,
      username: users.username,
      reason: bans.reason,
      createdAt: bans.createdAt,
      expiresAt: bans.expiresAt,
    })
    .from(bans)
    .innerJoin(users, eq(bans.userId, users.id))
    .where(
      and(
        eq(bans.repoId, repoId),
        or(
          isNull(bans.expiresAt),
          gt(bans.expiresAt, new Date())
        )
      )
    );

  return result;
}
