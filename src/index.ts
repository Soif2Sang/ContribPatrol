import { Probot } from "probot";
import { createOrGetUser } from "./services/userService.js";
import { registerRepositories } from "./services/repositoryService.js";

export default (app: Probot) => {
  app.on("issues.opened", async (context) => {
    console.log("Événement reçu ! Tentative de commentaire...");
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    await context.octokit.issues.createComment(issueComment);
  });
  app.on("pull_request.opened", async (context) => {
    const user = context.payload.pull_request.user.login;
    console.log(`Nouvelle PR détectée de la part de : ${user}`);
  });

  app.on("issue_comment.created", async (context) => {
    const commentBody = context.payload.comment.body;
    const commenter = context.payload.comment.user.login;
    const owner = context.payload.repository.owner.login;

    if (commentBody.includes("@contribution-patrol")) {
      if (commenter === owner) {
        console.log("Commande validée : L'utilisateur est le Owner.");
      } else {
        console.log("Commande refusée : L'utilisateur n'est pas le Owner.");
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
