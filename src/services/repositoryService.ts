import { db, repositories } from '../db/index.js';
import { eq, and } from 'drizzle-orm';

/**
 * Create a repository if it doesn't exist, or return the existing repository
 */
export async function createOrGetRepository(ownerUsername: string, repoName: string) {
  const existingRepo = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.ownerUsername, ownerUsername),
        eq(repositories.repoName, repoName)
      )
    )
    .limit(1);
  
  if (existingRepo.length === 0) {
    const [newRepo] = await db
      .insert(repositories)
      .values({
        ownerUsername,
        repoName,
      })
      .returning();
    console.log(`Created repository: ${ownerUsername}/${repoName} (ID: ${newRepo.id})`);
    return newRepo;
  }
  
  console.log(`Repository already exists: ${ownerUsername}/${repoName} (ID: ${existingRepo[0].id})`);
  return existingRepo[0];
}

/**
 * Register multiple repositories from an installation
 */
export async function registerRepositories(repos: Array<{ full_name: string }>) {
  const results = [];
  
  for (const repo of repos) {
    const [owner, repoName] = repo.full_name.split('/');
    const result = await createOrGetRepository(owner, repoName);
    results.push(result);
  }
  
  return results;
}

/**
 * Get a repository by owner and name
 */
export async function getRepository(ownerUsername: string, repoName: string) {
  const result = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.ownerUsername, ownerUsername),
        eq(repositories.repoName, repoName)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}
