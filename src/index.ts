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
      // ==========================================
      // QURAN SERVICES (QuranEnc & IslamHouse Quran)
      // ==========================================
      {
        name: "quranenc_translation_list",
        description: "Get list of available Quran translations. Optional filters for language and localization.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code filter (e.g., 'en', 'ar', 'fr')" },
            localization: { type: "string", description: "Localization language (e.g., 'en')" }
          }
        }
      },
      {
        name: "quranenc_translation_sura",
        description: "Get full Quran surah translation by translation key and surah number.",
        inputSchema: {
          type: "object",
          properties: {
            translationKey: { type: "string", description: "Translation identifier (e.g., 'en_sahih', 'ar_muhammad')" },
            suraNumber: { type: "integer", description: "Surah number (1-114)" }
          },
          required: ["translationKey", "suraNumber"]
        }
      },
      {
        name: "quranenc_translation_aya",
        description: "Get Quran translation for a specific ayah.",
        inputSchema: {
          type: "object",
          properties: {
            translationKey: { type: "string", description: "Translation identifier (e.g., 'en_sahih')" },
            suraNumber: { type: "integer", description: "Surah number (1-114)" },
            ayaNumber: { type: "integer", description: "Ayah number" }
          },
          required: ["translationKey", "suraNumber", "ayaNumber"]
        }
      },
      {
        name: "quranenc_aya_audio",
        description: "Get MP3 audio details (file URL) for a specific ayah translation.",
        inputSchema: {
          type: "object",
          properties: {
            translationKey: { type: "string", description: "Translation identifier (e.g., 'ar_muhammad')" },
            suraNumber: { type: "integer", description: "Surah number (1-114)" },
            ayaNumber: { type: "integer", description: "Ayah number" }
          },
          required: ["translationKey", "suraNumber", "ayaNumber"]
        }
      },
      {
        name: "quranenc_add_note",
        description: "Submit a correction, suggestion, or note on a translation.",
        inputSchema: {
          type: "object",
          properties: {
            translation_key: { type: "string", description: "Translation identifier" },
            sura: { type: "integer", description: "Surah number" },
            aya: { type: "integer", description: "Ayah number" },
            name: { type: "string", description: "Submitter name" },
            email: { type: "string", description: "Submitter email" },
            note: { type: "string", description: "The comment or feedback note" },
            suggested_translation: { type: "string", description: "The suggested correct translation (optional)" },
            source: { type: "string", description: "Source identifier (e.g., 'web')" },
            version: { type: "string", description: "Client version" }
          },
          required: ["translation_key", "sura", "aya", "name", "email", "note", "source", "version"]
        }
      },
      {
        name: "islamhouse_quran_categories",
        description: "Get IslamHouse Quran categories.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (e.g., 'ar', 'en')" }
          },
          required: ["language"]
        }
      },
      {
        name: "islamhouse_quran_single_category",
        description: "Get a single IslamHouse Quran category by ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Category ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_quran_author_details",
        description: "Get IslamHouse Quran reciter/author details.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Author ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_quran_author_recitations",
        description: "Get recitations of a specific Quran reciter/author in IslamHouse.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Author ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_quran_sura_details",
        description: "Get IslamHouse details of a specific surah.",
        inputSchema: {
          type: "object",
          properties: {
            suraId: { type: "integer", description: "Sura ID (1-114)" },
            language: { type: "string", description: "Language code" }
          },
          required: ["suraId", "language"]
        }
      },
      {
        name: "islamhouse_quran_sura_recitations",
        description: "Get all recitations of a specific surah.",
        inputSchema: {
          type: "object",
          properties: {
            suraId: { type: "integer", description: "Sura ID (1-114)" },
            language: { type: "string", description: "Language code" }
          },
          required: ["suraId", "language"]
        }
      },
      {
        name: "islamhouse_quran_recitation_details",
        description: "Get details of a specific recitation in IslamHouse.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Recitation ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },

      // ==========================================
      // HADITH SERVICES (HadeethEnc)
      // ==========================================
      {
        name: "hadeethenc_languages",
        description: "Get available languages in HadeethEnc.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "hadeethenc_categories",
        description: "Get list of Hadeeth categories by language.",
        inputSchema: {
          type: "object",
          properties: {
            languageCode: { type: "string", description: "Language code (e.g., 'en', 'ar')" }
          },
          required: ["languageCode"]
        }
      },
      {
        name: "hadeethenc_root_categories",
        description: "Get root categories of Hadeeth by language.",
        inputSchema: {
          type: "object",
          properties: {
            languageCode: { type: "string", description: "Language code (e.g., 'en', 'ar')" }
          },
          required: ["languageCode"]
        }
      },
      {
        name: "hadeethenc_hadiths_list",
        description: "Get list of Hadeeths under category with optional page/limit.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (e.g., 'en', 'ar')" },
            categoryId: { type: "integer", description: "Category ID filter" },
            page: { type: "integer", description: "Page number" },
            perPage: { type: "integer", description: "Number of hadiths per page" }
          },
          required: ["language"]
        }
      },
      {
        name: "hadeethenc_hadith_details",
        description: "Get detailed translation and explanation of a single hadith.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Hadeeth ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },

      // ==========================================
      // ISLAMHOUSE GENERAL SERVICES
      // ==========================================
      {
        name: "islamhouse_all_types",
        description: "Get all content types in IslamHouse.",
        inputSchema: {
          type: "object",
          properties: {
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" }
          },
          required: ["siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_all_categories",
        description: "Get all categories in IslamHouse for a language.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code" }
          },
          required: ["language"]
        }
      },
      {
        name: "islamhouse_categories_tree",
        description: "Get complete categories hierarchy tree in IslamHouse.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code" }
          },
          required: ["language"]
        }
      },
      {
        name: "islamhouse_child_categories",
        description: "Get child categories of an IslamHouse category.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Parent Category ID" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" }
          },
          required: ["id", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_single_category_basic",
        description: "Get basic info of single category.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Category ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_sub_categories",
        description: "Get subcategories under a category ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Category ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_category_types",
        description: "Get types available in a category.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Category ID" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" }
          },
          required: ["id", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_category_languages",
        description: "Get available source languages in a category.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Category ID" },
            slang: { type: "string", description: "Source language code" },
            language: { type: "string", description: "Target language code" }
          },
          required: ["id", "slang", "language"]
        }
      },
      {
        name: "islamhouse_list_items",
        description: "List items (books, audios, etc.) in IslamHouse by type and language.",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Type (e.g., 'books', 'audios', 'videos', 'fatwa')" },
            siteLang: { type: "string", description: "Site language" },
            slang: { type: "string", description: "Content language" },
            page: { type: "integer", description: "Page number" },
            limit: { type: "integer", description: "Page size limit" }
          },
          required: ["type", "siteLang", "slang"]
        }
      },
      {
        name: "islamhouse_author_items",
        description: "List IslamHouse items belonging to a specific author.",
        inputSchema: {
          type: "object",
          properties: {
            authorId: { type: "integer", description: "Author ID" },
            slang: { type: "string", description: "Content language" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" },
            page: { type: "integer", description: "Page number" },
            limit: { type: "integer", description: "Page size limit" }
          },
          required: ["authorId", "slang", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_category_items",
        description: "List IslamHouse items in a specific category.",
        inputSchema: {
          type: "object",
          properties: {
            categoryId: { type: "integer", description: "Category ID" },
            slang: { type: "string", description: "Content language" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" },
            page: { type: "integer", description: "Page number" },
            limit: { type: "integer", description: "Page size limit" }
          },
          required: ["categoryId", "slang", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_latest_items",
        description: "List latest items in IslamHouse.",
        inputSchema: {
          type: "object",
          properties: {
            period: { type: "string", description: "Time period (e.g., 'month', 'week')" },
            slang: { type: "string", description: "Content language" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" },
            page: { type: "integer", description: "Page number" },
            limit: { type: "integer", description: "Page size limit" }
          },
          required: ["period", "slang", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_highlighted_items",
        description: "List highlighted featured items in IslamHouse.",
        inputSchema: {
          type: "object",
          properties: {
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" }
          },
          required: ["siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_items_count",
        description: "Get counts of items available.",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Item type" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" }
          },
          required: ["type", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_item_details",
        description: "Get details of a single IslamHouse content item.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Item ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_item_attachments",
        description: "Get attachments (PDFs, MP3s, links) for an IslamHouse item.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Item ID" }
          },
          required: ["id"]
        }
      },
      {
        name: "islamhouse_item_tree",
        description: "Get categories tree hierarchy for a specific item.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Item ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_item_card_translations",
        description: "Get card translations for an item.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Item ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_item_translations",
        description: "Get translation details of a specific item.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Item ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_list_authors",
        description: "List authors and content sources.",
        inputSchema: {
          type: "object",
          properties: {
            kind: { type: "string", description: "Kind (e.g. 'showall', 'author', 'source')" },
            locale: { type: "string", description: "Locale (e.g. 'showall', 'ar', 'en')" },
            sort: { type: "string", description: "Sort type (e.g. 'countdesc')" },
            page: { type: "integer", description: "Page number" },
            perPage: { type: "integer", description: "Per page limit" }
          }
        }
      },
      {
        name: "islamhouse_author_details",
        description: "Get details of a single author/scholar.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Author ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_author_card_translations",
        description: "Get translated author card details.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Author ID" },
            language: { type: "string", description: "Language code" }
          },
          required: ["id", "language"]
        }
      },
      {
        name: "islamhouse_author_available_types",
        description: "Get content types available for a specific author.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Author ID" },
            siteLang: { type: "string", description: "Site language" },
            contentLang: { type: "string", description: "Content language" }
          },
          required: ["id", "siteLang", "contentLang"]
        }
      },
      {
        name: "islamhouse_author_available_locales",
        description: "Get available locales for an author.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Author ID" },
            slang: { type: "string", description: "Source language code" },
            language: { type: "string", description: "Target language code" }
          },
          required: ["id", "slang", "language"]
        }
      },
      {
        name: "islamhouse_languages_keys",
        description: "Get details of all supported languages in IslamHouse.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "islamhouse_languages_terms",
        description: "Get terms and dictionary translations for a language.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code" }
          },
          required: ["language"]
        }
      },
      {
        name: "islamhouse_languages_available",
        description: "Get languages available for a specific language.",
        inputSchema: {
          type: "object",
          properties: {
            slang: { type: "string", description: "Source language code" },
            language: { type: "string", description: "Target language code" }
          },
          required: ["slang", "language"]
        }
      },

      // ==========================================
      // AL-MONTAKA SERVICES
      // ==========================================
      {
        name: "almontaka_comments",
        description: "Get comments for content by ID.",
        inputSchema: {
          type: "object",
          properties: {
            contentId: { type: "integer", description: "Content ID" }
          },
          required: ["contentId"]
        }
      },
      {
        name: "almontaka_add_comment",
        description: "Post a comment on a content item in Al-Montaka.",
        inputSchema: {
          type: "object",
          properties: {
            contentId: { type: "integer", description: "Content ID" },
            comment: { type: "string", description: "Comment body text" }
          },
          required: ["contentId", "comment"]
        }
      },
      {
        name: "almontaka_content",
        description: "Get Al-Montaka content matching specified categories.",
        inputSchema: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: { type: "integer" },
              description: "Array of Category IDs"
            }
          },
          required: ["categories"]
        }
      },
      {
        name: "almontaka_age_groups",
        description: "Get Al-Montaka age groups.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "almontaka_categories",
        description: "Get Al-Montaka categories lookup by language ID and name match.",
        inputSchema: {
          type: "object",
          properties: {
            languageId: { type: "integer", description: "Language ID" },
            nameCont: { type: "string", description: "String query to match category name" }
          },
          required: ["languageId", "nameCont"]
        }
      },
      {
        name: "almontaka_entities",
        description: "Get Al-Montaka entities lookup.",
        inputSchema: {
          type: "object",
          properties: {
            languageId: { type: "integer", description: "Language ID" },
            nameCont: { type: "string", description: "Match name query" }
          },
          required: ["languageId", "nameCont"]
        }
      },
      {
        name: "almontaka_expert_levels",
        description: "Get Al-Montaka expert levels lookup.",
        inputSchema: {
          type: "object",
          properties: {
            languageId: { type: "integer", description: "Language ID" },
            nameCont: { type: "string", description: "Match name query" }
          },
          required: ["languageId", "nameCont"]
        }
      },
      {
        name: "almontaka_ideologies",
        description: "Get Al-Montaka ideologies lookup.",
        inputSchema: {
          type: "object",
          properties: {
            languageId: { type: "integer", description: "Language ID" },
            nameCont: { type: "string", description: "Match name query" },
            parentId: { type: "integer", description: "Parent ID" }
          },
          required: ["languageId", "nameCont", "parentId"]
        }
      },
      {
        name: "almontaka_languages",
        description: "Get Al-Montaka languages lookup.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "almontaka_persons",
        description: "Get Al-Montaka persons list or search.",
        inputSchema: {
          type: "object",
          properties: {
            nameCont: { type: "string", description: "Search by name prefix" },
            page: { type: "integer", description: "Page number" }
          }
        }
      },
      {
        name: "almontaka_sections",
        description: "Get Al-Montaka sections lookup.",
        inputSchema: {
          type: "object",
          properties: {
            languageId: { type: "integer", description: "Language ID" },
            nameCont: { type: "string", description: "Match name query" }
          },
          required: ["languageId", "nameCont"]
        }
      },
      {
        name: "almontaka_tags",
        description: "Get Al-Montaka tags lookup.",
        inputSchema: {
          type: "object",
          properties: {
            languageId: { type: "integer", description: "Language ID" },
            nameCont: { type: "string", description: "Match name query" }
          },
          required: ["languageId", "nameCont"]
        }
      },
      {
        name: "almontaka_targeted_groups",
        description: "Get Al-Montaka targeted groups lookup.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "almontaka_youtube_channels",
        description: "Get Al-Montaka YouTube channels list.",
        inputSchema: { type: "object", properties: {} }
      },

      // ==========================================
      // BAYAN AL-ISLAM SERVICES
      // ==========================================
      {
        name: "bayan_languages_list",
        description: "Get Bayan Al-Islam languages list.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (default 'ar')" }
          }
        }
      },
      {
        name: "bayan_muslim_list",
        description: "Get full list of content for Muslims in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (default 'en')" }
          }
        }
      },
      {
        name: "bayan_non_muslim_list",
        description: "Get full list of content for non-Muslims in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (default 'en')" }
          }
        }
      },
      {
        name: "bayan_single_content",
        description: "Get single content details in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            language: { type: "string", description: "Language code (default 'en')" }
          },
          required: ["id"]
        }
      },
      {
        name: "bayan_paginated_languages",
        description: "Get paginated languages list in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name filter" },
            page: { type: "integer", description: "Page number" },
            language: { type: "string", description: "Language context" }
          }
        }
      },
      {
        name: "bayan_recent_contents",
        description: "Get recent contents in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            lang: { type: "string", description: "Lang query parameter" },
            init: { type: "boolean", description: "Init flag" },
            ids: { type: "array", items: { type: "integer" }, description: "Optional content IDs" },
            language: { type: "string", description: "Language context" }
          },
          required: ["lang", "init"]
        }
      },
      {
        name: "bayan_lookups",
        description: "Get lookup data in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language context (default 'en')" }
          }
        }
      },
      {
        name: "bayan_name_search",
        description: "Search content by name in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Search query name" },
            language: { type: "string", description: "Language context (default 'ar')" }
          },
          required: ["name"]
        }
      },
      {
        name: "bayan_available_languages",
        description: "Get available translations for a content item in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            language: { type: "string", description: "Language context (default 'ar')" }
          },
          required: ["id"]
        }
      },
      {
        name: "bayan_content_translation",
        description: "Get translated content in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            targetLanguage: { type: "string", description: "Target language code" },
            language: { type: "string", description: "Language context (default 'en')" }
          },
          required: ["id", "targetLanguage"]
        }
      },
      {
        name: "bayan_attachments_translation",
        description: "Get translated attachments in Bayan Al-Islam.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            targetLanguage: { type: "string", description: "Target language code" },
            language: { type: "string", description: "Language context (default 'en')" }
          },
          required: ["id", "targetLanguage"]
        }
      },

      // ==========================================
      // RISALAT AL-HARAMAIN SERVICES
      // ==========================================
      {
        name: "risala_get_full_contents",
        description: "Get full content feed in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (default 'en')" },
            lang: { type: "string", description: "Lang query param (default 'en')" }
          }
        }
      },
      {
        name: "risala_get_contents",
        description: "Get contents list in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language code (default 'en')" },
            lang: { type: "string", description: "Lang query param (default 'en')" }
          }
        }
      },
      {
        name: "risala_single_content",
        description: "Get single content details in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            language: { type: "string", description: "Language context (default 'en')" }
          },
          required: ["id"]
        }
      },
      {
        name: "risala_name_search",
        description: "Search content by name in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Search query name" },
            language: { type: "string", description: "Language context (default 'ar')" }
          },
          required: ["name"]
        }
      },
      {
        name: "risala_available_languages",
        description: "Get available translations for a content item in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            language: { type: "string", description: "Language context (default 'ar')" }
          },
          required: ["id"]
        }
      },
      {
        name: "risala_content_translation",
        description: "Get translated content in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "integer", description: "Content ID" },
            targetLanguage: { type: "string", description: "Target language code" },
            language: { type: "string", description: "Language context (default 'en')" }
          },
          required: ["id", "targetLanguage"]
        }
      },
      {
        name: "risala_fatwas",
        description: "Get fatwas list in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language context (default 'en')" },
            lang: { type: "string", description: "Lang query param (default 'ar')" },
            isFeatured: { type: "integer", description: "Featured flag: 0 or 1 (default 1)" }
          }
        }
      },
      {
        name: "risala_hadeeths",
        description: "Get Hadeeths list in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language context (default 'en')" },
            lang: { type: "string", description: "Lang query param (default 'ar')" },
            isFeatured: { type: "integer", description: "Featured flag: 0 or 1 (default 1)" }
          }
        }
      },
      {
        name: "risala_quran",
        description: "Get Quran list in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language context (default 'en')" },
            lang: { type: "string", description: "Lang query param (default 'ar')" },
            isFeatured: { type: "integer", description: "Featured flag: 0 or 1 (default 1)" }
          }
        }
      },
      {
        name: "risala_search_contents",
        description: "Search contents in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            language: { type: "string", description: "Language context (default 'en')" }
          },
          required: ["query"]
        }
      },
      {
        name: "risala_lookups_languages",
        description: "Get supported languages lookup in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language context (default 'en')" },
            apiKey: { type: "string", description: "API Key override" }
          }
        }
      },
      {
        name: "risala_lookups_content_types",
        description: "Get content types lookup in Risalat Al-Haramain.",
        inputSchema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Language context (default 'en')" }
          }
        }
      }
    ]
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const anyArgs = (args || {}) as any;

  try {
    let result: any;

    switch (name) {
      // ==========================================
      // QURAN SERVICES
      // ==========================================
      case "quranenc_translation_list":
        result = await sdk.quranenc.translationList({
          language: anyArgs.language,
          localization: anyArgs.localization
        });
        break;

      case "quranenc_translation_sura":
        result = await sdk.quranenc.translationSura(
          anyArgs.translationKey,
          Number(anyArgs.suraNumber)
        );
        break;

      case "quranenc_translation_aya":
        result = await sdk.quranenc.translationAya(
          anyArgs.translationKey,
          Number(anyArgs.suraNumber),
          Number(anyArgs.ayaNumber)
        );
        break;

      case "quranenc_aya_audio":
        result = await sdk.quranenc.ayaAudio(
          anyArgs.translationKey,
          Number(anyArgs.suraNumber),
          Number(anyArgs.ayaNumber)
        );
        break;

      case "quranenc_add_note":
        result = await sdk.quranenc.addNote({
          translation_key: anyArgs.translation_key,
          sura: Number(anyArgs.sura),
          aya: Number(anyArgs.aya),
          name: anyArgs.name,
          email: anyArgs.email,
          note: anyArgs.note,
          suggested_translation: anyArgs.suggested_translation,
          source: anyArgs.source,
          version: anyArgs.version
        });
        break;

      case "islamhouse_quran_categories":
        result = await sdk.islamhouse.quran.categories(anyArgs.language);
        break;

      case "islamhouse_quran_single_category":
        result = await sdk.islamhouse.quran.singleCategory(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_quran_author_details":
        result = await sdk.islamhouse.quran.authorDetails(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_quran_author_recitations":
        result = await sdk.islamhouse.quran.authorRecitations(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_quran_sura_details":
        result = await sdk.islamhouse.quran.suraDetails(Number(anyArgs.suraId), anyArgs.language);
        break;

      case "islamhouse_quran_sura_recitations":
        result = await sdk.islamhouse.quran.suraRecitations(Number(anyArgs.suraId), anyArgs.language);
        break;

      case "islamhouse_quran_recitation_details":
        result = await sdk.islamhouse.quran.recitationDetails(Number(anyArgs.id), anyArgs.language);
        break;

      // ==========================================
      // HADITH SERVICES
      // ==========================================
      case "hadeethenc_languages":
        result = await sdk.hadeethenc.languages();
        break;

      case "hadeethenc_categories":
        result = await sdk.hadeethenc.categories(anyArgs.languageCode);
        break;

      case "hadeethenc_root_categories":
        result = await sdk.hadeethenc.rootCategories(anyArgs.languageCode);
        break;

      case "hadeethenc_hadiths_list":
        result = await sdk.hadeethenc.hadithsList({
          language: anyArgs.language,
          categoryId: anyArgs.categoryId !== undefined ? Number(anyArgs.categoryId) : undefined,
          page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          perPage: anyArgs.perPage !== undefined ? Number(anyArgs.perPage) : undefined,
        });
        break;

      case "hadeethenc_hadith_details":
        result = await sdk.hadeethenc.hadithDetails({
          id: Number(anyArgs.id),
          language: anyArgs.language,
        });
        break;

      // ==========================================
      // ISLAMHOUSE GENERAL SERVICES
      // ==========================================
      case "islamhouse_all_types":
        result = await sdk.islamhouse.categoriesAndTypes.allTypes(anyArgs.siteLang, anyArgs.contentLang);
        break;

      case "islamhouse_all_categories":
        result = await sdk.islamhouse.categoriesAndTypes.allCategories(anyArgs.language);
        break;

      case "islamhouse_categories_tree":
        result = await sdk.islamhouse.categoriesAndTypes.categoriesTree(anyArgs.language);
        break;

      case "islamhouse_child_categories":
        result = await sdk.islamhouse.categoriesAndTypes.childCategories(
          Number(anyArgs.id),
          anyArgs.siteLang,
          anyArgs.contentLang
        );
        break;

      case "islamhouse_single_category_basic":
        result = await sdk.islamhouse.categoriesAndTypes.singleCategoryBasic(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_sub_categories":
        result = await sdk.islamhouse.categoriesAndTypes.subCategories(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_category_types":
        result = await sdk.islamhouse.categoriesAndTypes.categoryTypes(
          Number(anyArgs.id),
          anyArgs.siteLang,
          anyArgs.contentLang
        );
        break;

      case "islamhouse_category_languages":
        result = await sdk.islamhouse.categoriesAndTypes.categoryLanguages(
          Number(anyArgs.id),
          anyArgs.slang,
          anyArgs.language
        );
        break;

      case "islamhouse_list_items":
        result = await sdk.islamhouse.items.listItems(
          anyArgs.type,
          anyArgs.siteLang,
          anyArgs.slang,
          anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined
        );
        break;

      case "islamhouse_author_items":
        result = await sdk.islamhouse.items.authorItems(
          Number(anyArgs.authorId),
          anyArgs.slang,
          anyArgs.siteLang,
          anyArgs.contentLang,
          anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined
        );
        break;

      case "islamhouse_category_items":
        result = await sdk.islamhouse.items.categoryItems(
          Number(anyArgs.categoryId),
          anyArgs.slang,
          anyArgs.siteLang,
          anyArgs.contentLang,
          anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined
        );
        break;

      case "islamhouse_latest_items":
        result = await sdk.islamhouse.items.latestItems(
          anyArgs.period,
          anyArgs.slang,
          anyArgs.siteLang,
          anyArgs.contentLang,
          anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined
        );
        break;

      case "islamhouse_highlighted_items":
        result = await sdk.islamhouse.items.highlightedItems(anyArgs.siteLang, anyArgs.contentLang);
        break;

      case "islamhouse_items_count":
        result = await sdk.islamhouse.items.itemsCount(anyArgs.type, anyArgs.siteLang, anyArgs.contentLang);
        break;

      case "islamhouse_item_details":
        result = await sdk.islamhouse.item.details(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_item_attachments":
        result = await sdk.islamhouse.item.attachments(Number(anyArgs.id));
        break;

      case "islamhouse_item_tree":
        result = await sdk.islamhouse.item.tree(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_item_card_translations":
        result = await sdk.islamhouse.item.cardTranslations(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_item_translations":
        result = await sdk.islamhouse.item.translations(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_list_authors":
        result = await sdk.islamhouse.authors.list({
          kind: anyArgs.kind,
          locale: anyArgs.locale,
          sort: anyArgs.sort,
          page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          perPage: anyArgs.perPage !== undefined ? Number(anyArgs.perPage) : undefined,
        });
        break;

      case "islamhouse_author_details":
        result = await sdk.islamhouse.authors.details(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_author_card_translations":
        result = await sdk.islamhouse.authors.cardTranslations(Number(anyArgs.id), anyArgs.language);
        break;

      case "islamhouse_author_available_types":
        result = await sdk.islamhouse.authors.availableTypes(
          Number(anyArgs.id),
          anyArgs.siteLang,
          anyArgs.contentLang
        );
        break;

      case "islamhouse_author_available_locales":
        result = await sdk.islamhouse.authors.availableLocales(
          Number(anyArgs.id),
          anyArgs.slang,
          anyArgs.language
        );
        break;

      case "islamhouse_languages_keys":
        result = await sdk.islamhouse.languages.keys();
        break;

      case "islamhouse_languages_terms":
        result = await sdk.islamhouse.languages.terms(anyArgs.language);
        break;

      case "islamhouse_languages_available":
        result = await sdk.islamhouse.languages.availableLanguages(anyArgs.slang, anyArgs.language);
        break;

      // ==========================================
      // AL-MONTAKA SERVICES
      // ==========================================
      case "almontaka_comments":
        result = await sdk.alMontaka.contents.comments(Number(anyArgs.contentId));
        break;

      case "almontaka_add_comment":
        result = await sdk.alMontaka.contents.addComment(Number(anyArgs.contentId), anyArgs.comment);
        break;

      case "almontaka_content":
        result = await sdk.alMontaka.contents.content(
          Array.isArray(anyArgs.categories) ? anyArgs.categories.map(Number) : []
        );
        break;

      case "almontaka_age_groups":
        result = await sdk.alMontaka.lookups.ageGroups();
        break;

      case "almontaka_categories":
        result = await sdk.alMontaka.lookups.categories({
          languageId: Number(anyArgs.languageId),
          nameCont: anyArgs.nameCont,
        });
        break;

      case "almontaka_entities":
        result = await sdk.alMontaka.lookups.entities({
          languageId: Number(anyArgs.languageId),
          nameCont: anyArgs.nameCont,
        });
        break;

      case "almontaka_expert_levels":
        result = await sdk.alMontaka.lookups.expertLevels({
          languageId: Number(anyArgs.languageId),
          nameCont: anyArgs.nameCont,
        });
        break;

      case "almontaka_ideologies":
        result = await sdk.alMontaka.lookups.ideologies({
          languageId: Number(anyArgs.languageId),
          nameCont: anyArgs.nameCont,
          parentId: Number(anyArgs.parentId),
        });
        break;

      case "almontaka_languages":
        result = await sdk.alMontaka.lookups.languages();
        break;

      case "almontaka_persons":
        result = await sdk.alMontaka.lookups.persons({
          nameCont: anyArgs.nameCont,
          page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
        });
        break;

      case "almontaka_sections":
        result = await sdk.alMontaka.lookups.sections({
          languageId: Number(anyArgs.languageId),
          nameCont: anyArgs.nameCont,
        });
        break;

      case "almontaka_tags":
        result = await sdk.alMontaka.lookups.tags({
          languageId: Number(anyArgs.languageId),
          nameCont: anyArgs.nameCont,
        });
        break;

      case "almontaka_targeted_groups":
        result = await sdk.alMontaka.lookups.targetedGroups();
        break;

      case "almontaka_youtube_channels":
        result = await sdk.alMontaka.lookups.youtubeChannels();
        break;

      // ==========================================
      // BAYAN AL-ISLAM SERVICES
      // ==========================================
      case "bayan_languages_list":
        result = await sdk.bayanAlIslam.languagesList(anyArgs.language);
        break;

      case "bayan_muslim_list":
        result = await sdk.bayanAlIslam.muslimList(anyArgs.language);
        break;

      case "bayan_non_muslim_list":
        result = await sdk.bayanAlIslam.nonMuslimList(anyArgs.language);
        break;

      case "bayan_single_content":
        result = await sdk.bayanAlIslam.singleContent(Number(anyArgs.id), anyArgs.language);
        break;

      case "bayan_paginated_languages":
        result = await sdk.bayanAlIslam.paginatedLanguages({
          name: anyArgs.name,
          page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined,
          language: anyArgs.language,
        });
        break;

      case "bayan_recent_contents":
        result = await sdk.bayanAlIslam.recentContents({
          lang: anyArgs.lang,
          init: Boolean(anyArgs.init),
          ids: Array.isArray(anyArgs.ids) ? anyArgs.ids.map(Number) : undefined,
          language: anyArgs.language,
        });
        break;

      case "bayan_lookups":
        result = await sdk.bayanAlIslam.lookups(anyArgs.language);
        break;

      case "bayan_name_search":
        result = await sdk.bayanAlIslam.nameSearch(anyArgs.name, anyArgs.language);
        break;

      case "bayan_available_languages":
        result = await sdk.bayanAlIslam.availableLanguages(Number(anyArgs.id), anyArgs.language);
        break;

      case "bayan_content_translation":
        result = await sdk.bayanAlIslam.contentTranslation(
          Number(anyArgs.id),
          anyArgs.targetLanguage,
          anyArgs.language
        );
        break;

      case "bayan_attachments_translation":
        result = await sdk.bayanAlIslam.attachmentsTranslation(
          Number(anyArgs.id),
          anyArgs.targetLanguage,
          anyArgs.language
        );
        break;

      // ==========================================
      // RISALAT AL-HARAMAIN SERVICES
      // ==========================================
      case "risala_get_full_contents":
        result = await sdk.risalatAlHaramain.contents.getFullContents({
          language: anyArgs.language,
          lang: anyArgs.lang,
        });
        break;

      case "risala_get_contents":
        result = await sdk.risalatAlHaramain.contents.getContents({
          language: anyArgs.language,
          lang: anyArgs.lang,
        });
        break;

      case "risala_single_content":
        result = await sdk.risalatAlHaramain.contents.singleContent(Number(anyArgs.id), anyArgs.language);
        break;

      case "risala_name_search":
        result = await sdk.risalatAlHaramain.contents.nameSearch(anyArgs.name, anyArgs.language);
        break;

      case "risala_available_languages":
        result = await sdk.risalatAlHaramain.contents.availableLanguages(Number(anyArgs.id), anyArgs.language);
        break;

      case "risala_content_translation":
        result = await sdk.risalatAlHaramain.contents.contentTranslation(
          Number(anyArgs.id),
          anyArgs.targetLanguage,
          anyArgs.language
        );
        break;

      case "risala_fatwas":
        result = await sdk.risalatAlHaramain.islamicContent.fatwas({
          language: anyArgs.language,
          lang: anyArgs.lang,
          isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined,
        });
        break;

      case "risala_hadeeths":
        result = await sdk.risalatAlHaramain.islamicContent.hadeeths({
          language: anyArgs.language,
          lang: anyArgs.lang,
          isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined,
        });
        break;

      case "risala_quran":
        result = await sdk.risalatAlHaramain.islamicContent.quran({
          language: anyArgs.language,
          lang: anyArgs.lang,
          isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined,
        });
        break;

      case "risala_search_contents":
        result = await sdk.risalatAlHaramain.search.contents(anyArgs.query, anyArgs.language);
        break;

      case "risala_lookups_languages":
        result = await sdk.risalatAlHaramain.lookups.languages(anyArgs.language, anyArgs.apiKey);
        break;

      case "risala_lookups_content_types":
        result = await sdk.risalatAlHaramain.lookups.contentTypes(anyArgs.language);
        break;

      default:
        throw new Error(`Tool ${name} not found`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error calling tool ${name}: ${error.message || error}`,
        },
      ],
    };
  }
});

// Run server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Islamic Content MCP Server running on stdio");
