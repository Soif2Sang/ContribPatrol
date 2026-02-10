import { Probot } from "probot";
import { createOrGetUser } from "./services/userService.js";
import { registerRepositories, getRepository } from "./services/repositoryService.js";
import { parseCommand, handleCommand } from "./services/commandService.js";
import { isBanned } from "./services/banService.js";

export default (app: Probot) => {
  app.on("pull_request.opened", async (context) => {
    const user = context.payload.pull_request.user.login;
    const owner = context.payload.repository.owner.login;
    const repoName = context.payload.repository.name;
    
    console.log(`Nouvelle PR détectée de la part de : ${user}`);

    try {
      // Ensure user exists in database
      await createOrGetUser(user);

      // Get repository from database
      const repo = await getRepository(owner, repoName);
      if (!repo) {
        console.log(`Repository ${owner}/${repoName} not found in database`);
        return;
      }

      // Check if user is banned
      const userIsBanned = await isBanned(user, repo.id);
      console.log(`User ${user} ban status for repo ${repo.id}: ${userIsBanned}`);
      
      if (userIsBanned) {
        console.log(`User ${user} is banned, closing PR #${context.payload.pull_request.number}`);
        
        // Close the pull request
        await context.octokit.pulls.update({
          owner,
          repo: repoName,
          pull_number: context.payload.pull_request.number,
          state: 'closed',
        });

        // Add a comment explaining why
        await context.octokit.issues.createComment({
          owner,
          repo: repoName,
          issue_number: context.payload.pull_request.number,
          body: `🚫 This pull request has been automatically closed because @${user} is currently banned from contributing to this repository.`,
        });

        // Add label
        try {
          await context.octokit.issues.addLabels({
            owner,
            repo: repoName,
            issue_number: context.payload.pull_request.number,
            labels: ['spam'],
          });
        } catch (error) {
          console.log(`Could not add label (label may not exist): ${error}`);
        }
      }
    } catch (error) {
      console.error(`Error processing pull_request.opened for ${user}:`, error);
    }
  });

  // Handle comments on pull request conversations
  app.on("issue_comment.created", async (context) => {
    // Only process if this is a pull request comment
    if (!context.payload.issue.pull_request) {
      return;
    }

    const commentBody = context.payload.comment.body;

    // Check if comment mentions the bot
    if (commentBody.includes("@contribution-patrol")) {
      const parsed = parseCommand(commentBody);
      
      if (parsed) {
        await handleCommand(parsed.command, parsed.args, context);
      }
    }
  });

  // Handle comments on pull request code reviews
  app.on("pull_request_review_comment.created", async (context) => {
    const commentBody = context.payload.comment.body;

    // Check if comment mentions the bot
    if (commentBody.includes("@contribution-patrol")) {
      const parsed = parseCommand(commentBody);
      
      if (parsed) {
        await handleCommand(parsed.command, parsed.args, context);
      }
    }
  });

  app.on("installation.created", async (context) => {
    const sender = context.payload.sender;
      const repos = context.payload.repositories || [];

    // Create or get user
    await createOrGetUser(sender.login);

    // Register all repositories from the installation
    await registerRepositories(repos);
    
    console.log(`Installation created by ${sender.login} for ${repos.length} repositories`);
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
