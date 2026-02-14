const extensionIcons: Record<string, string> = {
  // Folders
  folder: "\uD83D\uDCC1",

  // JavaScript / TypeScript
  ".js": "\uD83D\uDCC4",
  ".mjs": "\uD83D\uDCC4",
  ".cjs": "\uD83D\uDCC4",
  ".ts": "\uD83D\uDCC4",
  ".jsx": "\u269B\uFE0F",
  ".tsx": "\u269B\uFE0F",

  // Data / Config
  ".json": "\uD83D\uDCCB",
  ".yaml": "\u2699\uFE0F",
  ".yml": "\u2699\uFE0F",
  ".toml": "\u2699\uFE0F",
  ".ini": "\u2699\uFE0F",
  ".env": "\uD83D\uDD10",
  ".env.local": "\uD83D\uDD10",
  ".env.example": "\uD83D\uDD10",

  // Markup / Docs
  ".md": "\uD83D\uDCDD",
  ".mdx": "\uD83D\uDCDD",
  ".txt": "\uD83D\uDCDD",
  ".html": "\uD83C\uDF10",
  ".htm": "\uD83C\uDF10",

  // Styles
  ".css": "\uD83C\uDFA8",
  ".scss": "\uD83C\uDFA8",
  ".sass": "\uD83C\uDFA8",
  ".less": "\uD83C\uDFA8",

  // Images
  ".png": "\uD83D\uDDBC\uFE0F",
  ".jpg": "\uD83D\uDDBC\uFE0F",
  ".jpeg": "\uD83D\uDDBC\uFE0F",
  ".gif": "\uD83D\uDDBC\uFE0F",
  ".svg": "\uD83D\uDDBC\uFE0F",
  ".ico": "\uD83D\uDDBC\uFE0F",
  ".webp": "\uD83D\uDDBC\uFE0F",

  // Tests
  ".test.ts": "\uD83E\uDDEA",
  ".test.tsx": "\uD83E\uDDEA",
  ".test.js": "\uD83E\uDDEA",
  ".test.jsx": "\uD83E\uDDEA",
  ".spec.ts": "\uD83E\uDDEA",
  ".spec.tsx": "\uD83E\uDDEA",
  ".spec.js": "\uD83E\uDDEA",

  // Python
  ".py": "\uD83D\uDC0D",
  ".pyx": "\uD83D\uDC0D",

  // Ruby
  ".rb": "\uD83D\uDC8E",

  // Go
  ".go": "\uD83D\uDCC4",

  // Rust
  ".rs": "\u2699\uFE0F",

  // Shell
  ".sh": "\uD83D\uDCBB",
  ".bash": "\uD83D\uDCBB",
  ".zsh": "\uD83D\uDCBB",

  // Docker
  Dockerfile: "\uD83D\uDC33",
  ".dockerignore": "\uD83D\uDC33",

  // Lock files
  ".lock": "\uD83D\uDD12",

  // Git
  ".gitignore": "\uD83D\uDEAB",
  ".gitattributes": "\uD83D\uDEAB",
};

const nameIcons: Record<string, string> = {
  "package.json": "\uD83D\uDCE6",
  "package-lock.json": "\uD83D\uDD12",
  "tsconfig.json": "\u2699\uFE0F",
  "next.config.js": "\u2699\uFE0F",
  "next.config.ts": "\u2699\uFE0F",
  "next.config.mjs": "\u2699\uFE0F",
  "tailwind.config.js": "\uD83C\uDFA8",
  "tailwind.config.ts": "\uD83C\uDFA8",
  "postcss.config.js": "\uD83C\uDFA8",
  "postcss.config.mjs": "\uD83C\uDFA8",
  Dockerfile: "\uD83D\uDC33",
  "docker-compose.yml": "\uD83D\uDC33",
  "docker-compose.yaml": "\uD83D\uDC33",
  LICENSE: "\uD83D\uDCDC",
  "LICENSE.md": "\uD83D\uDCDC",
  "README.md": "\uD83D\uDCD6",
  Makefile: "\uD83D\uDEE0\uFE0F",
  ".eslintrc.json": "\uD83D\uDCCF",
  ".eslintrc.js": "\uD83D\uDCCF",
  "eslint.config.mjs": "\uD83D\uDCCF",
  ".prettierrc": "\uD83D\uDCCF",
};

export function getFileIcon(name: string, type: "folder" | "file"): string {
  if (type === "folder") return "\uD83D\uDCC1";

  // Check exact name match first
  if (nameIcons[name]) return nameIcons[name];

  // Check test files
  if (name.includes(".test.") || name.includes(".spec.")) return "\uD83E\uDDEA";

  // Check extension
  const lastDot = name.lastIndexOf(".");
  if (lastDot !== -1) {
    const ext = name.slice(lastDot);
    if (extensionIcons[ext]) return extensionIcons[ext];
  }

  return "\uD83D\uDCC4";
}

const languageMap: Record<string, { name: string; explanation: string }> = {
  ".ts": { name: "TypeScript", explanation: "a stricter version of JavaScript, the language that makes websites interactive" },
  ".tsx": { name: "TypeScript React", explanation: "TypeScript code that also defines what users see on screen (buttons, forms, etc.)" },
  ".js": { name: "JavaScript", explanation: "the language that makes websites interactive — it runs in your browser" },
  ".jsx": { name: "JavaScript React", explanation: "JavaScript that also defines what users see on screen" },
  ".json": { name: "JSON", explanation: "a structured data format — think of it like a very organized list" },
  ".md": { name: "Markdown", explanation: "a simple text format for writing documents with headers and links" },
  ".css": { name: "CSS", explanation: "the styling language — it controls colors, fonts, spacing, and layout" },
  ".scss": { name: "SCSS", explanation: "an enhanced version of CSS with more features for styling" },
  ".html": { name: "HTML", explanation: "the language that defines the structure of a web page" },
  ".py": { name: "Python", explanation: "a popular general-purpose programming language known for being readable" },
  ".rb": { name: "Ruby", explanation: "a programming language designed to make developers happy and productive" },
  ".go": { name: "Go", explanation: "a fast programming language made by Google for building servers" },
  ".rs": { name: "Rust", explanation: "a language focused on speed and safety" },
  ".sh": { name: "Shell Script", explanation: "a script that runs commands in the terminal, like a recipe for the computer" },
  ".yaml": { name: "YAML", explanation: "a configuration format that uses indentation to organize settings" },
  ".yml": { name: "YAML", explanation: "a configuration format that uses indentation to organize settings" },
  ".toml": { name: "TOML", explanation: "a configuration file format that's easy for humans to read" },
  ".sql": { name: "SQL", explanation: "the language for talking to databases — asking questions about stored data" },
  ".graphql": { name: "GraphQL", explanation: "a language for requesting specific data from a server" },
  ".dockerfile": { name: "Dockerfile", explanation: "instructions for creating a portable package of the app that runs anywhere" },
};

export function getLanguageInfo(name: string): { name: string; explanation: string } {
  const lastDot = name.lastIndexOf(".");
  if (lastDot !== -1) {
    const ext = name.slice(lastDot);
    if (languageMap[ext]) return languageMap[ext];
  }

  if (name === "Dockerfile") return languageMap[".dockerfile"];
  if (name === "Makefile") return { name: "Makefile", explanation: "a recipe file that tells the computer how to build the project" };

  return { name: "Plain text", explanation: "a regular text file" };
}
