#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { IslamicContentSdk } from "islamic-content-sdk";

const sdk = new IslamicContentSdk();

const server = new Server(
  {
    name: "islamic-content-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Expose the documentation guide as an MCP Resource
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "sdk://docs/guide",
        name: "Islamic Content SDK Integration Guide (NPM & PIP)",
        mimeType: "text/markdown",
        description: "Official guide on how to import, initialize, and use the Islamic Content SDK in both Python (PIP) and Node.js (NPM/TS)."
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "sdk://docs/guide") {
    const markdownContent = `
# Islamic Content SDK Integration Guide

This guide describes how to use the \`islamic-content-sdk\` in both Node.js (TypeScript/JavaScript) and Python environments. Both SDKs expose identical service names, method structures, and arguments.

---

## 1. Python (PIP SDK) Usage

### Installation
\`\`\`bash
pip install islamic-content-sdk
\`\`\`

### Import and Initialization
\`\`\`python
from islamic_content_sdk import IslamicContentSdk

# Initialize the client
sdk = IslamicContentSdk()
\`\`\`

### Basic Usage Example
\`\`\`python
# Get a surah translation
sura_translation = sdk.quranenc.translationSura("en_sahih", 1)
print(sura_translation)

# Get list of categories for Hadiths in English
categories = sdk.hadeethenc.categories("en")
print(categories)
\`\`\`

---

## 2. Node.js (NPM SDK) Usage

### Installation
\`\`\`bash
npm install islamic-content-sdk
\`\`\`

### Import and Initialization
\`\`\`typescript
import { IslamicContentSdk } from "islamic-content-sdk";

// Initialize the client
const sdk = new IslamicContentSdk();
\`\`\`

### Basic Usage Example (Async/Await)
\`\`\`typescript
async function run() {
  // Get a surah translation
  const suraTranslation = await sdk.quranenc.translationSura("en_sahih", 1);
  console.log(suraTranslation);

  // Get list of categories for Hadiths in English
  const categories = await sdk.hadeethenc.categories("en");
  console.log(categories);
}

run();
\`\`\`

---

## 3. Structure Mapping Reference

Both SDKs contain the exact same services:
1. **\`quranenc\`**: Quran translations and audio services.
   - Methods: \`translationList(params)\`, \`translationSura(translation_key, sura_number)\`, \`translationAya(translation_key, sura_number, aya_number)\`, \`ayaAudio(translation_key, sura_number, aya_number)\`, \`addNote(payload)\`
2. **\`hadeethenc\`**: Hadith services.
   - Methods: \`languages()\`, \`categories(languageCode)\`, \`rootCategories(languageCode)\`, \`hadithsList(params)\`, \`hadithDetails(params)\`
3. **\`islamhouse\`**: IslamHouse library content.
   - Sub-services: \`categoriesAndTypes\`, \`items\`, \`item\`, \`authors\`, \`languages\`, \`quran\`
4. **\`alMontaka\`**: Al-Montaka resources.
   - Sub-services: \`contents\`, \`lookups\`
5. **\`bayanAlIslam\`**: Bayan Al-Islam website content.
6. **\`risalatAlHaramain\`**: Risalat Al-Haramain website resources.
`;

    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: markdownContent
        }
      ]
    };
  }

  throw new Error(`Resource ${uri} not found`);
});

// Define tool lists and schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
  {
    name: "quran_services",
    description: `Access QuranEnc to fetch Quran textual translations, translations lists, and ayah-level audio.
Unlike islamhouse_quran, this tool specializes strictly in text-based translations of meanings and single-ayah audio, rather than full recitations or reciter data.

**Behavior**: Read-only. Idempotent. No authentication required. No strict rate limits.
**Usage Guidelines**:
- Use this tool when you need the textual translation of an Ayah or Sura in a specific language, or a short audio clip of one Ayah.
- Do NOT use this tool for full Sura recitations or fetching reciter profiles (use \`islamhouse_quran\` instead).
**Action Mapping & Parameters**:
- \`list_translations\`: Requires \`language\` (optional \`localization\`). Returns a JSON array of available translations.
- \`get_sura_translation\`: Requires \`translationKey\` and \`suraNumber\`. Returns a JSON object with the translation of the full Sura.
- \`get_aya_translation\`: Requires \`translationKey\`, \`suraNumber\`, and \`ayaNumber\`. Returns a JSON object with the specific Ayah's text.
- \`get_aya_audio\`: Requires \`translationKey\`, \`suraNumber\`, and \`ayaNumber\`. Returns a JSON object with an audio URL for the Ayah.
**Returns**: A JSON array or object containing the requested QuranEnc data.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_translations', 'get_sura_translation', 'get_aya_translation', 'get_aya_audio'"
        },
        language: {
          type: "string",
          description: "Language code (e.g. 'en')"
        },
        localization: {
          type: "string",
          description: "Localization language (e.g. 'en')"
        },
        translationKey: {
          type: "string",
          description: "Translation identifier (e.g. 'en_sahih')"
        },
        suraNumber: {
          type: "integer",
          description: "Surah number (1-114)"
        },
        ayaNumber: {
          type: "integer",
          description: "Ayah number"
        }
      },
      required: [
        "action"
      ]
    }
  },
  {
    name: "islamhouse_quran",
    description: `Access IslamHouse to fetch Quranic audio recitations, reciter (author) profiles, and Sura recitation metadata.
Unlike quran_services, this specializes in high-quality, full-Sura audio recitations and reciter catalogs rather than textual translations.

**Behavior:** Read-only. Idempotent. No authentication. Returns 404/empty on invalid IDs, with safe fallbacks on missing audio.
**Usage Guidelines:**
- Use for full audio recitations of the Quran or reciter information (e.g., Al-Sudais).
- Do NOT use for fetching written Quran text/translations (use \`quran_services\` instead).
**Action Mapping:**
- \`list_categories\`: \`language\` (ISO-639-1) -> Category[] { id: number, title: string }
- \`get_category\`, \`get_author\`: \`language\` (ISO-639-1), \`id\` (int) -> { id, title, description, count }
- \`get_author_recitations\`: \`id\` (author ID, int), \`language\` (ISO-639-1) -> { data: [{ recitationId, title }] }
- \`get_sura_recitations\`: \`suraId\` (int 1-114), \`language\` (ISO-639-1) -> { suraId, name, recitations: [] }
- \`get_recitation_details\`: \`id\` (recitation ID, int), \`language\` (ISO-639-1) -> { id, reciterId, audioUrl, duration }`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_categories', 'get_category', 'get_author', 'get_author_recitations', 'get_sura_recitations', 'get_recitation_details'"
        },
        language: {
          type: "string",
          description: "Language code (e.g. 'ar', 'en')"
        },
        id: {
          type: "integer",
          description: "Category, Author, or Recitation ID"
        },
        suraId: {
          type: "integer",
          description: "Surah ID (1-114)"
        }
      },
      required: [
        "action",
        "language"
      ]
    }
  },
  {
    name: "hadeethenc_services",
    description: `Access HadeethEnc to fetch authentic Hadith texts, categories, and translations in multiple languages.
This is the only tool dedicated exclusively to Hadith texts and their detailed explanations.

**Behavior:** Read-only. Idempotent. No authentication. No strict rate limits. Returns empty if ID not found.
**Usage Guidelines:**
- Use when the user asks for Prophetic sayings, Hadith translations, or scholarly explanations.
- Do NOT use for official fatwas or general books (use \`islamhouse_library\` or \`risalat_al_haramain\`).
**Action Mapping:**
- \`list_languages\`, \`list_categories\`, \`list_root_categories\`: \`languageCode\` (ISO-639-1) -> Returns { categories: [{ id, title, hadeeths_count }] }
- \`list_hadiths\`: \`language\`, \`categoryId\` (int), \`page\` (int), \`perPage\` (int) -> Returns { data: [{ id, title }] }
- \`get_hadith_details\`: \`id\` (int), \`language\` (ISO-639-1) -> Returns { id, hadeeth, explanation, translations: [] }
**Returns:** JSON array for lists or a detailed JSON object containing specific Hadith text and translations.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_languages', 'list_categories', 'list_root_categories', 'list_hadiths', 'get_hadith_details'"
        },
        languageCode: {
          type: "string",
          description: "Language code for categories (e.g. 'en')"
        },
        language: {
          type: "string",
          description: "Language code for lists/details (e.g. 'en')"
        },
        categoryId: {
          type: "integer",
          description: "Category ID"
        },
        id: {
          type: "integer",
          description: "Hadith ID"
        },
        page: {
          type: "integer",
          description: "Page number"
        },
        perPage: {
          type: "integer",
          description: "Items per page"
        }
      },
      required: [
        "action"
      ]
    }
  },
  {
    name: "islamhouse_library",
    description: `Access IslamHouse Library for books, audios, videos, fatwas, articles, and author metadata. Excludes Quran recitations (use 'islamhouse_quran') and Hadith texts (use 'hadeethenc_services').

**Behavior:** Read-only, idempotent, public access (no auth/rate limits). Cached dynamically with real-time freshness. Fallback to English on missing translations; returns empty arrays for unknown IDs; returns 400 error payload on invalid actions or malformed parameters.

**Usage Guidelines:**
- Use for: Scholarly books, articles, fatwas, multimedia, and author biographies.
- Do NOT use for: Raw Quran text/audio ('islamhouse_quran' / 'quran_services') or Hadith collections ('hadeethenc_services').

**Parameters & Enums:**
- \`action\`: API operation (see Action Groups below).
- \`type\`: Content format enum: \`books\`, \`audios\`, \`videos\`, \`fatwas\`, \`articles\`.
- \`period\`: Trending window enum: \`daily\`, \`weekly\`, \`monthly\`.
- \`sort\`: Ordering enum: \`popular\`, \`newest\`, \`oldest\`.
- \`kind\`: Scope filter enum: \`main\`, \`sub\`.
- \`language\`, \`siteLang\`, \`contentLang\`, \`slang\`, \`locale\`: 2-letter ISO-639-1 codes (e.g., 'en', 'ar').
- \`page\`, \`limit\`: Integer pagination controls.
- \`id\`, \`categoryId\`, \`authorId\`: Positive integer identifiers.

**Action Groups & Returns:**
- Taxonomy (\`list_categories\`, \`list_types\`, \`get_categories_tree\`): Requires \`language\` -> Array of \`{ id: number, name: string, parentId?: number }\`.
- Listings (\`list_items\`, \`get_latest_items\`, \`get_highlighted_items\`): Uses \`page\`, \`limit\`, \`type\`, [categoryId/authorId/period/sort/contentLang] -> \`{ data: ItemSummary[], total: number, page: number }\`.
- Aggregations (\`get_items_count\`): Uses \`type\`, [categoryId/contentLang] -> \`{ type: string, total: number }\`.
- Details (\`get_item_details\`, \`get_item_attachments\`, \`get_item_translations\`): Requires \`id\`, [language] -> Detailed \`{ id, title, description, attachments: Attachment[], locales: string[] }\`.
- Authors (\`get_author_details\`, \`list_authors\`): Uses \`id\`, \`page\`, \`limit\`, [language, kind, locale, sort] -> Author profile with \`{ id, name, biography, itemsCount: number }\`.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. Action to perform, e.g. 'get_types', 'get_categories', 'get_categories_tree', 'get_child_categories', 'get_category_basic', 'get_sub_categories', 'get_category_types', 'get_category_languages', 'list_items', 'get_author_items', 'get_category_items', 'get_latest_items', 'get_highlighted_items', 'get_items_count', 'get_item_details', 'get_item_attachments', 'get_item_tree', 'get_item_card_translations', 'get_item_translations', 'get_author_details', 'list_authors', 'get_author_card_translations', 'get_author_available_types', 'get_author_available_locales', 'list_languages', 'get_language_terms', 'get_language_availability'"
        },
        id: {
          type: "integer"
        },
        siteLang: {
          type: "string"
        },
        contentLang: {
          type: "string"
        },
        slang: {
          type: "string"
        },
        language: {
          type: "string"
        },
        type: {
          type: "string"
        },
        period: {
          type: "string"
        },
        authorId: {
          type: "integer"
        },
        categoryId: {
          type: "integer"
        },
        page: {
          type: "integer"
        },
        limit: {
          type: "integer"
        },
        kind: {
          type: "string"
        },
        locale: {
          type: "string"
        },
        sort: {
          type: "string"
        }
      },
      required: [
        "action"
      ]
    }
  },
  {
    name: "bayan_al_islam",
    description: `Access Bayan Al-Islam to fetch specialized Islamic content targeting Muslims and Non-Muslims, including translated articles and structured lookups.
Unlike the general IslamHouse library, this provides curated content categorized by the target audience's faith perspective.

**Behavior:** Read-only. Idempotent. No authentication. Falls back to default language if translation is missing.
**Usage Guidelines:**
- Use when seeking content specifically tailored for non-Muslims, or curated responses to common questions.
- Do NOT use for raw Hadith (use \`hadeethenc_services\`) or Quran recitations (use \`islamhouse_quran\` or \`quran_services\`).
**Action Mapping:**
- \`list_languages\`, \`list_paginated_languages\`: \`language\`, \`page\` (int), [\`name\`] -> Returns { languages: [{ code, name }] }
- \`list_muslim_content\`, \`list_non_muslim_content\`: \`language\` -> Returns { paths: [] }
- \`get_content\`, \`search_name\`: \`id\` (int) or \`name\` (string), \`language\` -> Returns { id, title, body, matchingResults: [] }
- \`get_recent_contents\`: \`ids\` (array of ints), \`init\` (bool), \`lang\` (overrides \`language\`) -> Returns { recentItems: [] }
- \`get_lookups\`, \`get_available_languages\`: \`id\` (int), \`language\` -> Returns { metadata: [] }
- \`get_content_translation\`, \`get_attachments_translation\`: \`id\` (int), \`targetLanguage\` (ISO-639-1), \`language\` -> Returns { translatedBody, attachments: [] }
**Returns:** Concrete JSON payload { id, title, body, paths: [], recentItems: [] } containing targeted content.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_languages', 'list_muslim_content', 'list_non_muslim_content', 'list_paginated_languages', 'get_recent_contents', 'get_lookups', 'search_name'"
        },
        id: {
          type: "integer"
        },
        language: {
          type: "string"
        },
        name: {
          type: "string"
        },
        lang: {
          type: "string"
        },
        init: {
          type: "boolean"
        },
        ids: {
          type: "array",
          items: {
            type: "integer"
          }
        },
        targetLanguage: {
          type: "string"
        },
        page: {
          type: "integer"
        }
      },
      required: [
        "action"
      ]
    }
  },
  {
    name: "risalat_al_haramain",
    description: `Access Risalat Al-Haramain to fetch official Haramain (Two Holy Mosques) fatwas, Friday sermons, specific hadeeths, and institutional contents.
Specializes in official decrees and sermons originating from Mecca and Medina, distinguishing it from general libraries.

**Behavior:** Read-only. Idempotent. Public endpoints have no auth. Lookup endpoints require \`apiKey\`. Handles rate limits via graceful empty returns.
**Usage Guidelines:**
- Use for Friday sermons from the Haramain, official fatwas from Haramain scholars, or institutional news.
- Do NOT use for general Islamic books (use \`islamhouse_library\`).
**Action Mapping:**
- \`get_full_contents\`, \`get_contents\`: \`language\`, \`lang\` -> Returns { data: [{ id, title, date }] }
- \`get_fatwas\`, \`get_hadeeths\`, \`get_quran\`: \`language\`, \`lang\`, [\`isFeatured\` (0/1)] -> Returns { data: [{ id, content }] }
- \`get_content\`: \`id\` (int), \`language\` -> Returns { id, title, body, mediaUrls: [] }
- \`search_contents\`: \`query\` (string), \`language\` -> Returns { results: [{ id, title }] }
- \`get_lookups_languages\`, \`get_lookups_content_types\`: \`language\`, [\`apiKey\`] -> Returns { lookups: [] }
**Returns:** Concrete JSON object { data: [], lookups: [], results: [] } for Haramain official releases.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'get_full_contents', 'get_contents', 'get_content', 'search_contents', 'get_fatwas', 'get_hadeeths', 'get_quran', 'get_lookups_languages', 'get_lookups_content_types'"
        },
        id: {
          type: "integer"
        },
        language: {
          type: "string"
        },
        lang: {
          type: "string"
        },
        name: {
          type: "string"
        },
        targetLanguage: {
          type: "string"
        },
        query: {
          type: "string"
        },
        page: {
          type: "integer"
        },
        isFeatured: {
          type: "integer"
        },
        apiKey: {
          type: "string"
        }
      },
      required: [
        "action"
      ]
    }
  },
  {
    name: "al_montaka",
    description: `Access Al Montaka to fetch general content. Note: Content fetching by category is currently unstable upstream, so use it to fetch the latest general content instead.
    
**Action Mapping:**
- \`list_contents\`: \`page\` (int) -> Returns { data: [], meta: {} }
- \`get_comments\`: \`id\` (int) -> Returns comments for content
- \`get_lookups_age_groups\`, \`get_lookups_languages\`, \`get_lookups_targeted_groups\`, \`get_lookups_youtube_channels\`: No args -> Returns lookups array
- \`get_lookups_categories\`, \`get_lookups_entities\`, \`get_lookups_expert_levels\`, \`get_lookups_sections\`, \`get_lookups_tags\`: \`languageId\` (int), [\`nameCont\`] -> Returns lookups array
- \`get_lookups_ideologies\`: \`languageId\` (int), \`parentId\` (int), [\`nameCont\`] -> Returns lookups array
- \`get_lookups_persons\`: [\`nameCont\`], [\`page\`] -> Returns lookups array`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_contents', 'get_comments', 'get_lookups_age_groups', 'get_lookups_categories', 'get_lookups_entities', 'get_lookups_expert_levels', 'get_lookups_ideologies', 'get_lookups_languages', 'get_lookups_persons', 'get_lookups_sections', 'get_lookups_tags', 'get_lookups_targeted_groups', 'get_lookups_youtube_channels'"
        },
        id: { type: "integer" },
        page: { type: "integer" },
        languageId: { type: "integer" },
        parentId: { type: "integer" },
        nameCont: { type: "string" }
      },
      required: ["action"]
    }
  }
]
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const anyArgs = (args || {}) as any;

  // Helper functions
  const requireArgs = (keys: string[]) => {
    const missing = keys.filter(k => anyArgs[k] === undefined || anyArgs[k] === null || anyArgs[k] === "");
    if (missing.length > 0) {
      throw new Error(`Missing required arguments: ${missing.join(", ")}`);
    }
  };

  const paginateResponse = (data: any, page?: number, limit?: number): any => {
      if (!page && !limit) return data;
      const p = page ? Number(page) : 1;
      const l = limit ? Number(limit) : 10;
      const start = (p - 1) * l;
      const end = start + l;
      
      if (Array.isArray(data)) {
          return data.slice(start, end);
      }
      if (typeof data === 'object') {
          const clone = { ...data };
          for (const key of Object.keys(clone)) {
              if (Array.isArray(clone[key])) {
                  clone[key] = clone[key].slice(start, end);
              }
          }
          return clone;
      }
      return data;
  };

  const limitResponseSize = (data: any, maxChars = 40000): any => {
    if (!data) return data;
    let jsonString = JSON.stringify(data);
    if (jsonString.length <= maxChars) return data;
    
    const clone = JSON.parse(jsonString); // deep copy
    let truncated = false;
  
    const trimLargestArray = (obj: any): boolean => {
      let largestArray: any[] | null = null;
      let maxLen = 0;
      const traverse = (o: any) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) {
          if (o.length > maxLen) {
            maxLen = o.length;
            largestArray = o;
          }
          o.forEach(traverse);
        } else {
          Object.values(o).forEach(traverse);
        }
      };
      traverse(obj);
      if (largestArray && (largestArray as any[]).length > 1) {
        (largestArray as any[]).length = Math.ceil((largestArray as any[]).length / 2);
        return true;
      }
      return false;
    };
  
    while (JSON.stringify(clone).length > maxChars) {
      const trimmed = trimLargestArray(clone);
      if (!trimmed) break;
      truncated = true;
    }
    
    if (JSON.stringify(clone).length > maxChars) {
        const traverseTrimStrings = (o: any) => {
            if (!o || typeof o !== 'object') return;
            for (const key of Object.keys(o)) {
                if (typeof o[key] === 'string' && o[key].length > 500) {
                    o[key] = o[key].substring(0, 500) + "... [truncated]";
                    truncated = true;
                } else if (typeof o[key] === 'object') {
                    traverseTrimStrings(o[key]);
                }
            }
        }
        traverseTrimStrings(clone);
    }
  
    if (truncated) {
      if (Array.isArray(clone)) {
         (clone as any)._truncated = true;
         (clone as any)._hint = `Payload was too large and was aggressively truncated to under ${maxChars} chars. Please specify smaller page limits if pagination is supported.`;
      } else {
         clone._truncated = true;
         clone._hint = `Payload was too large and was aggressively truncated to under ${maxChars} chars. Please specify smaller page limits if pagination is supported.`;
      }
    }
    
    return clone;
  };

  const lang = anyArgs.language || anyArgs.languageCode || anyArgs.lang || anyArgs.siteLang || anyArgs.localization || "ar";
  const siteLang = anyArgs.siteLang || lang;
  const contentLang = anyArgs.contentLang || lang;
  const slang = anyArgs.slang || lang;

  try {
    requireArgs(["action"]);
    let result: any;

    switch (name) {
      case "quran_services":
        switch (anyArgs.action) {
          case "list_translations": result = await sdk.quranenc.translationList({ language: lang, localization: lang }); break;
          case "get_sura_translation": 
            requireArgs(["translationKey", "suraNumber"]);
            if (Number(anyArgs.suraNumber) < 1 || Number(anyArgs.suraNumber) > 114) throw new Error("suraNumber must be between 1 and 114");
            result = await sdk.quranenc.translationSura(anyArgs.translationKey, Number(anyArgs.suraNumber)); 
            break;
          case "get_aya_translation": 
            requireArgs(["translationKey", "suraNumber", "ayaNumber"]);
            if (Number(anyArgs.suraNumber) < 1 || Number(anyArgs.suraNumber) > 114) throw new Error("suraNumber must be between 1 and 114");
            if (Number(anyArgs.ayaNumber) < 1) throw new Error("ayaNumber must be positive");
            result = await sdk.quranenc.translationAya(anyArgs.translationKey, Number(anyArgs.suraNumber), Number(anyArgs.ayaNumber)); 
            break;
          case "get_aya_audio": 
            requireArgs(["translationKey", "suraNumber", "ayaNumber"]);
            if (Number(anyArgs.suraNumber) < 1 || Number(anyArgs.suraNumber) > 114) throw new Error("suraNumber must be between 1 and 114");
            if (Number(anyArgs.ayaNumber) < 1) throw new Error("ayaNumber must be positive");
            result = await sdk.quranenc.ayaAudio(anyArgs.translationKey, Number(anyArgs.suraNumber), Number(anyArgs.ayaNumber)); 
            break;
          default: throw new Error("Invalid action for quran_services");
        }
        break;

      case "islamhouse_quran":
        switch (anyArgs.action) {
          case "list_categories": result = await sdk.islamhouse.quran.categories(lang); break;
          case "get_category": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.quran.singleCategory(Number(anyArgs.id), lang); 
            break;
          case "get_author": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.quran.authorDetails(Number(anyArgs.id), lang); 
            break;
          case "get_author_recitations": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.quran.authorRecitations(Number(anyArgs.id), lang); 
            break;
          case "get_sura_details": 
            requireArgs(["suraId"]);
            result = await sdk.islamhouse.quran.suraDetails(Number(anyArgs.suraId), lang); 
            break;
          case "get_sura_recitations": 
            requireArgs(["suraId"]);
            if (Number(anyArgs.suraId) < 1 || Number(anyArgs.suraId) > 114) throw new Error("suraId must be between 1 and 114");
            result = await sdk.islamhouse.quran.suraRecitations(Number(anyArgs.suraId), lang); 
            break;
          case "get_recitation_details": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.quran.recitationDetails(Number(anyArgs.id), lang); 
            break;
          default: throw new Error("Invalid action for islamhouse_quran");
        }
        break;

      case "hadeethenc_services":
        switch (anyArgs.action) {
          case "list_languages": result = await sdk.hadeethenc.languages(); break;
          case "list_categories": 
            result = await sdk.hadeethenc.categories(lang, anyArgs.categoryId !== undefined ? Number(anyArgs.categoryId) : undefined); 
            break;
          case "list_root_categories": result = await sdk.hadeethenc.rootCategories(lang); break;
          case "list_hadiths": 
            result = await sdk.hadeethenc.hadithsList({ language: lang, categoryId: anyArgs.categoryId !== undefined ? Number(anyArgs.categoryId) : undefined, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, perPage: anyArgs.perPage !== undefined ? Number(anyArgs.perPage) : undefined }); 
            break;
          case "get_hadith_details": 
            requireArgs(["id"]);
            result = await sdk.hadeethenc.hadithDetails({ id: Number(anyArgs.id), language: lang }); 
            break;
          default: throw new Error("Invalid action for hadeethenc_services");
        }
        break;

      case "islamhouse_library":
        switch (anyArgs.action) {
          case "get_types": result = await sdk.islamhouse.categoriesAndTypes.allTypes(siteLang, contentLang); break;
          case "get_categories": result = await sdk.islamhouse.categoriesAndTypes.allCategories(lang); break;
          case "get_categories_tree": result = await sdk.islamhouse.categoriesAndTypes.categoriesTree(lang); break;
          case "get_child_categories": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.categoriesAndTypes.childCategories(Number(anyArgs.id), siteLang, contentLang); 
            break;
          case "get_category_basic": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.categoriesAndTypes.singleCategoryBasic(Number(anyArgs.id), lang); 
            break;
          case "get_sub_categories": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.categoriesAndTypes.subCategories(Number(anyArgs.id), lang); 
            break;
          case "get_category_types": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.categoriesAndTypes.categoryTypes(Number(anyArgs.id), siteLang, contentLang); 
            break;
          case "get_category_languages": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.categoriesAndTypes.categoryLanguages(Number(anyArgs.id), slang, lang); 
            break;
          case "list_items": 
            requireArgs(["type"]);
            result = await sdk.islamhouse.items.listItems(anyArgs.type, siteLang, slang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); 
            break;
          case "get_author_items": 
            requireArgs(["authorId"]);
            result = await sdk.islamhouse.items.authorItems(Number(anyArgs.authorId), slang, siteLang, contentLang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); 
            break;
          case "get_category_items": 
            requireArgs(["categoryId"]);
            result = await sdk.islamhouse.items.categoryItems(Number(anyArgs.categoryId), slang, siteLang, contentLang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); 
            break;
          case "get_latest_items": 
            requireArgs(["period"]);
            result = await sdk.islamhouse.items.latestItems(anyArgs.period, slang, siteLang, contentLang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); 
            break;
          case "get_highlighted_items": result = await sdk.islamhouse.items.highlightedItems(siteLang, contentLang); break;
          case "get_items_count": 
            requireArgs(["type"]);
            result = await sdk.islamhouse.items.itemsCount(anyArgs.type, siteLang, contentLang); 
            break;
          case "get_item_details": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.item.details(Number(anyArgs.id), lang); 
            break;
          case "get_item_attachments": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.item.attachments(Number(anyArgs.id)); 
            break;
          case "get_item_tree": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.item.tree(Number(anyArgs.id), lang); 
            break;
          case "get_item_card_translations": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.item.cardTranslations(Number(anyArgs.id), lang); 
            break;
          case "get_item_translations": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.item.translations(Number(anyArgs.id), lang); 
            break;
          case "get_author_details": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.authors.details(Number(anyArgs.id), lang); 
            break;
          case "get_author_card_translations": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.authors.cardTranslations(Number(anyArgs.id), lang); 
            break;
          case "get_author_available_types": 
            requireArgs(["id"]);
            result = await sdk.islamhouse.authors.availableTypes(Number(anyArgs.id), siteLang, contentLang); 
            break;
          case "get_author_available_locales": 
            requireArgs(["id", "slang"]);
            result = await sdk.islamhouse.authors.availableLocales(Number(anyArgs.id), anyArgs.slang, lang); 
            break;
          case "list_authors": 
            result = await sdk.islamhouse.authors.list({ kind: anyArgs.kind, locale: anyArgs.locale, sort: anyArgs.sort, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, perPage: anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined }); 
            break;
          // Languages
          case "list_languages": result = await sdk.islamhouse.languages.keys(); break;
          case "get_language_terms": result = await sdk.islamhouse.languages.terms(lang); break;
          case "get_language_availability": result = await sdk.islamhouse.languages.availableLanguages(slang, lang); break;
          default: throw new Error("Invalid action for islamhouse_library");
        }
        break;

      case "bayan_al_islam":
        switch (anyArgs.action) {
          case "list_languages": result = await sdk.bayanAlIslam.languagesList(lang); break;
          case "list_muslim_content": result = await sdk.bayanAlIslam.muslimList(lang, anyArgs.page !== undefined ? Number(anyArgs.page) : 1); break;
          case "list_non_muslim_content": result = await sdk.bayanAlIslam.nonMuslimList(lang, anyArgs.page !== undefined ? Number(anyArgs.page) : 1); break;

          case "list_paginated_languages": result = await sdk.bayanAlIslam.paginatedLanguages({ name: anyArgs.name, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, language: lang }); break;
          case "get_recent_contents": result = await sdk.bayanAlIslam.recentContents({ lang: lang, init: Boolean(anyArgs.init), ids: Array.isArray(anyArgs.ids) ? anyArgs.ids.map(Number) : undefined, language: lang }); break;
          case "get_lookups": result = await sdk.bayanAlIslam.lookups(lang); break;
          case "search_name": 
            requireArgs(["name"]);
            result = await sdk.bayanAlIslam.nameSearch(anyArgs.name, lang); 
            if (result && Array.isArray(result.matchingResults) && result.matchingResults.length === 0) {
              result._hint = "No results found. Note that name_search only matches titles. Try browsing categories or using different keywords.";
            } else if (Array.isArray(result) && result.length === 0) {
              result = { data: [], _hint: "No results found. Note that name_search only matches titles. Try browsing categories or using different keywords." };
            }
            break;



          default: throw new Error("Invalid action for bayan_al_islam");
        }
        break;

      case "risalat_al_haramain":
        switch (anyArgs.action) {
          case "get_full_contents": result = await sdk.risalatAlHaramain.contents.getFullContents({ language: lang, lang: lang }); break;
          case "get_contents": result = await sdk.risalatAlHaramain.contents.getContents({ language: lang, lang: lang }); break;
          case "get_content": 
            requireArgs(["id"]);
            result = await sdk.risalatAlHaramain.contents.singleContent(Number(anyArgs.id), lang); 
            break;
          case "get_fatwas": result = await sdk.risalatAlHaramain.islamicContent.fatwas({ language: lang, lang: lang, isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined }); break;
          case "get_hadeeths": result = await sdk.risalatAlHaramain.islamicContent.hadeeths({ language: lang, lang: lang, isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined }); break;
          case "get_quran": result = await sdk.risalatAlHaramain.islamicContent.quran({ language: lang, lang: lang, isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined }); break;
          case "search_contents": 
            requireArgs(["query"]);
            result = await sdk.risalatAlHaramain.search.contents(anyArgs.query, lang, anyArgs.page !== undefined ? Number(anyArgs.page) : 1); 
            if (result && Array.isArray(result.results) && result.results.length === 0) {
              result._hint = "No results found. Try using different keywords.";
            } else if (Array.isArray(result) && result.length === 0) {
              result = { data: [], _hint: "No results found. Try using different keywords." };
            }
            break;
          case "get_lookups_languages": result = await sdk.risalatAlHaramain.lookups.languages(lang, anyArgs.apiKey); break;
          case "get_lookups_content_types": result = await sdk.risalatAlHaramain.lookups.contentTypes(lang); break;
          case "get_available_languages": 
            requireArgs(["id"]);
            result = await sdk.risalatAlHaramain.contents.availableLanguages(Number(anyArgs.id), lang); 
            break;
          case "get_content_translation": 
            requireArgs(["id", "targetLanguage"]);
            result = await sdk.risalatAlHaramain.contents.contentTranslation(Number(anyArgs.id), anyArgs.targetLanguage, lang); 
            break;
          default: throw new Error("Invalid action for risalat_al_haramain");
        }
        break;

      case "al_montaka":
        switch (anyArgs.action) {
          case "list_contents": result = await sdk.alMontaka.contents.list(anyArgs.page !== undefined ? Number(anyArgs.page) : 1); break;
          case "get_comments": 
            requireArgs(["id"]);
            result = await sdk.alMontaka.contents.comments(Number(anyArgs.id)); 
            break;
          case "get_lookups_age_groups": result = await sdk.alMontaka.lookups.ageGroups(); break;
          case "get_lookups_categories": 
            requireArgs(["languageId"]);
            result = await sdk.alMontaka.lookups.categories({ languageId: Number(anyArgs.languageId), nameCont: anyArgs.nameCont || "" }); 
            break;
          case "get_lookups_entities": 
            requireArgs(["languageId"]);
            result = await sdk.alMontaka.lookups.entities({ languageId: Number(anyArgs.languageId), nameCont: anyArgs.nameCont || "" }); 
            break;
          case "get_lookups_expert_levels": 
            requireArgs(["languageId"]);
            result = await sdk.alMontaka.lookups.expertLevels({ languageId: Number(anyArgs.languageId), nameCont: anyArgs.nameCont || "" }); 
            break;
          case "get_lookups_ideologies": 
            requireArgs(["languageId", "parentId"]);
            result = await sdk.alMontaka.lookups.ideologies({ languageId: Number(anyArgs.languageId), parentId: Number(anyArgs.parentId), nameCont: anyArgs.nameCont || "" }); 
            break;
          case "get_lookups_languages": result = await sdk.alMontaka.lookups.languages(); break;
          case "get_lookups_persons": result = await sdk.alMontaka.lookups.persons({ nameCont: anyArgs.nameCont, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined }); break;
          case "get_lookups_sections": 
            requireArgs(["languageId"]);
            result = await sdk.alMontaka.lookups.sections({ languageId: Number(anyArgs.languageId), nameCont: anyArgs.nameCont || "" }); 
            break;
          case "get_lookups_tags": 
            requireArgs(["languageId"]);
            result = await sdk.alMontaka.lookups.tags({ languageId: Number(anyArgs.languageId), nameCont: anyArgs.nameCont || "" }); 
            break;
          case "get_lookups_targeted_groups": result = await sdk.alMontaka.lookups.targetedGroups(); break;
          case "get_lookups_youtube_channels": result = await sdk.alMontaka.lookups.youtubeChannels(); break;
          default: throw new Error("Invalid action for al_montaka");
        }
        break;

      default:
        throw new Error(`Tool ${name} not found`);
    }

    if (anyArgs.page || anyArgs.limit) {
      result = paginateResponse(result, anyArgs.page, anyArgs.limit);
    }
    result = limitResponseSize(result);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    const isUpstream = error.message?.includes("API request failed") || error.message?.includes("fetch");
    let code = "BAD_REQUEST";
    if (isUpstream) {
       code = error.message.includes("status 404") ? "NOT_FOUND" : "UPSTREAM_UNAVAILABLE";
    }

    const structuredError = {
      code,
      message: error.message || String(error),
      retryable: code === "UPSTREAM_UNAVAILABLE",
    };

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(structuredError, null, 2),
        },
      ],
    };
  }
});



export async function runServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Islamic Content MCP Server running on stdio");
}

export { IslamicContentMCPClient, ClientOptions, GetContextParams } from "./client.js";
