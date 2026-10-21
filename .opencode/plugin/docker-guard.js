import { Plugin } from "@opencode/plugin"
import { backendRoot, blocked, blockedFirebase, composeFileSet, normalizePath, pathOf, reasonText } from "./docker-guard-rules.js"

export { backendRoot, blocked, blockedFirebase, pathOf, reasonText } from "./docker-guard-rules.js"

export default Plugin.define({
  id: "mibeca.docker-guard",
  async setup(ctx) {
    const root = ctx.location.directory || globalThis.process.cwd();
    const backend = backendRoot(root);
    const composeFiles = composeFileSet(backend);

    await ctx.tool.hook("execute.before", (event) => {
      if (event.tool !== "bash") return;
      const args = event.input || {};
      const command = args.command;
      if (typeof command !== "string" || !command) return;

      const cwd = pathOf(args.workdir || root, normalizePath(root));
      const condition = blocked(command, cwd, backend, composeFiles);
      const firebaseCondition = blockedFirebase(command);
      if (condition === null && firebaseCondition === null) return;

      throw new Error(reasonText(condition || firebaseCondition));
    });
  },
});
