export interface RepoMeta {
  owner: string;
  repo: string;
  description: string;
  defaultBranch: string;
  stars: number;
  language: string;
}

export interface TreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface ColumnItem {
  name: string;
  path: string;
  type: "folder" | "file";
  extension?: string;
  childCount?: number;
  explanation?: string;
  isLoading?: boolean;
}

export interface Column {
  path: string;
  items: ColumnItem[];
  selectedPath?: string;
}

export interface FileDetailData {
  name: string;
  path: string;
  language: string;
  languageExplanation: string;
  summary: string;
  keyFunctions: { name: string; explanation: string }[];
  dependencies: { name: string; why: string }[];
  thingsToKnow: string[];
  content: string;
  isLoading?: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export interface ExplorerState {
  repoMeta: RepoMeta | null;
  tree: TreeNode[];
  columns: Column[];
  fileDetail: FileDetailData | null;
  showHidden: boolean;
  isLoadingRepo: boolean;
  error: string | null;
  explanationCache: Record<string, Record<string, string>>;
  tokenUsage: TokenUsage;
  recommendedPaths: { path: string; reason: string }[];
}

export type ExplorerAction =
  | { type: "SET_LOADING_REPO"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_REPO"; payload: { meta: RepoMeta; tree: TreeNode[] } }
  | { type: "SELECT_FOLDER"; payload: { depth: number; path: string; items: ColumnItem[] } }
  | { type: "SELECT_FILE"; payload: { depth: number; path: string } }
  | { type: "SET_FILE_DETAIL"; payload: FileDetailData | null }
  | { type: "SET_FILE_DETAIL_LOADING"; payload: boolean }
  | { type: "SET_EXPLANATIONS"; payload: { folderPath: string; explanations: Record<string, string> } }
  | { type: "TOGGLE_HIDDEN" }
  | { type: "NAVIGATE_TO_DEPTH"; payload: number }
  | { type: "SET_ITEMS_LOADING"; payload: { folderPath: string; itemNames: string[] } }
  | { type: "UPDATE_TOKEN_USAGE"; payload: { inputTokens: number; outputTokens: number } }
  | { type: "RESET_TOKEN_USAGE" };
