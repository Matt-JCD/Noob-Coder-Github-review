import { TreeNode, ColumnItem } from "@/types";
import { getFileIcon } from "@/lib/fileIcons";
import { isHidden } from "@/lib/filter";

export interface Recommendation {
  path: string;
  reason: string;
}

const FOLDER_HINTS: Record<string, string> = {
  src: "Core application code",
  app: "Core application code",
  lib: "Shared libraries and utilities",
  packages: "Project packages (monorepo)",
  api: "API and server logic",
  routes: "API and server logic",
  server: "API and server logic",
  components: "UI building blocks",
  ui: "UI building blocks",
  pages: "App pages and views",
  config: "Configuration and infrastructure",
  ".github": "GitHub workflows and CI/CD",
  infra: "Infrastructure setup",
  terraform: "Infrastructure as code",
  agents: "AI agent logic",
  prompts: "AI prompts and templates",
  hooks: "Reusable logic hooks",
  utils: "Helper utilities",
  services: "Service layer",
  prisma: "Database schema and migrations",
};

const FILE_HINTS: Record<string, string> = {
  "package.json": "Key config — defines project dependencies",
  "docker-compose.yml": "Key config — defines how services run together",
  "docker-compose.yaml": "Key config — defines how services run together",
  "prisma/schema.prisma": "Key config — defines the database structure",
  Dockerfile: "Key config — defines how to package the app",
};

export function getRecommendedFolders(
  tree: TreeNode[],
  showHidden: boolean
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const rootItems = getChildrenAtPath(tree, "", showHidden);

  // Check folder name hints
  for (const item of rootItems) {
    if (item.type === "folder" && FOLDER_HINTS[item.name]) {
      recommendations.push({ path: item.path, reason: FOLDER_HINTS[item.name] });
    }
    if (item.type === "file" && FILE_HINTS[item.name]) {
      recommendations.push({ path: item.path, reason: FILE_HINTS[item.name] });
    }
  }

  // Find largest folder if not already recommended
  const folders = rootItems.filter((i) => i.type === "folder" && i.childCount !== undefined);
  if (folders.length > 0) {
    const largest = folders.reduce((a, b) =>
      (a.childCount || 0) > (b.childCount || 0) ? a : b
    );
    if (
      largest.childCount &&
      largest.childCount > 5 &&
      !recommendations.some((r) => r.path === largest.path)
    ) {
      recommendations.push({
        path: largest.path,
        reason: `Largest folder (${largest.childCount} items)`,
      });
    }
  }

  // Cap at 5 recommendations
  return recommendations.slice(0, 5);
}

export function getChildrenAtPath(
  tree: TreeNode[],
  parentPath: string,
  showHidden: boolean
): ColumnItem[] {
  const prefix = parentPath === "" ? "" : parentPath + "/";
  const children: ColumnItem[] = [];
  const seen = new Set<string>();

  for (const node of tree) {
    // Must start with the prefix
    if (parentPath !== "" && !node.path.startsWith(prefix)) continue;
    // For root level, skip items that have a prefix (nested items)
    if (parentPath === "" && node.path.includes("/")) continue;
    // For non-root, the remaining path after prefix should not contain /
    if (parentPath !== "") {
      const remaining = node.path.slice(prefix.length);
      if (remaining.includes("/")) continue;
      if (remaining === "") continue;
    }

    if (!showHidden && isHidden(node.path)) continue;
    if (seen.has(node.path)) continue;
    seen.add(node.path);

    const name = parentPath === "" ? node.path : node.path.slice(prefix.length);
    const type = node.type === "tree" ? "folder" : "file";

    // Count children for folders
    let childCount: number | undefined;
    if (type === "folder") {
      const folderPrefix = node.path + "/";
      childCount = 0;
      const folderSeen = new Set<string>();
      for (const child of tree) {
        if (!child.path.startsWith(folderPrefix)) continue;
        const rem = child.path.slice(folderPrefix.length);
        if (rem.includes("/")) continue;
        if (!showHidden && isHidden(child.path)) continue;
        if (folderSeen.has(child.path)) continue;
        folderSeen.add(child.path);
        childCount++;
      }
    }

    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : undefined;

    children.push({
      name,
      path: node.path,
      type,
      extension: ext,
      childCount,
      size: node.size,
      isLoading: false,
    });
  }

  // Sort: folders first, then alphabetical
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return children;
}
