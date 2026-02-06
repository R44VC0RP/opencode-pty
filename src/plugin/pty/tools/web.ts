import { tool } from "@opencode-ai/plugin";
import { startWebServer, stopWebServer, isWebServerRunning, getWebServer } from "../web/server.ts";
import DESCRIPTION from "./web.txt";

export const ptyWeb = tool({
  description: DESCRIPTION,
  args: {
    action: tool.schema
      .enum(["start", "stop", "status"])
      .default("start")
      .describe("Action to perform: start, stop, or status"),
    port: tool.schema
      .number()
      .optional()
      .describe("Port number for the web server (default: 7681)"),
  },
  async execute(args) {
    const port = args.port ?? 7681;

    switch (args.action) {
      case "start": {
        if (isWebServerRunning()) {
          const server = getWebServer();
          return [
            `<pty_web_status>`,
            `Status: already running`,
            `URL: http://localhost:${server?.port ?? port}`,
            `</pty_web_status>`,
          ].join("\n");
        }

        const server = startWebServer(port);
        return [
          `<pty_web_started>`,
          `Status: running`,
          `URL: http://localhost:${server.port}`,
          ``,
          `Open this URL in your browser to view and control PTY sessions.`,
          `</pty_web_started>`,
        ].join("\n");
      }

      case "stop": {
        if (!isWebServerRunning()) {
          return [
            `<pty_web_status>`,
            `Status: not running`,
            `</pty_web_status>`,
          ].join("\n");
        }

        stopWebServer();
        return [
          `<pty_web_stopped>`,
          `Status: stopped`,
          `</pty_web_stopped>`,
        ].join("\n");
      }

      case "status": {
        if (isWebServerRunning()) {
          const server = getWebServer();
          return [
            `<pty_web_status>`,
            `Status: running`,
            `URL: http://localhost:${server?.port ?? port}`,
            `</pty_web_status>`,
          ].join("\n");
        }
        return [
          `<pty_web_status>`,
          `Status: not running`,
          `</pty_web_status>`,
        ].join("\n");
      }

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
  },
});
