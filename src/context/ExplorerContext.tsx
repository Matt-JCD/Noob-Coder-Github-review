"use client";

import React, { createContext, useContext, useReducer, useCallback, useRef } from "react";
import {
  ExplorerState,
  ExplorerAction,
  TreeNode,
  RepoMeta,
  ColumnItem,
  FileDetailData,
} from "@/types";
import { getChildrenAtPath, getRecommendedFolders } from "@/lib/tree";

const initialState: ExplorerState = {
  repoMeta: null,
  tree: [],
  columns: [],
  fileDetail: null,
  showHidden: false,
  isLoadingRepo: false,
  error: null,
  explanationCache: {},
  tokenUsage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 },
  recommendedPaths: [],
};

function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case "SET_LOADING_REPO":
      return { ...state, isLoadingRepo: action.payload, error: null };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoadingRepo: false };

    case "SET_REPO": {
      const { meta, tree } = action.payload;
      const rootItems = getChildrenAtPath(tree, "", state.showHidden);
      const recommendations = getRecommendedFolders(tree, state.showHidden);
      return {
        ...state,
        repoMeta: meta,
        tree,
        columns: [{ path: "", items: rootItems }],
        fileDetail: null,
        isLoadingRepo: false,
        error: null,
        recommendedPaths: recommendations,
      };
    }

    case "SELECT_FOLDER": {
      const { depth, path, items } = action.payload;
      // Truncate columns to depth + 1, then add new column
      const newColumns = state.columns.slice(0, depth + 1);
      // Mark selected item in the current column
      if (newColumns[depth]) {
        newColumns[depth] = { ...newColumns[depth], selectedPath: path };
      }
      newColumns.push({ path, items });
      return { ...state, columns: newColumns, fileDetail: null };
    }

    case "SELECT_FILE": {
      const { depth, path } = action.payload;
      // Truncate columns to depth + 1
      const newColumns = state.columns.slice(0, depth + 1);
      // Mark selected item
      if (newColumns[depth]) {
        newColumns[depth] = { ...newColumns[depth], selectedPath: path };
      }
      return {
        ...state,
        columns: newColumns,
        fileDetail: {
          name: path.split("/").pop() || path,
          path,
          language: "",
          languageExplanation: "",
          summary: "",
          keyFunctions: [],
          dependencies: [],
          thingsToKnow: [],
          content: "",
          isLoading: true,
        },
      };
    }

    case "SET_FILE_DETAIL":
      return { ...state, fileDetail: action.payload };

    case "SET_FILE_DETAIL_LOADING":
      if (!state.fileDetail) return state;
      return {
        ...state,
        fileDetail: { ...state.fileDetail, isLoading: action.payload },
      };

    case "SET_EXPLANATIONS": {
      const { folderPath, explanations } = action.payload;
      // Update the matching column's items with explanations
      const newColumns = state.columns.map((col) => {
        if (col.path !== folderPath) return col;
        return {
          ...col,
          items: col.items.map((item) => ({
            ...item,
            explanation: explanations[item.name] ?? item.explanation,
            isLoading: explanations[item.name] !== undefined ? false : item.isLoading,
          })),
        };
      });
      // Update cache
      const newCache = { ...state.explanationCache };
      if (!newCache[folderPath]) newCache[folderPath] = {};
      Object.assign(newCache[folderPath], explanations);
      return { ...state, columns: newColumns, explanationCache: newCache };
    }

    case "TOGGLE_HIDDEN": {
      const newShowHidden = !state.showHidden;
      // Rebuild all columns with new filter
      const newColumns = state.columns.map((col) => {
        const items = getChildrenAtPath(state.tree, col.path, newShowHidden);
        // Re-apply cached explanations
        const cached = state.explanationCache[col.path] || {};
        const itemsWithExplanations = items.map((item) => ({
          ...item,
          explanation: cached[item.name],
          isLoading: cached[item.name] ? false : item.isLoading,
        }));
        return { ...col, items: itemsWithExplanations };
      });
      return { ...state, showHidden: newShowHidden, columns: newColumns };
    }

    case "NAVIGATE_TO_DEPTH": {
      const depth = action.payload;
      const newColumns = state.columns.slice(0, depth + 1);
      if (newColumns[depth]) {
        newColumns[depth] = { ...newColumns[depth], selectedPath: undefined };
      }
      return { ...state, columns: newColumns, fileDetail: null };
    }

    case "SET_DEEP_DIVE": {
      const { folderPath, itemName, explanation } = action.payload;
      const newColumns = state.columns.map((col) => {
        if (col.path !== folderPath) return col;
        return {
          ...col,
          items: col.items.map((item) =>
            item.name === itemName
              ? { ...item, explanation, isLoading: false, isDeepDive: true }
              : item
          ),
        };
      });
      // Update cache
      const newCache = { ...state.explanationCache };
      if (!newCache[folderPath]) newCache[folderPath] = {};
      newCache[folderPath][itemName] = explanation;
      return { ...state, columns: newColumns, explanationCache: newCache };
    }

    case "SET_ITEMS_LOADING": {
      const { folderPath, itemNames } = action.payload;
      const nameSet = new Set(itemNames);
      const newColumns = state.columns.map((col) => {
        if (col.path !== folderPath) return col;
        return {
          ...col,
          items: col.items.map((item) => ({
            ...item,
            isLoading: nameSet.has(item.name) ? true : item.isLoading,
          })),
        };
      });
      return { ...state, columns: newColumns };
    }

    case "UPDATE_TOKEN_USAGE": {
      const newInput = state.tokenUsage.inputTokens + action.payload.inputTokens;
      const newOutput = state.tokenUsage.outputTokens + action.payload.outputTokens;
      const newCost = state.tokenUsage.estimatedCost + action.payload.cost;
      return {
        ...state,
        tokenUsage: { inputTokens: newInput, outputTokens: newOutput, estimatedCost: newCost },
      };
    }

    case "RESET_TOKEN_USAGE":
      return { ...state, tokenUsage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0 } };

    default:
      return state;
  }
}

interface ExplorerContextValue {
  state: ExplorerState;
  dispatch: React.Dispatch<ExplorerAction>;
  loadRepo: (url: string, token?: string) => Promise<void>;
  selectFolder: (depth: number, path: string) => void;
  selectFile: (depth: number, path: string) => void;
  requestExplanations: (folderPath: string, items: ColumnItem[]) => void;
  requestDeepDive: (folderPath: string, item: ColumnItem) => void;
  toggleHidden: () => void;
  navigateToDepth: (depth: number) => void;
  resetTokenUsage: () => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(explorerReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const tokenRef = useRef<string | undefined>(undefined);

  const requestExplanations = useCallback(
    async (folderPath: string, items: ColumnItem[]) => {
      const currentState = stateRef.current;
      // Check cache, only request uncached
      const cached = currentState.explanationCache[folderPath] || {};
      const uncachedItems = items.filter((item) => !cached[item.name]);

      // Apply cached explanations immediately
      if (Object.keys(cached).length > 0) {
        dispatch({
          type: "SET_EXPLANATIONS",
          payload: { folderPath, explanations: cached },
        });
      }

      if (uncachedItems.length === 0) return;

      // Mark items as loading
      dispatch({
        type: "SET_ITEMS_LOADING",
        payload: {
          folderPath,
          itemNames: uncachedItems.map((i) => i.name),
        },
      });

      // Build batch items with children info
      const batchItems = uncachedItems.map((item) => {
        let childrenStr: string | undefined;
        if (item.type === "folder") {
          const children = getChildrenAtPath(
            currentState.tree,
            item.path,
            currentState.showHidden
          );
          childrenStr = children
            .slice(0, 10)
            .map((c) => c.name)
            .join(", ");
          if (children.length > 10) childrenStr += `, ... (${children.length} total)`;
        }
        return {
          name: item.name,
          type: item.type,
          children: childrenStr,
          extension: item.extension,
        };
      });

      // Process items in chunks of 2 so results stream in one batch at a time
      const CHUNK_SIZE = 2;
      const totalChunks = Math.ceil(batchItems.length / CHUNK_SIZE);
      console.log(`[explain] ${batchItems.length} items, ${totalChunks} chunks for ${folderPath}`);

      for (let i = 0; i < batchItems.length; i += CHUNK_SIZE) {
        const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
        const chunk = batchItems.slice(i, i + CHUNK_SIZE);
        console.log(`[explain] Chunk ${chunkIndex}/${totalChunks}: ${chunk.map(c => c.name).join(", ")}`);

        try {
          const res = await fetch("/api/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: chunk,
              repoDescription: currentState.repoMeta?.description || "",
              repoKey: `${currentState.repoMeta?.owner}/${currentState.repoMeta?.repo}`,
              folderPath,
            }),
          });

          if (!res.ok) {
            const errorText = await res.text().catch(() => "");
            console.error(`[explain] Chunk ${chunkIndex} failed: ${res.status} ${errorText}`);
            const fallback: Record<string, string> = {};
            chunk.forEach((item) => { fallback[item.name] = "Unable to explain this item."; });
            dispatch({
              type: "SET_EXPLANATIONS",
              payload: { folderPath, explanations: fallback },
            });
            continue;
          }

          const data = await res.json();
          const receivedCount = Object.keys(data.explanations || {}).length;
          console.log(`[explain] Chunk ${chunkIndex} returned ${receivedCount} explanations`);
          dispatch({
            type: "SET_EXPLANATIONS",
            payload: { folderPath, explanations: data.explanations },
          });
          if (data.usage) {
            dispatch({ type: "UPDATE_TOKEN_USAGE", payload: data.usage });
          }
        } catch (err) {
          console.error(`[explain] Chunk ${chunkIndex} error:`, err);
          const fallback: Record<string, string> = {};
          chunk.forEach((item) => { fallback[item.name] = "Unable to explain this item."; });
          dispatch({
            type: "SET_EXPLANATIONS",
            payload: { folderPath, explanations: fallback },
          });
        }
      }
      console.log(`[explain] All ${totalChunks} chunks complete for ${folderPath}`);
    },
    []
  );

  const requestDeepDive = useCallback(
    async (folderPath: string, item: ColumnItem) => {
      const currentState = stateRef.current;

      // Mark item as loading
      dispatch({
        type: "SET_ITEMS_LOADING",
        payload: { folderPath, itemNames: [item.name] },
      });

      try {
        let childrenStr: string | undefined;
        if (item.type === "folder") {
          const kids = getChildrenAtPath(
            currentState.tree,
            item.path,
            currentState.showHidden
          );
          childrenStr = kids
            .slice(0, 10)
            .map((c) => c.name)
            .join(", ");
          if (kids.length > 10) childrenStr += `, ... (${kids.length} total)`;
        }

        const res = await fetch("/api/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            type: item.type,
            path: item.path,
            repoDescription: currentState.repoMeta?.description || "",
            children: childrenStr,
            extension: item.extension,
          }),
        });

        if (!res.ok) {
          // Restore original explanation on error
          dispatch({
            type: "SET_EXPLANATIONS",
            payload: { folderPath, explanations: { [item.name]: item.explanation || "" } },
          });
          return;
        }

        const data = await res.json();
        dispatch({
          type: "SET_DEEP_DIVE",
          payload: { folderPath, itemName: item.name, explanation: data.explanation },
        });
        if (data.usage) {
          dispatch({ type: "UPDATE_TOKEN_USAGE", payload: data.usage });
        }
      } catch (err) {
        console.error("Deep dive failed:", err);
        dispatch({
          type: "SET_EXPLANATIONS",
          payload: { folderPath, explanations: { [item.name]: item.explanation || "" } },
        });
      }
    },
    []
  );

  const loadRepo = useCallback(
    async (url: string, token?: string) => {
      tokenRef.current = token;
      dispatch({ type: "SET_LOADING_REPO", payload: true });

      try {
        const res = await fetch("/api/repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, token }),
        });

        const data = await res.json();

        if (!res.ok) {
          dispatch({ type: "SET_ERROR", payload: data.error || "Failed to load repository" });
          return;
        }

        dispatch({
          type: "SET_REPO",
          payload: { meta: data.meta, tree: data.tree },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to load repository",
        });
      }
    },
    []
  );

  const selectFolder = useCallback(
    (depth: number, path: string) => {
      const currentState = stateRef.current;
      const items = getChildrenAtPath(
        currentState.tree,
        path,
        currentState.showHidden
      );

      // Apply cached explanations if any, but don't auto-request new ones
      const cached = currentState.explanationCache[path] || {};
      const itemsWithCache = items.map((item) => ({
        ...item,
        explanation: cached[item.name],
        isLoading: false,
      }));

      dispatch({
        type: "SELECT_FOLDER",
        payload: { depth, path, items: itemsWithCache },
      });
    },
    []
  );

  const selectFile = useCallback(
    async (depth: number, path: string) => {
      const currentState = stateRef.current;
      dispatch({ type: "SELECT_FILE", payload: { depth, path } });

      try {
        const res = await fetch("/api/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner: currentState.repoMeta?.owner,
            repo: currentState.repoMeta?.repo,
            path,
            token: tokenRef.current,
            repoDescription: currentState.repoMeta?.description || "",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          dispatch({
            type: "SET_FILE_DETAIL",
            payload: {
              name: path.split("/").pop() || path,
              path,
              language: "",
              languageExplanation: "",
              summary: data.error || "Failed to load file details.",
              keyFunctions: [],
              dependencies: [],
              thingsToKnow: [],
              content: "",
              isLoading: false,
            },
          });
          return;
        }

        const data = await res.json();
        dispatch({
          type: "SET_FILE_DETAIL",
          payload: { ...data, isLoading: false },
        });
        if (data.usage) {
          dispatch({ type: "UPDATE_TOKEN_USAGE", payload: data.usage });
        }
      } catch (err) {
        dispatch({
          type: "SET_FILE_DETAIL",
          payload: {
            name: path.split("/").pop() || path,
            path,
            language: "",
            languageExplanation: "",
            summary: "Failed to load file details.",
            keyFunctions: [],
            dependencies: [],
            thingsToKnow: [],
            content: "",
            isLoading: false,
          },
        });
      }
    },
    []
  );

  const toggleHidden = useCallback(() => {
    dispatch({ type: "TOGGLE_HIDDEN" });
  }, []);

  const navigateToDepth = useCallback((depth: number) => {
    dispatch({ type: "NAVIGATE_TO_DEPTH", payload: depth });
  }, []);

  const resetTokenUsage = useCallback(() => {
    dispatch({ type: "RESET_TOKEN_USAGE" });
  }, []);

  return (
    <ExplorerContext.Provider
      value={{
        state,
        dispatch,
        loadRepo,
        selectFolder,
        selectFile,
        requestExplanations,
        requestDeepDive,
        toggleHidden,
        navigateToDepth,
        resetTokenUsage,
      }}
    >
      {children}
    </ExplorerContext.Provider>
  );
}

export function useExplorer(): ExplorerContextValue {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error("useExplorer must be used within ExplorerProvider");
  return ctx;
}
