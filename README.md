# Islamic Content MCP Server

An official **Model Context Protocol (MCP) Server** designed to connect AI assistants (like Claude Desktop, Cursor, VS Code, etc.) to authentic Islamic content (the Holy Qur'an, Hadith, and Islamic resources) in multiple languages. 

This server acts as a bridge for the [`islamic-content-sdk`](https://github.com/2yousefreda/islamic-content-sdk-npm), exposing its endpoints as tools and documentation as resources so that AI models can fetch live content and learn how to develop code using both the **NPM (JS/TS)** and **PIP (Python)** libraries.

---

## Features

- **Quran Services**: Fetch surah and ayah translations (via QuranEnc & IslamHouse Quran), retrieve MP3 audio files, and submit notes/suggestions.
- **Hadith Services**: Access Hadeeth listings, categories, translations, and explanations (via HadeethEnc).
- **IslamHouse Library**: Retrieve categorized books, audios, videos, fatwas, articles, author data, and translations in dozens of languages.
- **Al-Montaka, Bayan Al-Islam & Risalat Al-Haramain**: Access specialized Islamic databases, lookup tables, and targeted content lists.
- **Built-in Developer Resource**: Exposes a direct guide (`sdk://docs/guide`) to teach AI models how to write and import SDK code for both Python and TypeScript.

---

## Installation & Configuration

To use this MCP server, you must have **Node.js (v18+)** installed on your system.

### 1. Claude Desktop Integration

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

### 2. Cursor Integration

1. Go to **Settings** > **Features** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the details:
   - **Name**: `Islamic Content`
   - **Type**: `stdio`
   - **Command**: `npx -y islamic-content-mcp-server`
4. Click **Save**.

---

## Available Tools

The MCP server registers **over 80 tools** organized by their target service:

### Quran
- `quranenc_translation_list`: Get lists of translations (e.g. English, French, Urdu).
- `quranenc_translation_sura`: Fetch translation for a complete surah.
- `quranenc_translation_aya`: Fetch translation for a specific ayah.
- `quranenc_aya_audio`: Get audio file URL (MP3) for an ayah.
- `islamhouse_quran_categories`, `islamhouse_quran_sura_details`, etc.

### Hadith
- `hadeethenc_languages`: Get supported translation languages.
- `hadeethenc_categories`: Retrieve Hadith categories.
- `hadeethenc_hadiths_list`: List hadiths inside a category.
- `hadeethenc_hadith_details`: Get the Arabic text, translation, explanation, and references of a single hadith.

### IslamHouse General
- `islamhouse_list_items`: Query books, audios, videos, and fatwas.
- `islamhouse_item_details`: Fetch full details and attachments (PDFs/Audios) of an item.
- `islamhouse_list_authors`: Get authors/scholars details.

### Specialized Services
- **Al-Montaka**: `almontaka_content`, `almontaka_comments`, lookup tables (entities, tags, etc.).
- **Bayan Al-Islam**: `bayan_muslim_list`, `bayan_name_search`, `bayan_content_translation`.
- **Risalat Al-Haramain**: `risala_get_contents`, `risala_fatwas`, `risala_hadeeths`.

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
node dist/index.js
```

To configure your AI client to use your local development folder, change the config to:
```json
"command": "node",
"args": ["/path/to/islamic-content-mcp/dist/index.js"]
```

---

## License

This project is licensed under the **ISC License**.
