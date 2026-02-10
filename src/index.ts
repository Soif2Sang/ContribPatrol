import { Probot } from "probot";
import { createOrGetUser } from "./services/userService.js";
import { registerRepositories } from "./services/repositoryService.js";
import { parseCommand, handleCommand } from "./services/commandService.js";

export default (app: Probot) => {
  app.on("pull_request.opened", async (context) => {
    const user = context.payload.pull_request.user.login;
    console.log(`Nouvelle PR détectée de la part de : ${user}`);
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
