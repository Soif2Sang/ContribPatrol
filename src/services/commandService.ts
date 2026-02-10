import { Context } from 'probot';
import { banUser, tempBanUser, unbanUser } from './banService.js';
import { addTrustedUser, removeTrustedUser, isTrustedUser } from './trustedUserService.js';
import { getRepository } from './repositoryService.js';
import { createOrGetUser } from './userService.js';
import { normalizeUsername } from '../utils.js';

interface CommandContext {
  commenter: string;
  owner: string;
  repoName: string;
  repoId: number;
  args: string[];
}

/**
 * Parse a command from a comment body
 */
export function parseCommand(commentBody: string): { command: string; args: string[] } | null {
  const match = commentBody.match(/@contribution-patrol\s+(\w+)(?:\s+(.+))?/);
  if (!match) return null;

  const command = match[1].toLowerCase();
  const argsString = match[2] || '';
  const args = argsString.trim().split(/\s+/).filter(Boolean);

  return { command, args };
}

/**
 * Check if user is maintainer (repository owner)
 */
function isMaintainer(username: string, owner: string): boolean {
  return username === owner;
}

/**
 * Handle the ban command
 */
async function handleBan(ctx: CommandContext, context: Context<'issue_comment.created'> | Context<'pull_request_review_comment.created'>) {
  const [targetUserRaw, ...reasonParts] = ctx.args;
  const targetUser = normalizeUsername(targetUserRaw);
  
  if (!targetUser) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number,
      body: `❌ Usage: \`@contribution-patrol ban <username> [reason]\``,
    });
    return;
  }

  const reason = reasonParts.join(' ') || undefined;

  try {
    // Ensure target user exists
    await createOrGetUser(targetUser);
    
    await banUser(targetUser, ctx.repoId, reason);
    
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number,
      body: `✅ User @${targetUser} has been permanently banned from this repository.${reason ? `\nReason: ${reason}` : ''}`,
    });
  } catch (error) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number,
      body: `❌ Failed to ban user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Handle the tempban command
 */
async function handleTempBan(ctx: CommandContext, context: Context<'issue_comment.created'> | Context<'pull_request_review_comment.created'>) {
  const [targetUserRaw, daysStr, ...reasonParts] = ctx.args;
  const targetUser = normalizeUsername(targetUserRaw);
  const issueNumber = 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number;
  
  if (!targetUser || !daysStr) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Usage: \`@contribution-patrol tempban <username> <days> [reason]\``,
    });
    return;
  }

  const days = parseInt(daysStr, 10);
  if (isNaN(days) || days <= 0) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Days must be a positive number`,
    });
    return;
  }

  const reason = reasonParts.join(' ') || undefined;

  try {
    // Ensure target user exists
    await createOrGetUser(targetUser);
    
    await tempBanUser(targetUser, ctx.repoId, days, reason);
    
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `✅ User @${targetUser} has been temporarily banned for ${days} day(s).${reason ? `\nReason: ${reason}` : ''}`,
    });
  } catch (error) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Failed to temp ban user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Handle the unban command
 */
async function handleUnban(ctx: CommandContext, context: Context<'issue_comment.created'> | Context<'pull_request_review_comment.created'>) {
  const [targetUserRaw] = ctx.args;
  const targetUser = normalizeUsername(targetUserRaw);
  const issueNumber = 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number;
  
  if (!targetUser) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Usage: \`@contribution-patrol unban <username>\``,
    });
    return;
  }

  try {
    await unbanUser(targetUser, ctx.repoId);
    
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `✅ User @${targetUser} has been unbanned from this repository.`,
    });
  } catch (error) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Failed to unban user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Handle the whitelist command (maintainer only)
 */
async function handleWhitelist(ctx: CommandContext, context: Context<'issue_comment.created'> | Context<'pull_request_review_comment.created'>) {
  const issueNumber = 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number;
  
  if (!isMaintainer(ctx.commenter, ctx.owner)) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Only repository maintainers can use the whitelist command.`,
    });
    return;
  }

  const [targetUserRaw] = ctx.args;
  const targetUser = targetUserRaw ? normalizeUsername(targetUserRaw) : undefined;
  
  if (!targetUser) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Usage: \`@contribution-patrol whitelist <username>\``,
    });
    return;
  }

  try {
    // Ensure target user exists
    await createOrGetUser(targetUser);
    
    await addTrustedUser(targetUser, ctx.repoId);
    
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `✅ User @${targetUser} has been added to the whitelist and can now use moderation commands.`,
    });
  } catch (error) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Failed to whitelist user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Handle the unwhitelist command (maintainer only)
 */
async function handleUnwhitelist(ctx: CommandContext, context: Context<'issue_comment.created'> | Context<'pull_request_review_comment.created'>) {
  const issueNumber = 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number;
  
  if (!isMaintainer(ctx.commenter, ctx.owner)) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Only repository maintainers can use the unwhitelist command.`,
    });
    return;
  }

  const [targetUserRaw] = ctx.args;
  const targetUser = targetUserRaw ? normalizeUsername(targetUserRaw) : undefined;
  
  if (!targetUser) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Usage: \`@contribution-patrol unwhitelist <username>\``,
    });
    return;
  }

  try {
    await removeTrustedUser(targetUser, ctx.repoId);
    
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `✅ User @${targetUser} has been removed from the whitelist.`,
    });
  } catch (error) {
    await context.octokit.issues.createComment({
      owner: ctx.owner,
      repo: ctx.repoName,
      issue_number: issueNumber,
      body: `❌ Failed to unwhitelist user: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Main command handler
 */
export async function handleCommand(
  command: string,
  args: string[],
  context: Context<'issue_comment.created'> | Context<'pull_request_review_comment.created'>
) {
  const commenter = context.payload.comment.user.login;
  const owner = context.payload.repository.owner.login;
  const repoName = context.payload.repository.name;
  const issueNumber = 'issue' in context.payload ? context.payload.issue.number : context.payload.pull_request.number;

  // Get repository from database
  const repo = await getRepository(owner, repoName);
  if (!repo) {
    await context.octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: `❌ Repository not registered. Please reinstall the app.`,
    });
    return;
  }

  const isMaintainerUser = isMaintainer(commenter, owner);
  const isTrusted = await isTrustedUser(commenter, repo.id);

  const ctx: CommandContext = {
    commenter,
    owner,
    repoName,
    repoId: repo.id,
    args,
  };

  // Commands available to maintainers and trusted users
  const moderationCommands = ['ban', 'tempban', 'unban'];
  
  // Commands available only to maintainers
  const maintainerCommands = ['whitelist', 'unwhitelist'];

  if (moderationCommands.includes(command)) {
    if (!isMaintainerUser && !isTrusted) {
      await context.octokit.issues.createComment({
        owner,
        repo: repoName,
        issue_number: issueNumber,
        body: `❌ You must be a repository maintainer or whitelisted user to use moderation commands.`,
      });
      return;
    }

    switch (command) {
      case 'ban':
        await handleBan(ctx, context);
        break;
      case 'tempban':
        await handleTempBan(ctx, context);
        break;
      case 'unban':
        await handleUnban(ctx, context);
        break;
    }
  } else if (maintainerCommands.includes(command)) {
    if (!isMaintainerUser) {
      await context.octokit.issues.createComment({
        owner,
        repo: repoName,
        issue_number: issueNumber,
        body: `❌ Only repository maintainers can use the ${command} command.`,
      });
      return;
    }

    switch (command) {
      case 'whitelist':
        await handleWhitelist(ctx, context);
        break;
      case 'unwhitelist':
        await handleUnwhitelist(ctx, context);
        break;
    }
  } else {
    await context.octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: `❌ Unknown command: \`${command}\`\n\nAvailable commands:\n- \`ban <username> [reason]\` - Permanently ban a user (maintainer/whitelist)\n- \`tempban <username> <days> [reason]\` - Temporarily ban a user (maintainer/whitelist)\n- \`unban <username>\` - Unban a user (maintainer/whitelist)\n- \`whitelist <username>\` - Add user to whitelist (maintainer only)\n- \`unwhitelist <username>\` - Remove user from whitelist (maintainer only)`,
    });
  }
}
