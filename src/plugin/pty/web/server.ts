/**
 * Web server for PTY session management.
 * Provides HTTP API and WebSocket connections for real-time terminal streaming.
 */

import type { ServerWebSocket } from "bun";
import { manager } from "../manager.ts";
import { emitter } from "../emitter.ts";
import { createLogger } from "../../logger.ts";
import { DASHBOARD_HTML } from "./static/index.ts";

const log = createLogger("web-server");

interface WebSocketData {
  sessionId: string;
  unsubOutput?: () => void;
  unsubState?: () => void;
}

type WSMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "history"; offset?: number; limit?: number };

let activeServer: ReturnType<typeof Bun.serve> | null = null;

/**
 * Start the web server for PTY management.
 */
export function startWebServer(port: number = 7681): ReturnType<typeof Bun.serve> {
  if (activeServer) {
    log.warn("web server already running", { port: activeServer.port });
    return activeServer;
  }

  log.info("starting web server", { port });

  activeServer = Bun.serve<WebSocketData>({
    port,
    hostname: "localhost", // Bind to localhost only for security

    fetch(req, server) {
      const url = new URL(req.url);

      // WebSocket upgrade for terminal connections
      if (url.pathname === "/ws") {
        const sessionId = url.searchParams.get("session");
        if (!sessionId) {
          return new Response("Missing session parameter", { status: 400 });
        }

        const session = manager.get(sessionId);
        if (!session) {
          return new Response(`Session '${sessionId}' not found`, { status: 404 });
        }

        const upgraded = server.upgrade(req, {
          data: { sessionId },
        });

        if (upgraded) {
          return undefined; // Bun handles the response
        }
        return new Response("WebSocket upgrade failed", { status: 500 });
      }

      // HTTP API routes
      if (url.pathname === "/api/sessions") {
        const sessions = manager.list();
        return Response.json(sessions);
      }

      if (url.pathname.startsWith("/api/sessions/")) {
        const sessionId = url.pathname.split("/")[3];
        if (!sessionId) {
          return new Response("Invalid session ID", { status: 400 });
        }
        const session = manager.get(sessionId);
        if (!session) {
          return Response.json({ error: "Session not found" }, { status: 404 });
        }
        return Response.json(session);
      }

      // Serve dashboard
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(DASHBOARD_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      return new Response("Not Found", { status: 404 });
    },

    websocket: {
      open(ws: ServerWebSocket<WebSocketData>) {
        const { sessionId } = ws.data;
        log.info("websocket connected", { sessionId });

        // Send current session info
        const session = manager.get(sessionId);
        if (session) {
          ws.send(JSON.stringify({
            type: "session",
            session,
          }));
        }

        // Subscribe to output events
        ws.data.unsubOutput = emitter.subscribeOutput(sessionId, (data) => {
          try {
            ws.send(JSON.stringify({ type: "output", data }));
          } catch {
            // Connection might be closed
          }
        });

        // Subscribe to state events
        ws.data.unsubState = emitter.subscribeState(sessionId, (status, exitCode) => {
          try {
            ws.send(JSON.stringify({ type: "state", status, exitCode }));
          } catch {
            // Connection might be closed
          }
        });
      },

      message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        const { sessionId } = ws.data;

        try {
          const msg = JSON.parse(message.toString()) as WSMessage;

          switch (msg.type) {
            case "input": {
              const success = manager.write(sessionId, msg.data);
              if (!success) {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Failed to write to session",
                }));
              }
              break;
            }

            case "history": {
              const result = manager.read(sessionId, msg.offset ?? 0, msg.limit ?? 1000);
              if (result) {
                // Send history as raw output for xterm to render
                const historyData = result.lines.join("");
                ws.send(JSON.stringify({
                  type: "history",
                  data: historyData,
                  totalLines: result.totalLines,
                  hasMore: result.hasMore,
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Failed to read history",
                }));
              }
              break;
            }

            case "resize": {
              // TODO: Implement resize when bun-pty supports it
              log.info("resize requested", { sessionId, cols: msg.cols, rows: msg.rows });
              break;
            }

            default:
              ws.send(JSON.stringify({
                type: "error",
                message: `Unknown message type`,
              }));
          }
        } catch (e) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid message format",
          }));
        }
      },

      close(ws: ServerWebSocket<WebSocketData>) {
        const { sessionId } = ws.data;
        log.info("websocket disconnected", { sessionId });

        // Unsubscribe from events
        ws.data.unsubOutput?.();
        ws.data.unsubState?.();
      },

      drain(ws: ServerWebSocket<WebSocketData>) {
        // Called when the socket is ready to receive more data after backpressure
      },
    },
  });

  log.info("web server started", { url: `http://localhost:${port}` });
  return activeServer;
}

/**
 * Stop the web server.
 */
export function stopWebServer(): boolean {
  if (!activeServer) {
    log.warn("web server not running");
    return false;
  }

  log.info("stopping web server");
  activeServer.stop();
  activeServer = null;
  return true;
}

/**
 * Get the active server instance.
 */
export function getWebServer(): ReturnType<typeof Bun.serve> | null {
  return activeServer;
}

/**
 * Check if the web server is running.
 */
export function isWebServerRunning(): boolean {
  return activeServer !== null;
}
