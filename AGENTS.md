# AGENTS.md - AI Coding Agent Guidelines for opencode-pty

This document provides guidelines for AI coding agents working on this codebase.

## Project Overview

opencode-pty is an OpenCode plugin that provides interactive PTY (pseudo-terminal)
management. It allows AI agents to run background processes, send interactive input,
and read output on demand.

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript (strict mode)
- **Module System**: ES Modules (`"type": "module"`)
- **Package Manager**: Bun

## Build, Lint, and Test Commands

```bash
# Install dependencies
bun install

# Type checking (primary validation - no linting configured)
bun run typecheck
# or directly:
tsc --noEmit

# Run all tests
bun test

# Run a single test file
bun test src/plugin/pty/buffer.test.ts

# Run tests matching a pattern
bun test --grep "RingBuffer"

# Run tests with watch mode
bun test --watch
```

### Release Commands

```bash
# Bump version and push (triggers GitHub Actions release)
./release.sh --patch   # 0.1.0 -> 0.1.1
./release.sh --minor   # 0.1.0 -> 0.2.0
./release.sh --major   # 0.1.0 -> 1.0.0
./release.sh --dry-run # Preview without changes
```

## Project Structure

```
opencode-pty/
├── index.ts                    # Main entry point (exports PTYPlugin)
├── src/
│   ├── plugin.ts               # Plugin initialization and tool registration
│   └── plugin/
│       ├── logger.ts           # Logging utility (integrates with OpenCode)
│       ├── types.ts            # Plugin-level type definitions
│       └── pty/
│           ├── buffer.ts       # Ring buffer for output storage
│           ├── manager.ts      # PTY session management (singleton)
│           ├── permissions.ts  # Permission checking against OpenCode config
│           ├── types.ts        # PTY-specific types
│           ├── wildcard.ts     # Wildcard pattern matching for permissions
│           └── tools/          # Tool implementations
│               ├── kill.ts + kill.txt
│               ├── list.ts + list.txt
│               ├── read.ts + read.txt
│               ├── spawn.ts + spawn.txt
│               └── write.ts + write.txt
```

## Code Style Guidelines

### Imports

- Use `.ts` file extensions in imports (required by TypeScript config)
- Use `import type { ... }` for type-only imports (enforced by `verbatimModuleSyntax`)
- Order: external packages first, then internal modules

```typescript
// Correct
import { tool } from "@opencode-ai/plugin";
import type { PluginClient } from "../types.ts";
import { manager } from "../manager.ts";
import DESCRIPTION from "./spawn.txt";

// Incorrect - missing .ts extension
import { manager } from "../manager";
```

### TypeScript Conventions

- **Strict mode is enabled** - no implicit any, strict null checks, etc.
- Use `noUncheckedIndexedAccess` - array/object index access may be undefined
- Use explicit types for function parameters and return values
- Use interfaces for object shapes, type aliases for unions

```typescript
// Handle potential undefined from array access
const line = lines[i];
if (line !== undefined && pattern.test(line)) {
  matches.push({ lineNumber: i + 1, text: line });
}
```

### Naming Conventions

- **Files**: lowercase with hyphens (e.g., `buffer.ts`, `wildcard.ts`)
- **Classes**: PascalCase (e.g., `RingBuffer`, `PTYManager`)
- **Interfaces/Types**: PascalCase (e.g., `PTYSession`, `SpawnOptions`)
- **Functions/Variables**: camelCase (e.g., `createLogger`, `sessionId`)
- **Constants**: SCREAMING_SNAKE_CASE for env-derived values, camelCase otherwise
- **PTY IDs**: Use `pty_` prefix with 8 hex characters (e.g., `pty_a1b2c3d4`)

### Error Handling

- Throw descriptive `Error` objects with actionable messages
- Include context about what failed and how to fix it
- Use try/catch for external operations (API calls, process spawning)

```typescript
// Good - descriptive error with fix suggestion
throw new Error(
  `PTY session '${args.id}' not found. Use pty_list to see active sessions.`
);

// Good - catch and handle external failures gracefully
try {
  session.process.kill();
} catch {}  // Silently ignore if process already dead
```

### Logging

Use the custom logger that integrates with OpenCode:

```typescript
import { createLogger } from "../logger.ts";
const log = createLogger("module-name");

log.info("spawning pty", { id, command: opts.command, args, workdir });
log.warn("failed to get config", { error: String(e) });
log.error("unexpected failure", { error: String(e) });
```

## Tool Definition Pattern

Each tool consists of two files:
- **TypeScript file** (e.g., `spawn.ts`): Contains the implementation
- **Text file** (e.g., `spawn.txt`): Contains the description (imported as raw text)

```typescript
import { tool } from "@opencode-ai/plugin";
import DESCRIPTION from "./spawn.txt";

export const ptySpawn = tool({
  description: DESCRIPTION,
  args: {
    command: tool.schema.string().describe("The command/executable to run"),
    args: tool.schema.array(tool.schema.string()).optional().describe("..."),
    // ... more args
  },
  async execute(args, ctx) {
    // Implementation
    // Return string output for the agent
  },
});
```

### Tool Output Format

Use XML-like tags for structured output that agents can parse:

```typescript
const output = [
  `<pty_spawned>`,
  `ID: ${info.id}`,
  `Title: ${info.title}`,
  `Command: ${info.command} ${info.args.join(" ")}`,
  `</pty_spawned>`,
].join("\n");
```

## Key Patterns

### Singleton Manager

The `PTYManager` is a singleton exported as `manager`:

```typescript
export const manager = new PTYManager();
```

### Permission Checking

Commands are checked against OpenCode's permission configuration:
- "allow" - permitted
- "deny" - blocked with error
- "ask" - treated as "deny" (plugins cannot show permission prompts)

## Testing Guidelines

- Use Bun's built-in test runner
- Test files should be colocated with source (e.g., `buffer.test.ts`)
- No test configuration files needed - Bun auto-discovers `*.test.ts`

## Dependencies

- **Runtime**: `bun-pty` - Cross-platform PTY for Bun
- **Dev**: `@opencode-ai/plugin`, `@opencode-ai/sdk` - OpenCode plugin SDK
- **Peer**: `typescript@^5`
