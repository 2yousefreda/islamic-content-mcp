# Islamic Content Model Context Protocol (MCP) Server

[![NPM Version](https://img.shields.io/npm/v/islamic-content-mcp-server?color=blue&label=mcp-server)](https://www.npmjs.com/package/islamic-content-mcp-server)
[![License](https://img.shields.io/npm/l/islamic-content-mcp-server)](LICENSE)

An official **Model Context Protocol (MCP) Server** developed for [The Association for Multi-lingual Islamic Content](https://islamiccontent.sa/) designed to connect AI applications, custom LLM agents, and AI assistants to authentic Islamic content (the Holy Qur'an, Hadith, and Islamic resources) in multiple languages.

This server acts as a bridge for the [`islamic-content-sdk`](https://github.com/2yousefreda/islamic-content-sdk-npm), exposing its endpoints as tools and documentation as resources so that AI models can fetch live content and learn how to develop code using both the [NPM (JS/TS)](https://www.npmjs.com/package/islamic-content-sdk) and [PIP (Python)](https://pypi.org/project/islamic-content-sdk/) libraries.

---

## Official SDKs

- **NPM Package**: [`islamic-content-sdk`](https://www.npmjs.com/package/islamic-content-sdk)
- **PyPI Package**: [`islamic-content-sdk`](https://pypi.org/project/islamic-content-sdk/)

---

## Features

- **Quran Services**: Consolidated endpoint `quran_services` and `islamhouse_quran` for translations, audio, reciters, and categories.
- **Hadith Services**: Consolidated endpoint `hadeethenc_services` for categories, translations, and explanations.
- **IslamHouse Library**: Centralized endpoint `islamhouse_library` for books, audios, videos, fatwas, articles, author data, and translations.
- **Bayan Al-Islam & Risalat Al-Haramain**: Powerful endpoints `bayan_al_islam` and `risalat_al_haramain` for specialized Islamic databases, lookup tables, and targeted content lists.

---

## LLM Integration & Custom Clients (Code Integration)

This MCP server is designed primarily to connect authentic Islamic content directly to your AI applications and custom LLM workflows.

### 1. Install Dependencies
```bash
npm install islamic-content-mcp-server
# Also install your preferred LLM library (e.g., openai, @google/genai, @anthropic-ai/sdk)
```

### 2. Simple Integration (RAG / Context Retrieval)
The easiest way is to use the built-in client to gather context programmatically and feed it to the LLM:

```javascript
import { IslamicContentMCPClient } from "islamic-content-mcp-server";
import OpenAI from "openai";

// 1. Initialize and connect the client (starts the server internally via stdio)
const client = new IslamicContentMCPClient();
await client.connect();

// 2. Fetch structured context (customize these values to fit your application's user search)
const context = await client.getContext({
  topic: "Prayer",              // Replace with your dynamic topic (e.g., "Fasting", "Charity", "Faith")
  sources: ["quran", "hadith"], // Specify sources: "quran", "hadith", or both
  language: "en"                // Language context: "en", "ar", etc.
});

// 3. Feed the context to your LLM
const openai = new OpenAI();
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: `Use the following authentic context to answer the user's question:\n\n${context}`
    },
    {
      role: "user",
      content: "What does the Quran say about prayer?"
    }
  ]
});

console.log(completion.choices[0].message.content);

// 4. Clean up
await client.disconnect();
```

### 3. Agentic Integration (Dynamic Tool Calling)
You can also pass the MCP tools directly to the LLM so it can dynamically decide when to call specific tools (e.g. searching Hadiths, loading suras, or fetching audio) to answer user prompts.

Click below to view the integration code for your preferred platform:

<details>
<summary><b>Google Gemini (NodeJS using @google/genai)</b></summary>

```javascript
import { IslamicContentMCPClient } from "islamic-content-mcp-server";
import { GoogleGenAI } from '@google/genai';

// Initialize and connect the client (starts the server internally via stdio)
const client = new IslamicContentMCPClient();
await client.connect();

const tools = await client.getTools();
const geminiTools = tools.map(tool => ({
  functionDeclarations: [{
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }]
}));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const userPrompt = "Tell me a Hadith about Prayer from authentic sources.";

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: userPrompt,
  config: { tools: geminiTools }
});

const functionCalls = response.functionCalls;
if (functionCalls && functionCalls.length > 0) {
  const call = functionCalls[0];
  const toolResult = await client.callTool(call.name, call.args);
  
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: userPrompt }] },
      { role: 'model', parts: [{ functionCall: call }] },
      { role: 'user', parts: [{ functionResponse: { name: call.name, response: { content: toolResult } } }] }
    ]
  });
  console.log("Gemini response:\n", finalResponse.text);
} else {
  console.log("Gemini response:\n", response.text);
}

await client.disconnect();
```
</details>

<details>
<summary><b>OpenAI GPT (NodeJS using openai)</b></summary>

```javascript
import { IslamicContentMCPClient } from "islamic-content-mcp-server";
import OpenAI from "openai";

const client = new IslamicContentMCPClient();
await client.connect();

const tools = await client.getTools();
const openaiTools = tools.map(tool => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }
}));

const openai = new OpenAI();
const messages = [{ role: "user", content: "Tell me the translation of Hadith number 66512 in English." }];

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages,
  tools: openaiTools
});

const toolCalls = response.choices[0].message.tool_calls;
if (toolCalls && toolCalls.length > 0) {
  const toolCall = toolCalls[0];
  const toolResult = await client.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));

  messages.push(response.choices[0].message);
  messages.push({
    role: "tool",
    tool_call_id: toolCall.id,
    content: JSON.stringify(toolResult)
  });

  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages
  });
  console.log("OpenAI response:\n", finalResponse.choices[0].message.content);
} else {
  console.log("OpenAI response:\n", response.choices[0].message.content);
}

await client.disconnect();
```
</details>

<details>
<summary><b>Anthropic Claude (NodeJS using @anthropic-ai/sdk)</b></summary>

```javascript
import { IslamicContentMCPClient } from "islamic-content-mcp-server";
import Anthropic from "@anthropic-ai/sdk";

const client = new IslamicContentMCPClient();
await client.connect();

const tools = await client.getTools();
const claudeTools = tools.map(tool => ({
  name: tool.name,
  description: tool.description,
  input_schema: tool.inputSchema
}));

const anthropic = new Anthropic();
const userPrompt = "Fetch the translation of Surah Al-Fatiha in English.";

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  tools: claudeTools,
  messages: [{ role: "user", content: userPrompt }]
});

const toolUse = response.content.find(block => block.type === "tool_use");
if (toolUse) {
  const toolResult = await client.callTool(toolUse.name, toolUse.input);

  const finalResponse = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    tools: claudeTools,
    messages: [
      { role: "user", content: userPrompt },
      { role: "assistant", content: response.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult)
          }
        ]
      }
    ]
  });
  console.log("Claude response:\n", finalResponse.content[0].text);
} else {
  console.log("Claude response:\n", response.content[0].text);
}

await client.disconnect();
```
</details>

<details>
<summary><b>Python Application (using official mcp package)</b></summary>

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Launches the Node server via npx on stdio
server_params = StdioServerParameters(
    command="npx",
    args=["-y", "islamic-content-mcp-server"]
)

async def run():
    async with stdio_client(server_params) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            # Initialize connection
            await session.initialize()
            
            # List available tools
            tools = await session.list_tools()
            print(f"Loaded {len(tools.tools)} tools.")
            
            # Call tool: quranenc_translation_aya
            result = await session.call_tool("quranenc_translation_aya", {
                "translationKey": "english_saheeh",
                "suraNumber": 1,
                "ayaNumber": 1
            })
            
            print("Translation Result:")
            print(result.content[0].text)

if __name__ == "__main__":
    asyncio.run(run())
```
</details>

---

## Connecting to AI Desktop & IDE Clients

You can load this MCP server directly into AI-powered IDEs and desktop assistants. Click below to view the configurations:

<details>
<summary><b>Claude Desktop</b></summary>

Add the server config to your Claude Desktop configuration file:
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following block under `mcpServers`:

```json
{
  "mcpServers": {
    "islamic-content": {
      "command": "npx",
      "args": [
        "-y",
        "islamic-content-mcp-server"
      ]
    }
  }
}
```

*Note: Replace `npx` with the absolute path to npm/npx if your client cannot locate it globally.*
</details>

<details>
<summary><b>Cursor</b></summary>

1. Go to **Settings** > **Features** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the details:
   - **Name**: `Islamic Content`
   - **Type**: `stdio`
   - **Command**: `npx -y islamic-content-mcp-server`
4. Click **Save**.
</details>

<details>
<summary><b>VS Code (via Cline / Roo Code / Roo Cline)</b></summary>

Add the configuration block under `mcpServers` inside your MCP settings file:
* **Windows**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` (or similar depending on the extension version)
* **macOS**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "islamic-content": {
      "command": "npx",
      "args": [
        "-y",
        "islamic-content-mcp-server"
      ]
    }
  }
}
```
</details>

<details>
<summary><b>Windsurf</b></summary>

Add the configuration block under `mcpServers` in your Windsurf MCP configuration file:
* **Path**: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "islamic-content": {
      "command": "npx",
      "args": [
        "-y",
        "islamic-content-mcp-server"
      ]
    }
  }
}
```
</details>

<details>
<summary><b>Antigravity IDE</b></summary>

Add the configuration block under `mcpServers` in your Antigravity configuration file:
* **Windows**: `C:\Users\<YourUsername>\.gemini\antigravity-ide\mcp_config.json`
* **macOS**: `~/.gemini/antigravity-ide/mcp_config.json`

```json
{
  "mcpServers": {
    "islamic-content": {
      "command": "npx",
      "args": [
        "-y",
        "islamic-content-mcp-server"
      ]
    }
  }
}
```
</details>

---

## Exposed Tools (Consolidated)

To optimize for AI Context Windows and LLM Tool Calls, the server exposes 6 powerful, parameter-driven tools. Use the `action` parameter to select the behavior of the tool.

### 1. `quran_services` (QuranEnc)
Fetch Quran translations and audio via QuranEnc.
- **Actions**: `list_translations`, `get_sura_translation`, `get_aya_translation`, `get_aya_audio`

### 2. `islamhouse_quran`
Fetch Quran categories, reciters, and audio from IslamHouse.
- **Actions**: `list_categories`, `get_category`, `get_author`, `get_author_recitations`, `get_sura_details`, `get_sura_recitations`, `get_recitation_details`

### 3. `hadeethenc_services`
Fetch Hadith categories, lists, and translations from HadeethEnc.
- **Actions**: `list_languages`, `list_categories`, `list_root_categories`, `list_hadiths`, `get_hadith_details`

### 4. `islamhouse_library`
Access the IslamHouse Library for books, audios, videos, fatwas, articles, and author data.
- **Actions**: `get_types`, `get_categories`, `get_categories_tree`, `get_child_categories`, `get_category_basic`, `get_sub_categories`, `get_category_types`, `get_category_languages`, `list_items`, `get_author_items`, `get_category_items`, `get_latest_items`, `get_highlighted_items`, `get_items_count`, `get_item_details`, `get_item_attachments`, `get_item_tree`, `get_item_card_translations`, `get_item_translations`, `list_authors`, `get_author_details`, `get_author_card_translations`, `get_author_available_types`, `get_author_available_locales`, `list_languages`, `get_language_terms`, `get_language_availability`

### 5. `bayan_al_islam`
Access Bayan Al-Islam for targeted Islamic content.
- **Actions**: `list_languages`, `list_muslim_content`, `list_non_muslim_content`, `get_content`, `list_paginated_languages`, `get_recent_contents`, `get_lookups`, `search_name`, `get_available_languages`, `get_content_translation`, `get_attachments_translation`

### 6. `risalat_al_haramain`
Access Risalat Al-Haramain for fatwas, hadeeths, and contents.
- **Actions**: `get_full_contents`, `get_contents`, `get_content`, `search_name`, `search_contents`, `get_available_languages`, `get_content_translation`, `get_fatwas`, `get_hadeeths`, `get_quran`, `get_lookups_languages`, `get_lookups_content_types`

### 7. `al_montaka`
Access Al Montaka to fetch general content and metadata lookups.
- **Actions**: `list_contents`, `get_comments`, `get_lookups_age_groups`, `get_lookups_categories`, `get_lookups_entities`, `get_lookups_expert_levels`, `get_lookups_ideologies`, `get_lookups_languages`, `get_lookups_persons`, `get_lookups_sections`, `get_lookups_tags`, `get_lookups_targeted_groups`, `get_lookups_youtube_channels`

---

## Developer Guide (Local Development)

If you want to clone, modify, or run the server locally:

### 1. Clone the Repository
```bash
git clone https://github.com/2yousefreda/islamic-content-mcp.git
cd islamic-content-mcp
```

### 2. Install Dependencies & Build
```bash
npm install
npm run build
```

### 3. Run Locally (via Stdio)
```bash
node dist/bin.js
```

To configure your AI client to use your local development folder, change the config to:
```json
"command": "node",
"args": ["/path/to/islamic-content-mcp/dist/bin.js"]
```

---

## Donation & Support

You can support the projects and efforts of The Association for Multi-lingual Islamic Content through the following official channels:

- [Support Projects (Wakfy)](https://islamiccontent.org/Wakfy)
- [Bank Accounts](https://islamiccontent.org/Accounts)
- [Association Store](https://store.islamiccontent.sa/)
- [Annual Operational Support (الدعم التشغيلي السنوي للجمعية)](https://store.islamiccontent.sa/%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%8وفات-الترميمية-السنوية-للجمعية/p1950956689)

---

## License

This project is licensed under the **ISC License**.
