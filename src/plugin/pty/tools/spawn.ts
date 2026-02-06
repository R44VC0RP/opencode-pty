import { tool } from "@opencode-ai/plugin";
import { manager } from "../manager.ts";
import { checkCommandPermission, checkWorkdirPermission } from "../permissions.ts";
import DESCRIPTION from "./spawn.txt";

// Shells that don't need wrapping
const SHELL_COMMANDS = new Set(["bash", "zsh", "sh", "fish", "tcsh", "csh", "ksh", "dash"]);

export const ptySpawn = tool({
  description: DESCRIPTION,
  args: {
    command: tool.schema.string().describe("The command/executable to run"),
    args: tool.schema.array(tool.schema.string()).optional().describe("Arguments to pass to the command"),
    workdir: tool.schema.string().optional().describe("Working directory for the PTY session"),
    env: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Additional environment variables"),
    title: tool.schema.string().optional().describe("Human-readable title for the session"),
    description: tool.schema.string().describe("Clear, concise description of what this PTY session is for in 5-10 words"),
    shell: tool.schema.boolean().optional().describe("Wrap command in a shell so the PTY stays alive after command exits (default: true)"),
  },
  async execute(args, ctx) {
    await checkCommandPermission(args.command, args.args ?? []);

    if (args.workdir) {
      await checkWorkdirPermission(args.workdir);
    }

    const sessionId = ctx.sessionID;
    const useShell = args.shell !== false; // default true
    const isAlreadyShell = SHELL_COMMANDS.has(args.command);

    let spawnCommand: string;
    let spawnArgs: string[];
    let displayCommand: string;

    if (useShell && !isAlreadyShell) {
      // Build the full command string
      const fullCommand = [args.command, ...(args.args ?? [])].join(" ");
      displayCommand = fullCommand;
      
      // Wrap in bash: run command, then drop into interactive shell
      spawnCommand = "bash";
      spawnArgs = ["-c", `${fullCommand}; exec bash -l`];
    } else {
      // Run command directly (existing behavior)
      spawnCommand = args.command;
      spawnArgs = args.args ?? [];
      displayCommand = [spawnCommand, ...spawnArgs].join(" ");
    }

    const info = manager.spawn({
      command: spawnCommand,
      args: spawnArgs,
      workdir: args.workdir,
      env: args.env,
      title: args.title,
      parentSessionId: sessionId,
    });

    const output = [
      `<pty_spawned>`,
      `ID: ${info.id}`,
      `Title: ${info.title}`,
      `Command: ${displayCommand}`,
      `Workdir: ${info.workdir}`,
      `PID: ${info.pid}`,
      `Status: ${info.status}`,
      useShell && !isAlreadyShell ? `Shell: enabled (PTY stays alive after command exits)` : null,
      `</pty_spawned>`,
    ].filter(Boolean).join("\n");

    return output;
  },
});
