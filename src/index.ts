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
    description: "Fetch Quran translations and audio via QuranEnc.\n\n**Behavior**: Read-only, cacheable.\n**Output**: Varies by action.",
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
    description: "Fetch Quran categories, reciters, and audio from IslamHouse.\n\n**Behavior**: Read-only.\n**Output**: Varies by action.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_categories', 'get_category', 'get_author', 'get_author_recitations', 'get_sura_details', 'get_sura_recitations', 'get_recitation_details'"
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
    description: "Fetch Hadith categories, lists, and translations from HadeethEnc.\n\n**Behavior**: Read-only.\n**Output**: Varies by action.",
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
    description: "Access the IslamHouse Library for books, audios, videos, fatwas, articles, and author data.\n\n**Behavior**: Read-only.\n**Output**: Varies by action.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. Action to perform, e.g. 'get_types', 'get_categories', 'get_categories_tree', 'get_child_categories', 'get_category_basic', 'get_sub_categories', 'get_category_types', 'get_category_languages', 'list_items', 'get_author_items', 'get_category_items', 'get_latest_items', 'get_highlighted_items', 'get_items_count', 'get_item_details', 'get_item_attachments', 'get_item_tree', 'get_item_card_translations', 'get_item_translations', 'list_authors', 'get_author_details', 'get_author_card_translations', 'get_author_available_types', 'get_author_available_locales', 'list_languages', 'get_language_terms', 'get_language_availability'"
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
    description: "Access Bayan Al-Islam for targeted Islamic content.\n\n**Behavior**: Read-only.\n**Output**: Varies by action.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'list_languages', 'list_muslim_content', 'list_non_muslim_content', 'get_content', 'list_paginated_languages', 'get_recent_contents', 'get_lookups', 'search_name', 'get_available_languages', 'get_content_translation', 'get_attachments_translation'"
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
    description: "Access Risalat Al-Haramain for fatwas, hadeeths, and contents.\n\n**Behavior**: Read-only.\n**Output**: Varies by action.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Required. One of: 'get_full_contents', 'get_contents', 'get_content', 'search_name', 'search_contents', 'get_available_languages', 'get_content_translation', 'get_fatwas', 'get_hadeeths', 'get_quran', 'get_lookups_languages', 'get_lookups_content_types'"
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
      case "quran_services":
        switch (anyArgs.action) {
          case "list_translations": result = await sdk.quranenc.translationList({ language: anyArgs.language, localization: anyArgs.localization }); break;
          case "get_sura_translation": result = await sdk.quranenc.translationSura(anyArgs.translationKey, Number(anyArgs.suraNumber)); break;
          case "get_aya_translation": result = await sdk.quranenc.translationAya(anyArgs.translationKey, Number(anyArgs.suraNumber), Number(anyArgs.ayaNumber)); break;
          case "get_aya_audio": result = await sdk.quranenc.ayaAudio(anyArgs.translationKey, Number(anyArgs.suraNumber), Number(anyArgs.ayaNumber)); break;
          default: throw new Error("Invalid action for quran_services");
        }
        break;

      case "islamhouse_quran":
        switch (anyArgs.action) {
          case "list_categories": result = await sdk.islamhouse.quran.categories(anyArgs.language); break;
          case "get_category": result = await sdk.islamhouse.quran.singleCategory(Number(anyArgs.id), anyArgs.language); break;
          case "get_author": result = await sdk.islamhouse.quran.authorDetails(Number(anyArgs.id), anyArgs.language); break;
          case "get_author_recitations": result = await sdk.islamhouse.quran.authorRecitations(Number(anyArgs.id), anyArgs.language); break;
          case "get_sura_details": result = await sdk.islamhouse.quran.suraDetails(Number(anyArgs.suraId), anyArgs.language); break;
          case "get_sura_recitations": result = await sdk.islamhouse.quran.suraRecitations(Number(anyArgs.suraId), anyArgs.language); break;
          case "get_recitation_details": result = await sdk.islamhouse.quran.recitationDetails(Number(anyArgs.id), anyArgs.language); break;
          default: throw new Error("Invalid action for islamhouse_quran");
        }
        break;

      case "hadeethenc_services":
        switch (anyArgs.action) {
          case "list_languages": result = await sdk.hadeethenc.languages(); break;
          case "list_categories": result = await sdk.hadeethenc.categories(anyArgs.languageCode); break;
          case "list_root_categories": result = await sdk.hadeethenc.rootCategories(anyArgs.languageCode); break;
          case "list_hadiths": result = await sdk.hadeethenc.hadithsList({ language: anyArgs.language, categoryId: anyArgs.categoryId !== undefined ? Number(anyArgs.categoryId) : undefined, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, perPage: anyArgs.perPage !== undefined ? Number(anyArgs.perPage) : undefined }); break;
          case "get_hadith_details": result = await sdk.hadeethenc.hadithDetails({ id: Number(anyArgs.id), language: anyArgs.language }); break;
          default: throw new Error("Invalid action for hadeethenc_services");
        }
        break;

      case "islamhouse_library":
        switch (anyArgs.action) {
          case "get_types": result = await sdk.islamhouse.categoriesAndTypes.allTypes(anyArgs.siteLang, anyArgs.contentLang); break;
          case "get_categories": result = await sdk.islamhouse.categoriesAndTypes.allCategories(anyArgs.language); break;
          case "get_categories_tree": result = await sdk.islamhouse.categoriesAndTypes.categoriesTree(anyArgs.language); break;
          case "get_child_categories": result = await sdk.islamhouse.categoriesAndTypes.childCategories(Number(anyArgs.id), anyArgs.siteLang, anyArgs.contentLang); break;
          case "get_category_basic": result = await sdk.islamhouse.categoriesAndTypes.singleCategoryBasic(Number(anyArgs.id), anyArgs.language); break;
          case "get_sub_categories": result = await sdk.islamhouse.categoriesAndTypes.subCategories(Number(anyArgs.id), anyArgs.language); break;
          case "get_category_types": result = await sdk.islamhouse.categoriesAndTypes.categoryTypes(Number(anyArgs.id), anyArgs.siteLang, anyArgs.contentLang); break;
          case "get_category_languages": result = await sdk.islamhouse.categoriesAndTypes.categoryLanguages(Number(anyArgs.id), anyArgs.slang, anyArgs.language); break;
          case "list_items": result = await sdk.islamhouse.items.listItems(anyArgs.type, anyArgs.siteLang, anyArgs.slang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); break;
          case "get_author_items": result = await sdk.islamhouse.items.authorItems(Number(anyArgs.authorId), anyArgs.slang, anyArgs.siteLang, anyArgs.contentLang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); break;
          case "get_category_items": result = await sdk.islamhouse.items.categoryItems(Number(anyArgs.categoryId), anyArgs.slang, anyArgs.siteLang, anyArgs.contentLang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); break;
          case "get_latest_items": result = await sdk.islamhouse.items.latestItems(anyArgs.period, anyArgs.slang, anyArgs.siteLang, anyArgs.contentLang, anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, anyArgs.limit !== undefined ? Number(anyArgs.limit) : undefined); break;
          case "get_highlighted_items": result = await sdk.islamhouse.items.highlightedItems(anyArgs.siteLang, anyArgs.contentLang); break;
          case "get_items_count": result = await sdk.islamhouse.items.itemsCount(anyArgs.type, anyArgs.siteLang, anyArgs.contentLang); break;
          case "get_item_details": result = await sdk.islamhouse.item.details(Number(anyArgs.id), anyArgs.language); break;
          case "get_item_attachments": result = await sdk.islamhouse.item.attachments(Number(anyArgs.id)); break;
          case "get_item_tree": result = await sdk.islamhouse.item.tree(Number(anyArgs.id), anyArgs.language); break;
          case "get_item_card_translations": result = await sdk.islamhouse.item.cardTranslations(Number(anyArgs.id), anyArgs.language); break;
          case "get_item_translations": result = await sdk.islamhouse.item.translations(Number(anyArgs.id), anyArgs.language); break;
          case "list_authors": result = await sdk.islamhouse.authors.list({ kind: anyArgs.kind, locale: anyArgs.locale, sort: anyArgs.sort, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, perPage: anyArgs.perPage !== undefined ? Number(anyArgs.perPage) : undefined }); break;
          case "get_author_details": result = await sdk.islamhouse.authors.details(Number(anyArgs.id), anyArgs.language); break;
          case "get_author_card_translations": result = await sdk.islamhouse.authors.cardTranslations(Number(anyArgs.id), anyArgs.language); break;
          case "get_author_available_types": result = await sdk.islamhouse.authors.availableTypes(Number(anyArgs.id), anyArgs.siteLang, anyArgs.contentLang); break;
          case "get_author_available_locales": result = await sdk.islamhouse.authors.availableLocales(Number(anyArgs.id), anyArgs.slang, anyArgs.language); break;
          case "list_languages": result = await sdk.islamhouse.languages.keys(); break;
          case "get_language_terms": result = await sdk.islamhouse.languages.terms(anyArgs.language); break;
          case "get_language_availability": result = await sdk.islamhouse.languages.availableLanguages(anyArgs.slang, anyArgs.language); break;
          default: throw new Error("Invalid action for islamhouse_library");
        }
        break;

      case "bayan_al_islam":
        switch (anyArgs.action) {
          case "list_languages": result = await sdk.bayanAlIslam.languagesList(anyArgs.language); break;
          case "list_muslim_content": result = await sdk.bayanAlIslam.muslimList(anyArgs.language); break;
          case "list_non_muslim_content": result = await sdk.bayanAlIslam.nonMuslimList(anyArgs.language); break;
          case "get_content": result = await sdk.bayanAlIslam.singleContent(Number(anyArgs.id), anyArgs.language); break;
          case "list_paginated_languages": result = await sdk.bayanAlIslam.paginatedLanguages({ name: anyArgs.name, page: anyArgs.page !== undefined ? Number(anyArgs.page) : undefined, language: anyArgs.language }); break;
          case "get_recent_contents": result = await sdk.bayanAlIslam.recentContents({ lang: anyArgs.lang, init: Boolean(anyArgs.init), ids: Array.isArray(anyArgs.ids) ? anyArgs.ids.map(Number) : undefined, language: anyArgs.language }); break;
          case "get_lookups": result = await sdk.bayanAlIslam.lookups(anyArgs.language); break;
          case "search_name": result = await sdk.bayanAlIslam.nameSearch(anyArgs.name, anyArgs.language); break;
          case "get_available_languages": result = await sdk.bayanAlIslam.availableLanguages(Number(anyArgs.id), anyArgs.language); break;
          case "get_content_translation": result = await sdk.bayanAlIslam.contentTranslation(Number(anyArgs.id), anyArgs.targetLanguage, anyArgs.language); break;
          case "get_attachments_translation": result = await sdk.bayanAlIslam.attachmentsTranslation(Number(anyArgs.id), anyArgs.targetLanguage, anyArgs.language); break;
          default: throw new Error("Invalid action for bayan_al_islam");
        }
        break;

      case "risalat_al_haramain":
        switch (anyArgs.action) {
          case "get_full_contents": result = await sdk.risalatAlHaramain.contents.getFullContents({ language: anyArgs.language, lang: anyArgs.lang }); break;
          case "get_contents": result = await sdk.risalatAlHaramain.contents.getContents({ language: anyArgs.language, lang: anyArgs.lang }); break;
          case "get_content": result = await sdk.risalatAlHaramain.contents.singleContent(Number(anyArgs.id), anyArgs.language); break;
          case "search_name": result = await sdk.risalatAlHaramain.contents.nameSearch(anyArgs.name, anyArgs.language); break;
          case "get_available_languages": result = await sdk.risalatAlHaramain.contents.availableLanguages(Number(anyArgs.id), anyArgs.language); break;
          case "get_content_translation": result = await sdk.risalatAlHaramain.contents.contentTranslation(Number(anyArgs.id), anyArgs.targetLanguage, anyArgs.language); break;
          case "get_fatwas": result = await sdk.risalatAlHaramain.islamicContent.fatwas({ language: anyArgs.language, lang: anyArgs.lang, isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined }); break;
          case "get_hadeeths": result = await sdk.risalatAlHaramain.islamicContent.hadeeths({ language: anyArgs.language, lang: anyArgs.lang, isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined }); break;
          case "get_quran": result = await sdk.risalatAlHaramain.islamicContent.quran({ language: anyArgs.language, lang: anyArgs.lang, isFeatured: anyArgs.isFeatured !== undefined ? Number(anyArgs.isFeatured) : undefined }); break;
          case "search_contents": result = await sdk.risalatAlHaramain.search.contents(anyArgs.query, anyArgs.language); break;
          case "get_lookups_languages": result = await sdk.risalatAlHaramain.lookups.languages(anyArgs.language, anyArgs.apiKey); break;
          case "get_lookups_content_types": result = await sdk.risalatAlHaramain.lookups.contentTypes(anyArgs.language); break;
          default: throw new Error("Invalid action for risalat_al_haramain");
        }
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

export async function runServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Islamic Content MCP Server running on stdio");
}

export { IslamicContentMCPClient, ClientOptions, GetContextParams } from "./client.js";
