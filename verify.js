import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "dist", "index.js");

console.log("Starting MCP Server verification from:", serverPath);

const mcpProcess = spawn("node", [serverPath]);

let buffer = "";

mcpProcess.stdout.on("data", (data) => {
  buffer += data.toString();
  try {
    // Try to parse JSON-RPC messages if newline separated or complete json
    const lines = buffer.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        console.log("\nReceived from MCP Server:\n", JSON.stringify(JSON.parse(line), null, 2));
      }
    }
    buffer = lines[lines.length - 1];
  } catch (e) {
    // Keep buffering if it's incomplete
  }
});

mcpProcess.stderr.on("data", (data) => {
  console.log("LOG (stderr):", data.toString().trim());
});

mcpProcess.on("exit", (code) => {
  console.log("MCP Server exited with code:", code);
});

function sendRequest(requestObj) {
  const reqStr = JSON.stringify(requestObj) + "\n";
  console.log("\nSending to MCP Server:\n", JSON.stringify(requestObj, null, 2));
  mcpProcess.stdin.write(reqStr);
}

// Wait 1 second for initialization, then send tools/list
setTimeout(() => {
  sendRequest({
    jsonrpc: "2.0",
    method: "tools/list",
    id: 1,
    params: {}
  });
}, 1000);

// Wait 3 seconds, then test a tool call (quranenc_translation_list)
setTimeout(() => {
  sendRequest({
    jsonrpc: "2.0",
    method: "tools/call",
    id: 2,
    params: {
      name: "quranenc_translation_list",
      arguments: {
        language: "en"
      }
    }
  });
}, 3000);

// Wait 5 seconds, then test resources/list
setTimeout(() => {
  sendRequest({
    jsonrpc: "2.0",
    method: "resources/list",
    id: 3,
    params: {}
  });
}, 5000);

// Wait 7 seconds, then test resources/read
setTimeout(() => {
  sendRequest({
    jsonrpc: "2.0",
    method: "resources/read",
    id: 4,
    params: {
      uri: "sdk://docs/guide"
    }
  });
}, 7000);

// Wait 10 seconds, then exit
setTimeout(() => {
  console.log("Verification finished. Killing process...");
  mcpProcess.kill();
}, 10000);
