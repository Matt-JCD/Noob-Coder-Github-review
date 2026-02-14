const HIDDEN_PATTERNS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "__pycache__",
  ".DS_Store",
  ".vscode",
  ".idea",
  ".cache",
  ".turbo",
  "coverage",
  ".nyc_output",
  ".parcel-cache",
  ".vercel",
  ".netlify",
  "out",
];

const HIDDEN_EXTENSIONS = [".lock", ".log"];

const HIDDEN_FILES = [
  ".DS_Store",
  "Thumbs.db",
  ".gitattributes",
  ".editorconfig",
  ".browserslistrc",
];

export function isHidden(path: string): boolean {
  const parts = path.split("/");
  const name = parts[parts.length - 1];

  // Check if any path segment matches hidden patterns
  for (const part of parts) {
    if (HIDDEN_PATTERNS.includes(part)) return true;
  }

  // Check exact file names
  if (HIDDEN_FILES.includes(name)) return true;

  // Check extensions
  for (const ext of HIDDEN_EXTENSIONS) {
    if (name.endsWith(ext)) return true;
  }

  return false;
}

export function countHidden(paths: string[]): number {
  return paths.filter(isHidden).length;
}
