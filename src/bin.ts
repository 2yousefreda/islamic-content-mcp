#!/usr/bin/env node
import { runServer } from "./index.js";

runServer().catch((error) => {
  console.error("Failed to start Islamic Content MCP Server:", error);
  process.exit(1);
});
