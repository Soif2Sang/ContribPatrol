import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';

/**
 * Create a user if it doesn't exist, or return the existing user
 */
export async function createOrGetUser(username: string) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  if (existingUser.length === 0) {
    const [newUser] = await db
      .insert(users)
      .values({ username })
      .returning();
    console.log(`Created user: ${username} (ID: ${newUser.id})`);
    return newUser;
  }
  
  console.log(`User already exists: ${username} (ID: ${existingUser[0].id})`);
  return existingUser[0];
}

/**
 * Get a user by username
 */
export async function getUserByUsername(username: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}
